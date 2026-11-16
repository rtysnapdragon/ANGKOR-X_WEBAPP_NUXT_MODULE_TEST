import json from "../assets/json/menu_data.json";
import { useCookie } from "nuxt/app";
import devPermission from "../assets/json/dev_permission.json";
import techPermission from "../assets/json/tech_permission.json";

const { str, config,api } = helper();

export default async () => {
  let result = [];
  let allMenu = []

  try {
    let customerMenu = await getCustomMenu();
    allMenu = [...(json ?? []), ...(customerMenu ?? [])];

    const { data, error } = await useHttp(api.permissions, { method: "post" });
    // console.log("data of userpermission in useMenuData.js =====> ", isNotEmpty(data.value))
    // console.log("error.value =============>> ", error.value)

    if (error.value) throw error.value;

    // The backend now returns `{ Permissions, Roles, Items: <tree>, ... }`;
    // older builds returned the tree array directly.
    const permissions = flattenPermissionData(
      Array.isArray(data.value) ? data.value : data.value?.Items ?? []
    );

    // const isTeacher = extractDataFromAccessToken()["o:t"] == "Teacher";

    // // Add permission module teacher
    // if (isTeacher) {
    //   permissions.unshift(techPermission);
    // }

    // Add permission dev
    if (isDevelopment()) {
      permissions.unshift(devPermission);
    }

    // Remove if hide is global and db code is "_"
    // This is used to hide global menu items for specific databases
    // For example, if a menu item is only for a specific database and should not be shown globally
    const dbCode = useCookie(str.dbCode).value;

    // allMenu = allMenu.map((item) => ({
    //   ...item,
    //   menu: (item.menu || []).filter(
    //     (menuItem) => !(menuItem.hideGlobal && dbCode === "_")
    //   ),
    // }));

    // console.log("All -------------------->", allMenu);
    result = checkMenuWithPermission(permissions, allMenu);
  } catch (e) {
    console.log("Get permission error:", e);
  }
  
  // return allMenu;
  // return result;

  // RBAC is the authority for what the signed-in user may see. The legacy
  // permission pass above (`result`) is kept for compatibility, but the menu
  // rendered by the sidebar is filtered against the backend RBAC context.
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
  } catch (error) {
    return null;
  }
}

function checkMenuWithPermission(permissions, menuItems) {
  if (!Array.isArray(menuItems)) return [];

  return menuItems.flatMap((menuItem) => {
    const permissionResult = checkActionImmutable(permissions, menuItem);

    if (!permissionResult) return [];

    const hasMenu = Array.isArray(menuItem?.menu);
    const hasDetails = Array.isArray(menuItem?.details);

    if (hasMenu && hasDetails) {
      const filteredSubMenu = checkMenuWithPermission(
        permissions,
        menuItem.menu
      );
      const filteredDetails = checkMenuWithPermission(
        permissions,
        menuItem.details
      );

      if (filteredSubMenu.length || filteredDetails.length) {
        return [
          {
            ...menuItem,
            ...permissionResult,
            menu: filteredSubMenu,
            details: filteredDetails,
          },
        ];
      }
      return [];
    }

    // Handle items with only menu
    if (hasMenu) {
      const filteredSubMenu = checkMenuWithPermission(
        permissions,
        menuItem.menu
      );
      return filteredSubMenu.length
        ? [{ ...menuItem, ...permissionResult, menu: filteredSubMenu }]
        : [];
    }

    // Handle items with only details
    if (hasDetails) {
      const filteredDetails = checkMenuWithPermission(
        permissions,
        menuItem.details
      );
      return filteredDetails.length
        ? [{ ...menuItem, ...permissionResult, details: filteredDetails }]
        : [];
    }

    // Handle leaf items (no nested menu or details)
    return [{ ...menuItem, ...permissionResult }];
  });
}

function checkActionImmutable(permissions, menu) {
  if (!menu.permission) return {};

  let matchingPermission = permissions.find((p) => {
    const permName = (menu.permission ?? "").trim();

    return (
      p.Name.trim() === permName &&
      (!p.InDevelopment || (p.InDevelopment && isDevelopment()))
    );
  });

  if (!matchingPermission) return null;

  return { actions: matchingPermission.Actions };
}

// Flatten Permission Data
function flattenPermissionData(data, list = []) {
  // console.log("Data and list in  flattenPermissionData ---->", data, list);
  (data ?? []).forEach((e) => {
    const children = e.Children || [];
    list.push(...children);

    if (children.length) {
      flattenPermissionData(children, list);
    }
  });

  const finalPermisison = list.filter(
    (e) => Array.isArray(e.Actions) && e.Actions.some((f) => f.Value === 1)
  );
  // console.log("finalPermisison ===============> ", finalPermisison)
  return finalPermisison
}

function isDevelopment() {
  try {
    return config.isDevelopment;
  } catch (e) {
    console.log("Error", e);
    return false;
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
