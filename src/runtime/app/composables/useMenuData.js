import json from "~/assets/json/menu_data.json";
import api from '../../../../../../RITHTHY_CMS_MANAGEMENT_NUXT/app/helpers/apis'

const { str } = helper();

export default async () => {
  let allMenu = []

  try {
    let customerMenu = await getCustomMenu();
    allMenu = [...(json ?? []), ...(customerMenu ?? [])];

    const { error } = await useRHttp(api.permissions, { method: "post" });
    if (error.value) throw error.value;
  } catch {}
  
  return filterMenuByRbac(allMenu);
};
async function getCustomMenu() {
  try {
    const response = await fetch("/customer/customMenu.json");

    if (!response.ok) {
      throw new Error("Failed to fetch customerMenu.json");
    }
    const menuData = await response.json();
    return menuData;
  } catch {
    return null;
  }
}


// 0 no permission 1 have 2 empty

/**
 * RBAC filtering for the sidebar menu.
 *
 * The backend RBAC context (`/api/v1/rbac/me`, mirrored by `usePermissionConfig()`) is the
 * authority for what the signed-in user may see, so each menu item may declare:
 *
 *   "role":       role code(s) the user must hold  (checked with `hasRole`)
 *   "permission": permission code(s) the user must hold (checked with `can`)
 *
 * Both accept a single value or an array; arrays pass when ANY value matches
 * (`canAny`). Items without either field are always visible. When an item has
 * nested children (`children`, `menu` or `details`), the parent is kept only
 * while at least one child survives.
 *
 * The check fails open while the RBAC context has not loaded yet, so the sidebar
 * is never blank on first paint - the same contract as
 * `useMenuStore().getActionPermission`.
 */
function filterMenuByRbac(menuItems) {
  if (!Array.isArray(menuItems)) return [];

  let rbac;
  try {
    rbac = usePermissionConfig();
  } catch (e) {
    // Outside a Nuxt context (or the composable is missing) - show everything.
    console.log("RBAC unavailable, showing full menu:", e);
    return menuItems;
  }

  // The context has not arrived yet - never hide items prematurely.
  if (!rbac || !rbac.loaded?.value) return menuItems;

  const dbCode = useCookie(str.dbCode).value;

  return filterRbacItems(rbac, menuItems, dbCode);
}

function filterRbacItems(rbac, menuItems, dbCode) {
  return (menuItems ?? []).flatMap((item) => {
    // Hide global-only entries while a concrete database is selected.
    if (item.hideGlobal && dbCode === "_") return [];

    if (!matchesRole(rbac, item)) return [];
    if (!matchesPermission(rbac, item)) return [];

    const childKey = ["children", "menu", "details"].find((k) =>
      Array.isArray(item?.[k])
    );

    if (!childKey) return [item];

    const children = filterRbacItems(rbac, item[childKey], dbCode);

    // A group with no reachable child is not shown at all.
    if (!children.length) return [];

    return [{ ...item, [childKey]: children }];
  });
}

function matchesRole(rbac, item) {
  const required = normalizeGate(item?.role);

  if (!required.length) return true;
  if (rbac.isSuperuser?.value) return true;

  return required.some((code) => rbac.hasRole(code));
}

function matchesPermission(rbac, item) {
  const required = normalizeGate(item?.permission);

  if (!required.length) return true;

  return rbac.canAny(required);
}

function normalizeGate(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}
