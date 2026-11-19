# API URL Documentation — New Required Endpoints

> **Updated by:** required endpoint specification for the file manager asset-category UI.
> **Scope:** missing asset-category APIs needed by `RFileManagerContent.vue` settings.
> **Status:** all endpoints in this document are **REQUIRED / NOT IMPLEMENTED**.
> **Reference:** `API_URL_DOC.md` contains the currently discovered backend routes. It has no file-manager asset-category CRUD endpoints.

## Summary

- **Required new endpoints:** 5
- **Required existing endpoint changes:** 0 (optional enhancements listed at the end)
- **Primary source file (proposed):** `app/api/v1/endpoints/file_explorer.py`
- **Router (proposed):** `router` with prefix `/file_explorer`, resolved base `/api/v1/file_explorer`
- **Tags (proposed):** `['File Explorer']`
- **Current frontend fallback:** `localStorage` key `rfm_categories`
- **Current frontend component:** `src/runtime/app/components/filemanager/RFileManagerContent.vue`

## Table of Contents

1. [Asset Categories (Required)](#asset-categories-required)
2. [Endpoint Details](#endpoint-details)
3. [Schemas](#schemas)
4. [Validation and Access Rules](#validation-and-access-rules)
5. [Frontend Field Mapping](#frontend-field-mapping)
6. [Optional Enhancements to Existing Endpoints](#optional-enhancements-to-existing-endpoints)
7. [Update Notes](#update-notes)

---

## Asset Categories (Required)

- **Source files:** `app/api/v1/endpoints/file_explorer.py` (proposed)
- **Endpoints:** 5
- **Mount/status:** required (not implemented)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/file_explorer/categories/list` | `categories_list` | List asset categories | required (not implemented) |
| 2 | `POST` | `/api/v1/file_explorer/categories/create` | `categories_create` | Create an asset category | required (not implemented) |
| 3 | `POST` | `/api/v1/file_explorer/categories/update` | `categories_update` | Update an asset category | required (not implemented) |
| 4 | `GET` | `/api/v1/file_explorer/categories/delete` | `categories_delete` | Delete asset categories | required (not implemented) |
| 5 | `POST` | `/api/v1/file_explorer/categories/reorder` | `categories_reorder` | Reorder asset categories | required (not implemented) |

### Endpoint details

#### 1. `POST` `/api/v1/file_explorer/categories/list`

- **Handler:** `categories_list` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py` (proposed)
- **Defined path:** `/categories/list`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** required (not implemented)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `AssetCategoryListResponse`

**Parameters (proposed):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryListPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.list'))` | `dependency` | {'arg': "_guard('system.file_explorer.list')"} |

**Request example:**

```json
{
  "Search": "image",
  "IncludeBuiltin": true,
  "Page": 1,
  "PageSize": 100,
  "SortBy": "SortOrder",
  "SortOrder": "asc"
}
```

**Response example:**

```json
{
  "Items": [
    {
      "Id": 1,
      "Name": "Images",
      "Slug": "images",
      "Extensions": ["jpeg", "png", "gif", "bmp", "webp"],
      "IsPrivate": false,
      "Icon": "i-lucide-image",
      "SortOrder": 10,
      "IsBuiltin": true,
      "FileCount": 42,
      "CreatedAt": "2026-01-01T00:00:00Z",
      "UpdatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "Total": 1
}
```

#### 2. `POST` `/api/v1/file_explorer/categories/create`

- **Handler:** `categories_create` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py` (proposed)
- **Defined path:** `/categories/create`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** required (not implemented)
- **Tags:** `['File Explorer']`
- **Status code:** `201 Created`
- **Response model:** `AssetCategoryRead`

**Parameters (proposed):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryCreatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.create'))` | `dependency` | {'arg': "_guard('system.file_explorer.create')"} |

**Request example:**

```json
{
  "Name": "Marketing assets",
  "Extensions": ["pdf", "png", "jpg"],
  "IsPrivate": true,
  "Icon": "i-lucide-briefcase",
  "SortOrder": 60
}
```

#### 3. `POST` `/api/v1/file_explorer/categories/update`

- **Handler:** `categories_update` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py` (proposed)
- **Defined path:** `/categories/update`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** required (not implemented)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `AssetCategoryRead`

**Parameters (proposed):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryUpdatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.update'))` | `dependency` | {'arg': "_guard('system.file_explorer.update')"} |

**Request example:**

```json
{
  "Id": 6,
  "Name": "Marketing assets",
  "Extensions": ["pdf", "png", "jpg", "webp"],
  "IsPrivate": false,
  "Icon": "i-lucide-briefcase",
  "SortOrder": 60
}
```

**Notes:**

- `Id` is required.
- Omitted fields keep their current values.
- Sending `Extensions` replaces the full allowed-extension list.
- Sending `IsPrivate` toggles private/public category behavior.

#### 4. `GET` `/api/v1/file_explorer/categories/delete`

- **Handler:** `categories_delete` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py` (proposed)
- **Defined path:** `/categories/delete`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** required (not implemented)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `MessageResponse`

**Parameters (proposed):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `id_` | `Optional[str]` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `ids` | `Optional[str]` | `Query(None, alias='Ids')` | `query` | {'arg': 'None', 'alias': "'Ids'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.delete'))` | `dependency` | {'arg': "_guard('system.file_explorer.delete')"} |

**Usage examples:**

```text
GET /api/v1/file_explorer/categories/delete?Id=6
GET /api/v1/file_explorer/categories/delete?Ids=6,7
```

**Notes:**

- All-or-nothing: every category is validated before any category is deleted.
- Built-in categories cannot be deleted and must return `409 Conflict`.
- Deleting a category does not delete files. Files remain in storage and simply stop matching the removed category.
- Use `400 Bad Request` when neither `Id` nor `Ids` is supplied.

#### 5. `POST` `/api/v1/file_explorer/categories/reorder`

- **Handler:** `categories_reorder` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py` (proposed)
- **Defined path:** `/categories/reorder`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** required (not implemented)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `AssetCategoryListResponse`

**Parameters (proposed):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryReorderPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.update'))` | `dependency` | {'arg': "_guard('system.file_explorer.update')"} |

**Request example:**

```json
{
  "Items": [
    { "Id": 1, "SortOrder": 10 },
    { "Id": 2, "SortOrder": 20 },
    { "Id": 6, "SortOrder": 30 }
  ]
}
```

**Notes:**

- Reorder must be atomic.
- Return the updated list in the new order.
- Reject duplicate `Id` values with `400 Bad Request`.
- Reject unknown category ids with `404 Not Found`.

---

## Schemas

### `CategoryListPayload`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `Search` | `string \| null` | No | `null` | Case-insensitive match on `Name` or `Slug`. |
| `IncludeBuiltin` | `boolean` | No | `true` | Include seeded/built-in categories. |
| `Page` | `integer` | No | `1` | 1-based page number. |
| `PageSize` | `integer` | No | `100` | Maximum `500`. |
| `SortBy` | `string` | No | `"SortOrder"` | `Name`, `SortOrder`, `CreatedAt`, `UpdatedAt`. |
| `SortOrder` | `string` | No | `"asc"` | `asc` or `desc`. |

### `CategoryCreatePayload`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `Name` | `string` | Yes | `` | 1–80 characters after trimming. |
| `Extensions` | `array[string]` | Yes | `` | At least 1 item. Normalized to lowercase without a leading dot. |
| `IsPrivate` | `boolean` | No | `false` | Private categories restrict public file access. |
| `Icon` | `string \| null` | No | `null` | Optional icon name, e.g. `i-lucide-image`. |
| `SortOrder` | `integer` | No | next value | Lower values appear first. |

### `CategoryUpdatePayload`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `Id` | `integer` | Yes | `` | Category id. |
| `Name` | `string` | No | unchanged | 1–80 characters after trimming. |
| `Extensions` | `array[string]` | No | unchanged | Replaces the full list when supplied. |
| `IsPrivate` | `boolean` | No | unchanged | Toggles private/public behavior. |
| `Icon` | `string \| null` | No | unchanged | Optional icon name. |
| `SortOrder` | `integer` | No | unchanged | Lower values appear first. |

### `CategoryReorderPayload`

| Field | Type | Required | Notes |
|---|---|---|---|
| `Items` | `array[CategoryOrderItem]` | Yes | At least 1 item. |

### `CategoryOrderItem`

| Field | Type | Required | Notes |
|---|---|---|---|
| `Id` | `integer` | Yes | Category id. |
| `SortOrder` | `integer` | Yes | New position value. |

### `AssetCategoryRead`

| Field | Type | Notes |
|---|---|---|
| `Id` | `integer` | Primary key. |
| `Name` | `string` | Display name. |
| `Slug` | `string` | Stable lowercase identifier used by the UI. |
| `Extensions` | `array[string]` | Normalized allowed extensions. |
| `IsPrivate` | `boolean` | Private-category flag. |
| `Icon` | `string \| null` | Optional icon name. |
| `SortOrder` | `integer` | Display order. |
| `IsBuiltin` | `boolean` | Seeded/default category. |
| `FileCount` | `integer` | Number of files matching this category's extensions. |
| `CreatedAt` | `datetime` | Creation timestamp. |
| `UpdatedAt` | `datetime` | Last update timestamp. |

### `AssetCategoryListResponse`

| Field | Type | Notes |
|---|---|---|
| `Items` | `array[AssetCategoryRead]` | Category rows. |
| `Total` | `integer` | Total matching rows before pagination. |

### `MessageResponse`

| Field | Type | Notes |
|---|---|---|
| `Message` | `string` | Human-readable result. |

---

## Validation and Access Rules

### Extension normalization

- Trim whitespace.
- Remove a leading dot: `.pdf` becomes `pdf`.
- Lowercase the value.
- Accept only `^[a-z0-9]+$`.
- Maximum 20 characters per extension.
- Deduplicate within the same category.
- Keep the submitted order after normalization.

### Category name

- Trim whitespace.
- Require 1–80 characters.
- Reject duplicate names case-insensitively with `409 Conflict`.

### Extension ownership

- An extension must belong to only one category.
- Reject an extension already assigned to another category with `409 Conflict`.
- This keeps file-to-category mapping deterministic and prevents private/public category conflicts.

### Private categories

- `IsPrivate = true` disables public access to files whose extensions belong to that category.
- Private-category files remain accessible to users with `system.file_explorer.read` or `system.file_explorer.list`.
- Public file endpoints must exclude private-category files unless the caller is authorized.

### Built-in categories

- `IsBuiltin = true` categories are seeded defaults such as Images, Videos, Audio, Documents, Archives, and PDFs.
- Built-in categories may be edited, including their extensions and private flag.
- Built-in categories cannot be deleted; return `409 Conflict`.

### Permissions

| Operation | Permission |
|---|---|
| List categories | `system.file_explorer.list` |
| Create category | `system.file_explorer.create` |
| Update category | `system.file_explorer.update` |
| Delete category | `system.file_explorer.delete` |
| Reorder categories | `system.file_explorer.update` |

### Common error responses

| Status | When |
|---|---|
| `400 Bad Request` | Invalid payload, missing `Id`/`Ids`, invalid extension, duplicate ids in reorder. |
| `401 Unauthorized` | Missing or invalid authentication. |
| `403 Forbidden` | Authenticated user lacks the required permission. |
| `404 Not Found` | Category id does not exist. |
| `409 Conflict` | Duplicate name, duplicate extension ownership, or deleting a built-in category. |
| `422 Unprocessable Entity` | FastAPI/Pydantic validation failure. |

---

## Frontend Field Mapping

| UI field | API field | Notes |
|---|---|---|
| `item.id` | `Slug` | Built-in categories use fixed slugs such as `images`, `documents`. |
| `item.name` | `Name` | Display label. |
| `item.extensions` | `Extensions` | Array of normalized extensions. |
| `item.private` | `IsPrivate` | Drives the private badge and checkbox. |
| `item.builtin` | `IsBuiltin` | Built-in rows should not expose delete. |
| `item.icon` | `Icon` | Optional; fall back to the existing local icon map. |
| `item.sortOrder` | `SortOrder` | Used by the reorder endpoint. |
| `item.fileCount` | `FileCount` | Optional card statistic. |

### Frontend integration points

- `loadCategories()` should call `POST /api/v1/file_explorer/categories/list` and map the response into the current `{ id, name, extensions, private, builtin }` shape.
- `saveCategory()` should call `categories/create` when `categoryDialog.mode === 'create'` and `categories/update` when `mode === 'edit'`.
- `deleteCategory()` should call `GET /api/v1/file_explorer/categories/delete?Id=<id>`.
- Reorder UI should call `POST /api/v1/file_explorer/categories/reorder`.
- Keep the `rfm_categories` localStorage fallback until the backend endpoints are available.
- Map `IsPrivate` to the existing `private` checkbox and card badge.
- Map `IsBuiltin` so built-in categories hide or disable the delete action.

---

## Optional Enhancements to Existing Endpoints

These are not required for the current category modal, but become useful once categories are server-backed.

### `POST` `/api/v1/file_explorer/files/list`

- Add optional `CategoryId` or `CategorySlug` to `FileListPayload`.
- Filter files by the category's extension list when supplied.
- Keep client-side extension filtering as a fallback.

### `ExplorerFileRead`

- Optionally add `CategoryId`, `CategorySlug`, and `CategoryName` for display in file rows.
- If extension ownership is unique, these fields can be derived server-side.

### `POST` `/api/v1/file_explorer/files/upload`

- Optionally add `CategoryId` as a form field to force an upload into a category.
- Validate that the uploaded file extension belongs to the selected category.
- Reject mismatches with `400 Bad Request`.

---

## Update Notes

- Created this document because `API_URL_DOC.md` has no asset-category endpoints for the file manager.
- The settings UI currently stores categories in `localStorage` under `rfm_categories`.
- The required endpoints mirror the existing file-explorer route style: `POST` for list/create/update/reorder and `GET` for delete.
- The category modal supports name, allowed extensions, and private visibility.
- The category page copy also mentions reorder; the reorder endpoint is included here even though the current UI does not expose drag-and-drop yet.
