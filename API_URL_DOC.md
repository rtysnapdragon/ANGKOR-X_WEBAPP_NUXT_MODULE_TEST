# API URL Documentation

> **Updated by:** static endpoint collection from project source (route decorators, `APIRouter`, `include_router`).
> **Scope:** all discovered route definitions in repository (excluding `.venv`, caches, `node_modules`).
> **Base notes:** most business APIs are mounted under `/api/v1`; some auth/bridge/chat/ws/system routes are app-level. "Resolved full path" is best-effort from source composition — verify runtime with `main.py`, `app/api/v1/router.py`, and `/openapi.json`.

## Summary

- **Total route definitions:** 471
- **Unique (methods, resolved path):** 417
- **Source files with routes:** 55
- **Mounted/active (inferred):** 427 definitions
- **Not mounted / legacy / unresolved:** 44 definitions

## Table of Contents

1. [System & Health](#system--health) (4 routes)
2. [Authentication (Core)](#authentication-core) (42 routes)
3. [User Profile](#user-profile) (10 routes)
4. [File Explorer (Multi-Provider)](#file-explorer-multi-provider) (23 routes)
5. [Dashboard API](#dashboard-api) (4 routes)
6. [RBAC (Roles & Permissions)](#rbac-roles--permissions) (11 routes)
7. [Employee & Signature](#employee--signature) (5 routes)
8. [User Management](#user-management) (10 routes)
9. [Address / Localization](#address--localization) (12 routes)
10. [AI Chat](#ai-chat) (1 routes)
11. [Artists](#artists) (11 routes)
12. [Artworks, Galleries & Collections](#artworks-galleries--collections) (24 routes)
13. [Chat (v1 API)](#chat-v1-api) (18 routes)
14. [CMS](#cms) (16 routes)
15. [CMS Management](#cms-management) (15 routes)
16. [Comments](#comments) (6 routes)
17. [Databases Controller](#databases-controller) (3 routes)
18. [Google Drive Activity & Audit (nested)](#google-drive-activity--audit-nested) (5 routes)
19. [Google Drive Labels & Metadata (nested)](#google-drive-labels--metadata-nested) (7 routes)
20. [Forum](#forum) (27 routes)
21. [Google Auth One Tap](#google-auth-one-tap) (1 routes)
22. [Media / File Explore Management](#media--file-explore-management) (11 routes)
23. [Memberships](#memberships) (3 routes)
24. [Messaging](#messaging) (10 routes)
25. [Moderation](#moderation) (6 routes)
26. [Notifications & Localization](#notifications--localization) (17 routes)
27. [Novels, Authors & Genres](#novels-authors--genres) (32 routes)
28. [Posts, Categories, Tags & Series](#posts-categories-tags--series) (23 routes)
29. [Account Recovery](#account-recovery) (15 routes)
30. [RTS Auth Passkeys (mounted)](#rts-auth-passkeys-mounted) (6 routes)
31. [Security (API Keys / Internal)](#security-api-keys--internal) (4 routes)
32. [Session (Auth)](#session-auth) (2 routes)
33. [Settings](#settings) (6 routes)
34. [Subscriptions, Plans & Payments](#subscriptions-plans--payments) (15 routes)
35. [Telegram Auth](#telegram-auth) (2 routes)
36. [User Permissions](#user-permissions) (1 routes)
37. [Public Contact](#public-contact) (1 routes)
38. [Website (Public)](#website-public) (13 routes)
39. [Chat Monitor WebSocket](#chat-monitor-websocket) (1 routes)
40. [Realtime WebSockets (Chat/Notifications)](#realtime-websockets-chatnotifications) (2 routes)
41. [Auth Bridge (Cross-origin Cookie)](#auth-bridge-cross-origin-cookie) (4 routes)
42. [Authentication (Legacy - not mounted)](#authentication-legacy---not-mounted) (16 routes)
43. [Google Drive / OAuth (legacy v1 module - not mounted)](#google-drive--oauth-legacy-v1-module---not-mounted) (16 routes)
44. [RTS Auth (legacy duplicate - not mounted)](#rts-auth-legacy-duplicate---not-mounted) (2 routes)
45. [RTS Auth Passkeys (copy - not mounted)](#rts-auth-passkeys-copy---not-mounted) (6 routes)
46. [Tests (non-production routes)](#tests-non-production-routes) (2 routes)
47. [Common Patterns](#common-patterns)
48. [Update Notes (delta vs previous API_URL_DOC)](#update-notes-delta-vs-previous-api_url_doc)

---

## System & Health

- **Source files:** `main.py`
- **Endpoints:** 4
- **Mount/status:** mounted in main.py (app route) (4)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/` | `root` |  | `/` | mounted in main.py (app route) |
| `GET` | `/debug/routes` | `debug_routes` |  | `/debug/routes` | mounted in main.py (app route) |
| `GET` | `/health` | `health` |  | `/health` | mounted in main.py (app route) |
| `GET` | `/redoc` | `redoc` |  | `/redoc` | mounted in main.py (app route) |

---

## Authentication (Core)

- **Source files:** `app/api/v1/endpoints/auth.py`, `app/api/v1/endpoints/cmd_oauth.py`, `app/api/v1/endpoints/cms_oauth.py`, `app/api/v1/endpoints/rtsauth.py`, `app/api/v1/endpoints/website_auth.py`, `app/routers/auth.py`
- **Endpoints:** 42
- **Mount/status:** DEFINED, NOT MOUNTED in main.py scan (legacy/unused?) (2); mounted (/api/v1 router) (38); mounted in main.py (2)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/SetAuthorizeCookie` | `authorize_iframe` |  | `/SetAuthorizeCookie` | DEFINED, NOT MOUNTED in main.py scan (legacy/unused?) |
| `GET` | `/api/v1/auth/google` | `google_login` | Redirect to Google consent screen (legacy) | `/google` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/login` | `login` |  | `/login` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/logout` | `logout` |  | `/logout` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/me` | `get_me` |  | `/me` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/me/avatar` | `upload_avatar` |  | `/me/avatar` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/me/plan` | `get_current_plan` |  | `/me/plan` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/me/update` | `update_profile` |  | `/me/update` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/oauth/exchange` | `oauth_exchange` | Redeem a one-time OAuth ticket for an app session | `/oauth/exchange` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/oauth/initiate` | `oauth_initiate` | Build OAuth provider authorization URL | `/oauth/initiate` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback_legacy` |  | `/oauth/telegram/callback` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback` | Telegram Login Widget callback | `/oauth/telegram/callback` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/oauth/telegram/config` | `telegram_config` |  | `/oauth/telegram/config` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/oauth/telegram/oidc` | `telegram_oidc_login` | Exchange a verified Telegram ID token for an app session | `/oauth/telegram/oidc` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/oauth/telegram/widget` | `telegram_widget` |  | `/oauth/telegram/widget` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/oauth/token` | `oauth_token` |  | `/oauth/token` | mounted (/api/v1 router) |
| `GET, POST` | `/api/v1/auth/oauth/{provider}/callback` | `oauth_callback` |  | `/oauth/{provider}/callback` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/refresh` | `refresh_token` |  | `/refresh` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/register` | `register` |  | `/register` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cmd/activity/history` | `cmd_activity_history` |  | `/activity/history` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cmd/activity/query` | `cmd_activity_query` |  | `/activity/query` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cmd/activity/summary` | `cmd_activity_summary` |  | `/activity/summary` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cmd/labels/apply` | `cmd_label_apply` |  | `/labels/apply` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cmd/labels/create` | `cmd_label_create` |  | `/labels/create` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cmd/labels/list` | `cmd_labels_list` |  | `/labels/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cmd/labels/remove` | `cmd_label_remove` |  | `/labels/remove` | mounted (/api/v1 router) |
| `GET` | `/api/v1/google-drive/callback` | `drive_callback` |  | `/callback` | mounted (/api/v1 router) |
| `POST` | `/api/v1/google-drive/connect` | `connect_drive` |  | `/connect` | mounted (/api/v1 router) |
| `POST` | `/api/v1/google-drive/connect_cls` | `connect_drive_cls` |  | `/connect_cls` | mounted (/api/v1 router) |
| `POST` | `/api/v1/google-drive/disconnect` | `disconnect_drive` |  | `/disconnect` | mounted (/api/v1 router) |
| `GET` | `/api/v1/google-drive/files` | `list_stored_drive_files` |  | `/files` | mounted (/api/v1 router) |
| `GET` | `/api/v1/google-drive/list` | `list_drive` |  | `/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/google-drive/status` | `drive_status` |  | `/status` | mounted (/api/v1 router) |
| `POST` | `/api/v1/google-drive/summary` | `drive_summary` |  | `/summary` | mounted (/api/v1 router) |
| `POST` | `/api/v1/google-drive/upload` | `upload_to_drive` |  | `/upload` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/login` | `website_login` | Sign in with encrypted email/username/phone + password | `/site/auth/login` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/logout` | `website_logout` | Revoke the current token and clear auth cookies | `/site/auth/logout` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/auth/me` | `website_me` | Current website user (encrypted email/username/phone) | `/site/auth/me` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/register` | `website_register` | Register with encrypted email/username/phone/password | `/site/auth/register` | mounted (/api/v1 router) |
| `POST` | `/iframe-cookie` | `iframe_cookie` |  | `/iframe-cookie` | DEFINED, NOT MOUNTED in main.py scan (legacy/unused?) |
| `POST` | `/rtsauth/oauth` | `rtsauth_oauth` | RTS SSO token endpoint (login or refresh) | `/oauth` | mounted in main.py |
| `POST` | `/rtsauth/register` | `rtsauth_register` | RTS SSO register (creates account and signs in) | `/register` | mounted in main.py |

---

## User Profile

- **Source files:** `app/api/v1/endpoints/user_profile.py`
- **Endpoints:** 10
- **Mount/status:** mounted (/api/v1 router) (10)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/user/profile/address` | `list_addresses` |  | `/address` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/address/delete` | `delete_address` |  | `/address/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/address/save` | `save_address` |  | `/address/save` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/address/setDefault` | `set_default_address` |  | `/address/setDefault` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/avatar` | `upload_avatar` |  | `/avatar` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/changeEmail` | `change_email` |  | `/changeEmail` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/changePassword` | `change_password` |  | `/changePassword` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/changePhone` | `change_phone` |  | `/changePhone` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/info` | `get_profile_info_post` |  | `/info` | mounted (/api/v1 router) |
| `POST` | `/api/v1/user/profile/update` | `update_profile` |  | `/update` | mounted (/api/v1 router) |

---

## File Explorer (Multi-Provider)

- **Source files:** `app/api/v1/endpoints/file_explorer.py`
- **Endpoints:** 23
- **Mount/status:** mounted (/api/v1 router) (23)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/file_explorer/files/assign` | `files_assign` |  | `/files/assign` | mounted (/api/v1 router) |
| `GET` | `/api/v1/file_explorer/files/delete` | `files_delete` |  | `/files/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/files/download` | `files_download` |  | `/files/download` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/files/list` | `files_list` |  | `/files/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/files/read` | `files_read` |  | `/files/read` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/files/restore` | `files_restore` |  | `/files/restore` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/files/update` | `files_update` |  | `/files/update` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/files/upload` | `files_upload` |  | `/files/upload` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/folders/assign` | `folders_assign` |  | `/folders/assign` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/folders/create` | `folders_create` |  | `/folders/create` | mounted (/api/v1 router) |
| `GET` | `/api/v1/file_explorer/folders/delete` | `folders_delete` |  | `/folders/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/folders/list` | `folders_list` |  | `/folders/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/folders/read` | `folders_read` |  | `/folders/read` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/folders/update` | `folders_update` |  | `/folders/update` | mounted (/api/v1 router) |
| `GET` | `/api/v1/file_explorer/google/files/delete` | `google_files_delete` |  | `/google/files/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/google/files/read` | `google_files_read` |  | `/google/files/read` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/google/folders/create` | `google_folders_create` |  | `/google/folders/create` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/google/list` | `google_list` |  | `/google/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/google/summary` | `google_summary` |  | `/google/summary` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/objects/list` | `objects_list` |  | `/objects/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/providers/list` | `providers_list` |  | `/providers/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/providers/summary` | `providers_summary` |  | `/providers/summary` | mounted (/api/v1 router) |
| `POST` | `/api/v1/file_explorer/storage/read` | `storage_read` |  | `/storage/read` | mounted (/api/v1 router) |

---

## Dashboard API

- **Source files:** `app/api/v1/endpoints/dashboard.py`, `app/websockets/dashboard.py`
- **Endpoints:** 4
- **Mount/status:** mounted (/api/v1 router) (3); mounted in main.py (1)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/dashboard/activity` | `dashboard_activity` | Dashboard audit-log feed (paginated) | `/activity` | mounted (/api/v1 router) |
| `GET` | `/api/v1/dashboard/summary` | `dashboard_summary` | Dashboard snapshot (user/session/content stats + recent users) | `/summary` | mounted (/api/v1 router) |
| `GET` | `/api/v1/dashboard/users` | `dashboard_users` | Dashboard user list (paginated, searchable, online flag) | `/users` | mounted (/api/v1 router) |
| `WEBSOCKET` | `/ws/dashboard` | `dashboard_endpoint` |  | `/ws/dashboard` | mounted in main.py |

---

## RBAC (Roles & Permissions)

- **Source files:** `app/api/v1/endpoints/rbac.py`
- **Endpoints:** 11
- **Mount/status:** mounted (/api/v1 router) (11)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/rbac/databases` | `list_databases` |  | `/databases` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rbac/manifest` | `get_manifest` |  | `/manifest` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rbac/me` | `my_context` |  | `/me` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rbac/permissions/list` | `list_permissions` |  | `/permissions/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rbac/permissions/matrix` | `permission_matrix` |  | `/permissions/matrix` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rbac/permissions/users` | `list_user_permissions` |  | `/permissions/users` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rbac/roles/assign` | `assign_role` |  | `/roles/assign` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rbac/roles/list` | `list_roles` | List all roles with their effective permission grants and database scopes. | `/roles/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rbac/roles/permissions` | `bulk_permissions` |  | `/roles/permissions` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rbac/sync` | `sync_manifest` |  | `/sync` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rbac/sync-state` | `get_sync_state` |  | `/sync-state` | mounted (/api/v1 router) |

---

## Employee & Signature

- **Source files:** `app/api/v1/endpoints/employee.py`
- **Endpoints:** 5
- **Mount/status:** mounted (/api/v1 router) (5)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/employee/add_file_signature` | `add_signature` |  | `/add_file_signature` | mounted (/api/v1 router) |
| `GET` | `/api/v1/employee/delete_signature` | `delete_signature` |  | `/delete_signature` | mounted (/api/v1 router) |
| `GET` | `/api/v1/employee/detail` | `employee_detail` |  | `/detail` | mounted (/api/v1 router) |
| `GET` | `/api/v1/employee/get_signature` | `get_signatures` |  | `/get_signature` | mounted (/api/v1 router) |
| `POST` | `/api/v1/employee/upload_signature` | `upload_signature` |  | `/upload_signature` | mounted (/api/v1 router) |

---

## User Management

- **Source files:** `app/api/v1/endpoints/users.py`
- **Endpoints:** 10
- **Mount/status:** mounted (/api/v1 router) (10)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/users/address/delete` | `delete_user_address` |  | `/address/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/address/save` | `save_user_address` |  | `/address/save` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/address/setDefault` | `set_user_address_default` |  | `/address/setDefault` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/create` | `create_user` |  | `/create` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/detail` | `get_user_detail` |  | `/detail` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/list` | `get_users` | Get all users | `/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/profile` | `get_user_profile` |  | `/profile` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/profile/update` | `update_user_profile` |  | `/profile/update` | mounted (/api/v1 router) |
| `GET` | `/api/v1/users/remove` | `remove_user_get` | Remove user with GET | `/remove` | mounted (/api/v1 router) |
| `POST` | `/api/v1/users/update` | `update_user` |  | `/update` | mounted (/api/v1 router) |

---

## Address / Localization

- **Source files:** `app/api/v1/endpoints/address.py`
- **Endpoints:** 12
- **Mount/status:** mounted (/api/v1 router) (12)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/address/communes` | `communes_get` |  | `/communes` | mounted (/api/v1 router) |
| `POST` | `/api/v1/address/communes` | `communes_post` |  | `/communes` | mounted (/api/v1 router) |
| `GET` | `/api/v1/address/countries` | `countries_get` |  | `/countries` | mounted (/api/v1 router) |
| `POST` | `/api/v1/address/countries` | `countries_post` |  | `/countries` | mounted (/api/v1 router) |
| `GET` | `/api/v1/address/districts` | `districts_get` |  | `/districts` | mounted (/api/v1 router) |
| `POST` | `/api/v1/address/districts` | `districts_post` |  | `/districts` | mounted (/api/v1 router) |
| `GET` | `/api/v1/address/provinces` | `provinces_get` |  | `/provinces` | mounted (/api/v1 router) |
| `POST` | `/api/v1/address/provinces` | `provinces_post` |  | `/provinces` | mounted (/api/v1 router) |
| `GET` | `/api/v1/address/search` | `search_address` |  | `/search` | mounted (/api/v1 router) |
| `POST` | `/api/v1/address/summary` | `address_summary` |  | `/summary` | mounted (/api/v1 router) |
| `POST` | `/api/v1/address/sync` | `sync_address` |  | `/sync` | mounted (/api/v1 router) |
| `POST` | `/api/v1/address/villages` | `villages_post` |  | `/villages` | mounted (/api/v1 router) |

---

## AI Chat

- **Source files:** `app/api/v1/endpoints/ai_chat.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/ai_chat/completions` | `create_chat_completion` |  | `/completions` | mounted (/api/v1 router) |

---

## Artists

- **Source files:** `app/api/v1/endpoints/artists.py`
- **Endpoints:** 11
- **Mount/status:** mounted (/api/v1 router) (11)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/artists` | `create_artist` |  | `` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artists/code/{code}` | `get_artist_by_code` |  | `/code/{code}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artists/list` | `list_artists` |  | `/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artists/me` | `get_current_artist` |  | `/me` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/artists/{artist_id}` | `delete_artist` |  | `/{artist_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artists/{artist_id}` | `get_artist` |  | `/{artist_id}` | mounted (/api/v1 router) |
| `PATCH` | `/api/v1/artists/{artist_id}` | `update_artist` |  | `/{artist_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artists/{artist_id}/social-links` | `create_social_link` |  | `/{artist_id}/social-links` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artists/{artist_id}/social-links/list` | `list_social_links` |  | `/{artist_id}/social-links/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artists/{artist_id}/verifications` | `create_verification` |  | `/{artist_id}/verifications` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artists/{artist_id}/verifications/list` | `list_verifications` |  | `/{artist_id}/verifications/list` | mounted (/api/v1 router) |

---

## Artworks, Galleries & Collections

- **Source files:** `app/api/v1/endpoints/artworks.py`
- **Endpoints:** 24
- **Mount/status:** mounted (/api/v1 router) (24)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/artwork-collections` | `list_collections` |  | `` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artwork-collections` | `create_collection` |  | `` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/artwork-collections/{col_id}` | `delete_collection` |  | `/{col_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artwork-collections/{col_id}` | `get_collection` |  | `/{col_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artwork-tags` | `list_artwork_tags` |  | `` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artwork-tags` | `create_artwork_tag` |  | `` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artworks` | `list_artworks` |  | `` | mounted (/api/v1 router) |
| `POST` | `/api/v1/artworks` | `create_artwork` |  | `` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artworks/featured` | `list_featured_artworks` |  | `/featured` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artworks/slug/{slug}` | `get_artwork_by_slug` |  | `/slug/{slug}` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/artworks/{artwork_id}` | `delete_artwork` |  | `/{artwork_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/artworks/{artwork_id}` | `get_artwork` |  | `/{artwork_id}` | mounted (/api/v1 router) |
| `PATCH` | `/api/v1/artworks/{artwork_id}` | `update_artwork` |  | `/{artwork_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/galleries` | `list_galleries` |  | `` | mounted (/api/v1 router) |
| `POST` | `/api/v1/galleries` | `create_gallery` |  | `` | mounted (/api/v1 router) |
| `GET` | `/api/v1/galleries/slug/{slug}` | `get_gallery_by_slug` |  | `/slug/{slug}` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/galleries/{gallery_id}` | `delete_gallery` |  | `/{gallery_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/galleries/{gallery_id}` | `get_gallery` |  | `/{gallery_id}` | mounted (/api/v1 router) |
| `PATCH` | `/api/v1/galleries/{gallery_id}` | `update_gallery` |  | `/{gallery_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/galleries/{gallery_id}/albums` | `list_albums` |  | `/{gallery_id}/albums` | mounted (/api/v1 router) |
| `POST` | `/api/v1/galleries/{gallery_id}/albums` | `create_album` |  | `/{gallery_id}/albums` | mounted (/api/v1 router) |
| `GET` | `/api/v1/galleries/{gallery_id}/items` | `list_gallery_items` |  | `/{gallery_id}/items` | mounted (/api/v1 router) |
| `POST` | `/api/v1/galleries/{gallery_id}/items` | `add_gallery_item` |  | `/{gallery_id}/items` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/galleries/{gallery_id}/items/{item_id}` | `remove_gallery_item` |  | `/{gallery_id}/items/{item_id}` | mounted (/api/v1 router) |

---

## Chat (v1 API)

- **Source files:** `app/api/v1/endpoints/chat.py`, `app/api/v1/endpoints/mongo_db_endpoints/chat.py`, `app/routers/chat.py`
- **Endpoints:** 18
- **Mount/status:** DEFINED (endpoint module; not seen in api_router include list) (2); mounted (/api/v1 router) (14); mounted in main.py (2)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/chat/assign` | `assign_conversation_member` |  | `/assign` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/chat_monitor/active_users` | `get_active_users` |  | `/chat_monitor/active_users` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/chat_monitor/top_conversations` | `get_top_conversations` |  | `/chat_monitor/top_conversations` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/conversations` | `list_conversations` |  | `/conversations` | mounted (/api/v1 router) |
| `GET` | `/api/v1/chat/delete` | `delete_message` |  | `/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/edit` | `edit_message` |  | `/edit` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/files` | `list_chat_files` | List chat files (attachments) of a conversation — POST per RULES_SYSTEM.md | `/files` | mounted (/api/v1 router) |
| `GET` | `/api/v1/chat/files/delete` | `delete_chat_file` | Delete a chat attachment — GET + URL param per RULES_SYSTEM.md | `/files/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/files/upload` | `upload_chat_file` |  | `/files/upload` | mounted (/api/v1 router) |
| `GET` | `/api/v1/chat/files/{message_id}` | `get_chat_files` | List attachments of one message | `/files/{message_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/get` | `get_conversation_messages` |  | `/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/list_message_monitor` | `list_message_monitor` | Keyset-paginated message list for a chat (newest first) | `/list_message_monitor` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/mongo/history` | `get_chat_history` |  | `/mongo/history` | DEFINED (endpoint module; not seen in api_router include list) |
| `POST` | `/api/v1/chat/mongo/send` | `send_chat_message` |  | `/mongo/send` | DEFINED (endpoint module; not seen in api_router include list) |
| `POST` | `/api/v1/chat/send` | `send_message` |  | `/send` | mounted (/api/v1 router) |
| `POST` | `/api/v1/chat/update` | `update_conversation` |  | `/update` | mounted (/api/v1 router) |
| `POST` | `/chat/mongo/history` | `get_chat_history` |  | `/mongo/history` | mounted in main.py |
| `POST` | `/chat/mongo/send` | `send_chat_message` |  | `/mongo/send` | mounted in main.py |

---

## CMS

- **Source files:** `app/api/v1/endpoints/cms.py`
- **Endpoints:** 16
- **Mount/status:** mounted (/api/v1 router) (16)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/cms/announcements` | `list_announcements` |  | `/announcements` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms/announcements` | `create_announcement` |  | `/announcements` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/cms/announcements/{ann_id}` | `delete_announcement` |  | `/announcements/{ann_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms/banners` | `list_banners` |  | `/banners` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms/banners` | `create_banner` |  | `/banners` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/cms/banners/{banner_id}` | `delete_banner` |  | `/banners/{banner_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms/menus` | `list_menus` |  | `/menus` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms/menus` | `create_menu` |  | `/menus` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms/menus/{menu_id}/items` | `list_menu_items` |  | `/menus/{menu_id}/items` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms/menus/{menu_id}/items` | `create_menu_item` |  | `/menus/{menu_id}/items` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms/pages` | `list_pages` |  | `/pages` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms/pages` | `create_page` |  | `/pages` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms/pages/slug/{slug}` | `get_page_by_slug` |  | `/pages/slug/{slug}` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/cms/pages/{page_id}` | `delete_page` |  | `/pages/{page_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms/pages/{page_id}` | `get_page` |  | `/pages/{page_id}` | mounted (/api/v1 router) |
| `PATCH` | `/api/v1/cms/pages/{page_id}` | `update_page` |  | `/pages/{page_id}` | mounted (/api/v1 router) |

---

## CMS Management

- **Source files:** `app/api/v1/endpoints/cms_mgmt.py`
- **Endpoints:** 15
- **Mount/status:** mounted (/api/v1 router) (15)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/cms-mgmt/audit-logs` | `list_audit_logs` |  | `/audit-logs` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/meta` | `cms_metadata` |  | `/meta` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/revisions/all` | `list_all_revisions` |  | `/revisions/all` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/revisions/record/{resource}/{record_id}` | `list_record_revisions` |  | `/revisions/record/{resource}/{record_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/revisions/{revision_id}/diff` | `get_revision_diff` |  | `/revisions/{revision_id}/diff` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms-mgmt/revisions/{revision_id}/restore` | `restore_revision` |  | `/revisions/{revision_id}/restore` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/themes/detail` | `get_theme` |  | `/themes/detail` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms-mgmt/themes/detail` | `write_theme` |  | `/themes/detail` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/themes/list` | `list_themes` |  | `/themes/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/translations/{resource}/{record_id}` | `read_translation` |  | `/translations/{resource}/{record_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms-mgmt/translations/{resource}/{record_id}` | `write_translation` |  | `/translations/{resource}/{record_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/web-config` | `list_web_config` |  | `/web-config` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms-mgmt/web-config` | `write_web_config` |  | `/web-config` | mounted (/api/v1 router) |
| `GET` | `/api/v1/cms-mgmt/{resource}` | `get_content` |  | `/{resource}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/cms-mgmt/{resource}` | `post_content` |  | `/{resource}` | mounted (/api/v1 router) |

---

## Comments

- **Source files:** `app/api/v1/endpoints/comments.py`
- **Endpoints:** 6
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py) (6)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/comments` | `list_comments` |  | `` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/comments` | `create_comment` |  | `` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `DELETE` | `/api/v1/comments/{comment_id}` | `delete_comment` |  | `/{comment_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `GET` | `/api/v1/comments/{comment_id}` | `get_comment` |  | `/{comment_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `PATCH` | `/api/v1/comments/{comment_id}` | `update_comment` |  | `/{comment_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `GET` | `/api/v1/comments/{comment_id}/replies` | `list_replies` |  | `/{comment_id}/replies` | DEFINED (mount inferred under /api/v1; verify router.py) |

---

## Databases Controller

- **Source files:** `app/api/v1/endpoints/databases.py`
- **Endpoints:** 3
- **Mount/status:** mounted (/api/v1 router) (3)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/databases` | `databases_post` | CRUD Databases with POST and Action | `` | mounted (/api/v1 router) |
| `GET` | `/api/v1/databases/remove` | `databases_get` |  | `/remove` | mounted (/api/v1 router) |
| `POST` | `/api/v1/databases/userdatabase/get` | `get_users_database` | Get users database | `/userdatabase/get` | mounted (/api/v1 router) |

---

## Google Drive Activity & Audit (nested)

- **Source files:** `app/api/v1/endpoints/drive_activity.py`
- **Endpoints:** 5
- **Mount/status:** mounted nested under /api/v1/google-drive/activity (5)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/google-drive/activity/audit/list` | `list_audit_logs` |  | `/audit/list` | mounted nested under /api/v1/google-drive/activity |
| `POST` | `/api/v1/google-drive/activity/history` | `activity_history` |  | `/history` | mounted nested under /api/v1/google-drive/activity |
| `POST` | `/api/v1/google-drive/activity/query` | `query_activity` |  | `/query` | mounted nested under /api/v1/google-drive/activity |
| `POST` | `/api/v1/google-drive/activity/summary` | `activity_summary` |  | `/summary` | mounted nested under /api/v1/google-drive/activity |
| `POST` | `/api/v1/google-drive/activity/sync` | `sync_activity` |  | `/sync` | mounted nested under /api/v1/google-drive/activity |

---

## Google Drive Labels & Metadata (nested)

- **Source files:** `app/api/v1/endpoints/drive_labels.py`
- **Endpoints:** 7
- **Mount/status:** mounted nested under /api/v1/google-drive/labels (7)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/google-drive/labels/assign` | `assign_labels` |  | `/assign` | mounted nested under /api/v1/google-drive/labels |
| `POST` | `/api/v1/google-drive/labels/create` | `create_label` |  | `/create` | mounted nested under /api/v1/google-drive/labels |
| `GET` | `/api/v1/google-drive/labels/delete` | `delete_labels` |  | `/delete` | mounted nested under /api/v1/google-drive/labels |
| `POST` | `/api/v1/google-drive/labels/file` | `get_file_labels` |  | `/file` | mounted nested under /api/v1/google-drive/labels |
| `POST` | `/api/v1/google-drive/labels/get` | `get_label` |  | `/get` | mounted nested under /api/v1/google-drive/labels |
| `POST` | `/api/v1/google-drive/labels/list` | `list_labels` |  | `/list` | mounted nested under /api/v1/google-drive/labels |
| `POST` | `/api/v1/google-drive/labels/update` | `update_label` |  | `/update` | mounted nested under /api/v1/google-drive/labels |

---

## Forum

- **Source files:** `app/api/v1/endpoints/forum.py`
- **Endpoints:** 27
- **Mount/status:** mounted (/api/v1 router) (27)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/categories` | `delete_categories` |  | `/categories` | mounted (/api/v1 router) |
| `POST` | `/api/v1/categories` | `create_category` |  | `/categories` | mounted (/api/v1 router) |
| `POST` | `/api/v1/categories/list` | `list_categories` |  | `/categories/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/categories/{cat_id}` | `category_get_or_delete` |  | `/categories/{cat_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/categories/{cat_id}` | `category_item` |  | `/categories/{cat_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/comments` | `delete_comments` |  | `/comments` | mounted (/api/v1 router) |
| `POST` | `/api/v1/comments` | `create_or_list_comments` |  | `/comments` | mounted (/api/v1 router) |
| `POST` | `/api/v1/comments/list` | `list_comments` |  | `/comments/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/comments/{comment_id}` | `comment_get_or_delete` |  | `/comments/{comment_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/comments/{comment_id}` | `comment_item` |  | `/comments/{comment_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/posts` | `delete_posts` |  | `/posts` | mounted (/api/v1 router) |
| `POST` | `/api/v1/posts` | `create_post` |  | `/posts` | mounted (/api/v1 router) |
| `POST` | `/api/v1/posts/list` | `list_posts` |  | `/posts/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/posts/{post_id}` | `post_get_or_delete` |  | `/posts/{post_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/posts/{post_id}` | `post_item` |  | `/posts/{post_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/posts/{post_id}/bookmarks` | `add_bookmark` |  | `/posts/{post_id}/bookmarks` | mounted (/api/v1 router) |
| `POST` | `/api/v1/posts/{post_id}/reactions` | `add_reaction` |  | `/posts/{post_id}/reactions` | mounted (/api/v1 router) |
| `GET` | `/api/v1/series` | `delete_series_batch` |  | `/series` | mounted (/api/v1 router) |
| `POST` | `/api/v1/series` | `create_series` |  | `/series` | mounted (/api/v1 router) |
| `POST` | `/api/v1/series/list` | `list_series` |  | `/series/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/series/{series_id}` | `series_get_or_delete` |  | `/series/{series_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/series/{series_id}` | `series_item` |  | `/series/{series_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/tags` | `delete_tags` |  | `/tags` | mounted (/api/v1 router) |
| `POST` | `/api/v1/tags` | `create_tag` |  | `/tags` | mounted (/api/v1 router) |
| `POST` | `/api/v1/tags/list` | `list_tags` |  | `/tags/list` | mounted (/api/v1 router) |
| `GET` | `/api/v1/tags/{tag_id}` | `tag_get_or_delete` |  | `/tags/{tag_id}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/tags/{tag_id}` | `tag_item` |  | `/tags/{tag_id}` | mounted (/api/v1 router) |

---

## Google Auth One Tap

- **Source files:** `app/api/v1/endpoints/google_auth_one_tap.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/api/v1/u/GoogleLogin` | `google_login` |  | `/u/GoogleLogin` | mounted (/api/v1 router) |

---

## Media / File Explore Management

- **Source files:** `app/api/v1/endpoints/media.py`
- **Endpoints:** 11
- **Mount/status:** mounted (/api/v1 router) (11)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/media/dashboard` | `media_dashboard` |  | `/dashboard` | mounted (/api/v1 router) |
| `GET` | `/api/v1/media/files` | `files_get` |  | `/files` | mounted (/api/v1 router) |
| `POST` | `/api/v1/media/files` | `files_action` |  | `/files` | mounted (/api/v1 router) |
| `POST` | `/api/v1/media/files/delete` | `media_files_delete` |  | `/files/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/media/files/list` | `media_files_list` |  | `/files/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/media/files/upload` | `upload_file` |  | `/files/upload` | mounted (/api/v1 router) |
| `GET` | `/api/v1/media/files/{file_id}` | `get_file` |  | `/files/{file_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/media/folders` | `folders_get` |  | `/folders` | mounted (/api/v1 router) |
| `POST` | `/api/v1/media/folders` | `folders_action` |  | `/folders` | mounted (/api/v1 router) |
| `POST` | `/api/v1/media/folders/star` | `media_folder_star` |  | `/folders/star` | mounted (/api/v1 router) |
| `GET` | `/api/v1/media/types` | `list_types` |  | `/types` | mounted (/api/v1 router) |

---

## Memberships

- **Source files:** `app/api/v1/endpoints/memberships.py`
- **Endpoints:** 3
- **Mount/status:** mounted (/api/v1 router) (3)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/memberships/join` | `join_membership` |  | `/join` | mounted (/api/v1 router) |
| `POST` | `/api/v1/memberships/payments/{payment_id}/complete` | `complete_payment` |  | `/payments/{payment_id}/complete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/memberships/payments/{payment_id}/confirm` | `complete_payment` |  | `/payments/{payment_id}/confirm` | mounted (/api/v1 router) |

---

## Messaging

- **Source files:** `app/api/v1/endpoints/messaging.py`
- **Endpoints:** 10
- **Mount/status:** mounted (/api/v1 router) (10)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/messaging/chat_monitor/active_users` | `get_active_users` |  | `/chat_monitor/active_users` | mounted (/api/v1 router) |
| `POST` | `/api/v1/messaging/chat_monitor/top_conversations` | `get_top_conversations` |  | `/chat_monitor/top_conversations` | mounted (/api/v1 router) |
| `POST` | `/api/v1/messaging/conversation` | `get_conversation` |  | `/conversation` | mounted (/api/v1 router) |
| `GET` | `/api/v1/messaging/conversations` | `conversations_get_list` |  | `/conversations` | mounted (/api/v1 router) |
| `GET` | `/api/v1/messaging/conversations` | `list_conversations` |  | `/conversations` | mounted (/api/v1 router) |
| `POST` | `/api/v1/messaging/mark-read` | `mark_messages_read` |  | `/mark-read` | mounted (/api/v1 router) |
| `POST` | `/api/v1/messaging/notifications/list` | `list_notifications` |  | `/notifications/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/messaging/notifications/mark-all-read` | `mark_all_notifications_read` |  | `/notifications/mark-all-read` | mounted (/api/v1 router) |
| `POST` | `/api/v1/messaging/notifications/mark-read` | `mark_notification_read` |  | `/notifications/mark-read` | mounted (/api/v1 router) |
| `POST` | `/api/v1/messaging/send` | `send_message` |  | `/send` | mounted (/api/v1 router) |

---

## Moderation

- **Source files:** `app/api/v1/endpoints/moderation.py`
- **Endpoints:** 6
- **Mount/status:** mounted (/api/v1 router) (6)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/moderation/cases` | `list_cases` |  | `/cases` | mounted (/api/v1 router) |
| `GET` | `/api/v1/moderation/cases/{case_id}` | `get_case` |  | `/cases/{case_id}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/moderation/reports` | `list_reports` |  | `/reports` | mounted (/api/v1 router) |
| `POST` | `/api/v1/moderation/reports` | `create_report` |  | `/reports` | mounted (/api/v1 router) |
| `GET` | `/api/v1/moderation/reports/{report_id}` | `get_report` |  | `/reports/{report_id}` | mounted (/api/v1 router) |
| `PATCH` | `/api/v1/moderation/reports/{report_id}/review` | `review_report` |  | `/reports/{report_id}/review` | mounted (/api/v1 router) |

---

## Notifications & Localization

- **Source files:** `app/api/v1/endpoints/notifications.py`
- **Endpoints:** 17
- **Mount/status:** mounted (/api/v1 router) (17)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/localization/countries` | `list_countries` |  | `/countries` | mounted (/api/v1 router) |
| `GET` | `/api/v1/localization/languages` | `list_languages` |  | `/languages` | mounted (/api/v1 router) |
| `GET` | `/api/v1/notification/clearall` | `notification_delete_all` | Clear all notifications | `/clearall` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notification/countunread` | `notification_count_unread` |  | `/countunread` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notification/countunreadbyappmodes` | `notification_count_unread_by_app_modes` |  | `/countunreadbyappmodes` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notification/createtoken` | `notification_create_token` |  | `/createtoken` | mounted (/api/v1 router) |
| `GET` | `/api/v1/notification/delete` | `notification_delete` |  | `/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notification/get` | `notification_list` | Get all notification list , POST | `/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notification/markallasread` | `notification_mark_all_as_read` |  | `/markallasread` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notification/markasread` | `notification_mark_as_read` |  | `/markasread` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notification/markasreadbytype` | `notification_mark_as_read_by_type` |  | `/markasreadbytype` | mounted (/api/v1 router) |
| `GET` | `/api/v1/notifications/clear` | `delete_notification` |  | `/clear` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notifications/clear` | `clear_notifications` |  | `/clear` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notifications/list` | `list_notifications` | Get all list , list unread only | `/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notifications/read` | `mark_as_read` |  | `/read` | mounted (/api/v1 router) |
| `POST` | `/api/v1/notifications/read_all` | `mark_all_as_read` |  | `/read_all` | mounted (/api/v1 router) |
| `POST` | `/api/v1/phone_code` | `list_phone_codes` |  | `` | mounted (/api/v1 router) |

---

## Novels, Authors & Genres

- **Source files:** `app/api/v1/endpoints/novels.py`
- **Endpoints:** 32
- **Mount/status:** mounted (/api/v1 router) (32)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/authors/create` | `create_author` |  | `/create` | mounted (/api/v1 router) |
| `GET` | `/api/v1/authors/delete` | `delete_author` |  | `/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/authors/get` | `get_author` |  | `/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/authors/list` | `list_authors` |  | `/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/authors/slug/get` | `get_author_by_slug` |  | `/slug/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/authors/update` | `update_author` |  | `/update` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novel_genres/create` | `create_genre` |  | `/create` | mounted (/api/v1 router) |
| `GET` | `/api/v1/novel_genres/delete` | `delete_genre` |  | `/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novel_genres/get` | `get_genre` |  | `/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novel_genres/list` | `list_genres` |  | `/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novel_genres/update` | `update_genre` |  | `/update` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/chapters/create` | `create_chapter` |  | `/chapters/create` | mounted (/api/v1 router) |
| `GET` | `/api/v1/novels/chapters/delete` | `delete_chapter` |  | `/chapters/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/chapters/get` | `get_chapter` |  | `/chapters/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/chapters/list` | `list_chapters` |  | `/chapters/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/chapters/revisions/get` | `get_chapter_revision` |  | `/chapters/revisions/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/chapters/revisions/list` | `list_chapter_revisions` |  | `/chapters/revisions/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/chapters/revisions/restore` | `restore_chapter_revision` |  | `/chapters/revisions/restore` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/chapters/update` | `update_chapter` |  | `/chapters/update` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/create` | `create_novel` |  | `/create` | mounted (/api/v1 router) |
| `GET` | `/api/v1/novels/delete` | `delete_novel` |  | `/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/featured/list` | `list_featured_novels` |  | `/featured/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/get` | `get_novel` |  | `/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/list` | `list_novels` |  | `/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/slug/get` | `get_novel_by_slug` |  | `/slug/get` | mounted (/api/v1 router) |
| `GET` | `/api/v1/novels/slug/{slug}` | `get_novel_by_slug_path` |  | `/slug/{slug}` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/update` | `update_novel` |  | `/update` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/volumes/create` | `create_volume` |  | `/volumes/create` | mounted (/api/v1 router) |
| `GET` | `/api/v1/novels/volumes/delete` | `delete_volume` |  | `/volumes/delete` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/volumes/get` | `get_volume` |  | `/volumes/get` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/volumes/list` | `list_volumes` |  | `/volumes/list` | mounted (/api/v1 router) |
| `POST` | `/api/v1/novels/volumes/update` | `update_volume` |  | `/volumes/update` | mounted (/api/v1 router) |

---

## Posts, Categories, Tags & Series

- **Source files:** `app/api/v1/endpoints/posts.py`
- **Endpoints:** 23
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py) (23)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/categories` | `create_category` |  | `` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/categories/list` | `list_categories` |  | `/list` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `DELETE` | `/api/v1/categories/{cat_id}` | `delete_category` |  | `/{cat_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `GET` | `/api/v1/categories/{cat_id}` | `get_category` |  | `/{cat_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `PATCH` | `/api/v1/categories/{cat_id}` | `update_category` |  | `/{cat_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/posts` | `create_post` |  | `` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/posts/featured/list` | `list_featured_posts` |  | `/featured/list` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/posts/list` | `list_posts` |  | `/list` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `GET` | `/api/v1/posts/slug/{slug}` | `get_post_by_slug` |  | `/slug/{slug}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `DELETE` | `/api/v1/posts/{post_id}` | `delete_post` |  | `/{post_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `GET` | `/api/v1/posts/{post_id}` | `get_post` |  | `/{post_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `PATCH` | `/api/v1/posts/{post_id}` | `update_post` |  | `/{post_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/posts/{post_id}/bookmarks` | `bookmark_post` |  | `/{post_id}/bookmarks` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `DELETE` | `/api/v1/posts/{post_id}/bookmarks/{bookmark_id}` | `remove_bookmark` |  | `/{post_id}/bookmarks/{bookmark_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/posts/{post_id}/reactions` | `add_reaction` |  | `/{post_id}/reactions` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/posts/{post_id}/reactions/list` | `list_reactions` |  | `/{post_id}/reactions/list` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/series` | `create_series` |  | `` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/series/list` | `list_series` |  | `/list` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `DELETE` | `/api/v1/series/{series_id}` | `delete_series` |  | `/{series_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `GET` | `/api/v1/series/{series_id}` | `get_series` |  | `/{series_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/tags` | `create_tag` |  | `` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `POST` | `/api/v1/tags/list` | `list_tags` |  | `/list` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `DELETE` | `/api/v1/tags/{tag_id}` | `delete_tag` |  | `/{tag_id}` | DEFINED (mount inferred under /api/v1; verify router.py) |

---

## Account Recovery

- **Source files:** `app/api/v1/endpoints/recovery.py`, `app/api/v1/endpoints/website_recovery.py`
- **Endpoints:** 15
- **Mount/status:** mounted (/api/v1 router) (15)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/recovery/account` | `recovery_account` | Unlock or restore an account using a verified recovery token | `/account` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/recovery/config` | `recovery_config` | Everything a client needs to render the recovery flow | `/config` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/recovery/detect` | `recovery_detect` | Free detection of an account by username, email or phone number | `/detect` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/recovery/link` | `recovery_validate_link` | Inspect an emailed link without consuming it (scanner-safe) | `/link` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/recovery/password/change` | `change_password` | Change the password of the signed-in user | `/password/change` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/recovery/request` | `recovery_request` | Send a verification code and a one-time link | `/request` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/recovery/reset` | `recovery_reset` | Set a new password using a verified recovery token | `/reset` | mounted (/api/v1 router) |
| `POST` | `/api/v1/auth/recovery/verify` | `recovery_verify` | Verify a code or an emailed link | `/verify` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/recovery/account` | `website_recovery_account` | Unlock or restore a locked / deactivated account | `/site/auth/recovery/account` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/auth/recovery/config` | `website_recovery_config` | Recovery flow configuration for the website | `/site/auth/recovery/config` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/recovery/detect` | `website_recovery_detect` | Free account detection (encrypted identifier) | `/site/auth/recovery/detect` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/auth/recovery/link` | `website_recovery_validate_link` | Inspect an emailed link without consuming it | `/site/auth/recovery/link` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/recovery/request` | `website_recovery_request` | Send the verification code and link | `/site/auth/recovery/request` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/recovery/reset` | `website_recovery_reset` | Set a new password | `/site/auth/recovery/reset` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/auth/recovery/verify` | `website_recovery_verify` | Verify the code or the emailed link | `/site/auth/recovery/verify` | mounted (/api/v1 router) |

---

## RTS Auth Passkeys (mounted)

- **Source files:** `app/api/v1/endpoints/rtsauth_passkey.py`
- **Endpoints:** 6
- **Mount/status:** mounted in main.py (6)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/rtsauth/passkey/login/options` | `passkey_login_options` | Passkey: start sign-in | `/passkey/login/options` | mounted in main.py |
| `POST` | `/rtsauth/passkey/login/verify` | `passkey_login_verify` | Passkey: finish sign-in (same response as POST /rtsauth/oauth) | `/passkey/login/verify` | mounted in main.py |
| `POST` | `/rtsauth/passkey/register/options` | `passkey_register_options` | Passkey: start adding a passkey | `/passkey/register/options` | mounted in main.py |
| `POST` | `/rtsauth/passkey/register/verify` | `passkey_register_verify` | Passkey: finish adding a passkey | `/passkey/register/verify` | mounted in main.py |
| `GET` | `/rtsauth/passkeys` | `passkey_list` | Passkey: list my passkeys | `/passkeys` | mounted in main.py |
| `DELETE` | `/rtsauth/passkeys/{passkey_id}` | `passkey_delete` | Passkey: remove one of my passkeys | `/passkeys/{passkey_id}` | mounted in main.py |

---

## Security (API Keys / Internal)

- **Source files:** `app/api/v1/endpoints/security.py`
- **Endpoints:** 4
- **Mount/status:** mounted (/api/v1 router) (4)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/internal/status` | `internal_status` |  | `/internal/status` | mounted (/api/v1 router) |
| `GET` | `/api/v1/security/api-keys` | `list_api_keys` |  | `/security/api-keys` | mounted (/api/v1 router) |
| `POST` | `/api/v1/security/api-keys` | `create_api_key` |  | `/security/api-keys` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/security/api-keys/{key_id}` | `revoke_api_key` |  | `/security/api-keys/{key_id}` | mounted (/api/v1 router) |

---

## Session (Auth)

- **Source files:** `app/api/v1/endpoints/session.py`
- **Endpoints:** 2
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py) (2)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/logout` | `logout` |  | `/logout` | DEFINED (mount inferred under /api/v1; verify router.py) |
| `GET` | `/api/v1/auth/me` | `me` |  | `/me` | DEFINED (mount inferred under /api/v1; verify router.py) |

---

## Settings

- **Source files:** `app/api/v1/endpoints/settings_ep.py`
- **Endpoints:** 6
- **Mount/status:** mounted (/api/v1 router) (6)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/settings` | `list_settings` |  | `` | mounted (/api/v1 router) |
| `POST` | `/api/v1/settings` | `create_setting` |  | `` | mounted (/api/v1 router) |
| `GET` | `/api/v1/settings/feature-flags/all` | `list_feature_flags` |  | `/feature-flags/all` | mounted (/api/v1 router) |
| `PATCH` | `/api/v1/settings/feature-flags/{code}` | `toggle_feature_flag` |  | `/feature-flags/{code}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/settings/{code}` | `get_setting` |  | `/{code}` | mounted (/api/v1 router) |
| `PATCH` | `/api/v1/settings/{code}` | `update_setting` |  | `/{code}` | mounted (/api/v1 router) |

---

## Subscriptions, Plans & Payments

- **Source files:** `app/api/v1/endpoints/subscriptions.py`
- **Endpoints:** 15
- **Mount/status:** mounted nested under /api/v1/subscriptions (15)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/subscriptions/payments/create` | `payment_create` |  | `/create` | mounted nested under /api/v1/subscriptions |
| `DELETE` | `/api/v1/subscriptions/payments/delete/{payment_id}` | `payment_delete` |  | `/delete/{payment_id}` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/payments/list` | `payments_list` |  | `/list` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/payments/update/{payment_id}` | `payment_update` |  | `/update/{payment_id}` | mounted nested under /api/v1/subscriptions |
| `GET` | `/api/v1/subscriptions/payments/{payment_id}` | `payment_detail` |  | `/{payment_id}` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/plans/create` | `plan_create` |  | `/create` | mounted nested under /api/v1/subscriptions |
| `DELETE` | `/api/v1/subscriptions/plans/delete/{plan_id}` | `plan_delete` |  | `/delete/{plan_id}` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/plans/list` | `plans_list` |  | `/list` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/plans/update/{plan_id}` | `plan_update` |  | `/update/{plan_id}` | mounted nested under /api/v1/subscriptions |
| `GET` | `/api/v1/subscriptions/plans/{plan_id}` | `plan_detail` |  | `/{plan_id}` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/subscriptions/create` | `subscription_create` |  | `/create` | mounted nested under /api/v1/subscriptions |
| `DELETE` | `/api/v1/subscriptions/subscriptions/delete/{subscription_id}` | `subscription_delete` |  | `/delete/{subscription_id}` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/subscriptions/list` | `subscriptions_list` |  | `/list` | mounted nested under /api/v1/subscriptions |
| `POST` | `/api/v1/subscriptions/subscriptions/update/{subscription_id}` | `subscription_update` |  | `/update/{subscription_id}` | mounted nested under /api/v1/subscriptions |
| `GET` | `/api/v1/subscriptions/subscriptions/{subscription_id}` | `subscription_detail` |  | `/{subscription_id}` | mounted nested under /api/v1/subscriptions |

---

## Telegram Auth

- **Source files:** `app/api/v1/endpoints/telegram.py`
- **Endpoints:** 2
- **Mount/status:** mounted (/api/v1 router) (2)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/auth/telegram/callback` | `telegram_callback` |  | `/callback` | mounted (/api/v1 router) |
| `GET` | `/api/v1/auth/telegram/start` | `telegram_login` |  | `/start` | mounted (/api/v1 router) |

---

## User Permissions

- **Source files:** `app/api/v1/endpoints/userpermission.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/userpermission/list` | `list_my_permissions_post` |  | `/list` | mounted (/api/v1 router) |

---

## Public Contact

- **Source files:** `app/api/v1/endpoints/web/contact.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/contacts` | `submit_contact` |  | `` | mounted (/api/v1 router) |

---

## Website (Public)

- **Source files:** `app/api/v1/endpoints/website.py`
- **Endpoints:** 13
- **Mount/status:** mounted (/api/v1 router) (13)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/rty/dragon/site/artists` | `site_artists` | Public artists (paginated) | `/site/artists` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/artists/{code}` | `site_artist_detail` | Artist profile with full SEO payload | `/site/artists/{code}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/artworks` | `site_artworks` | Public artworks (paginated) | `/site/artworks` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/artworks/{slug}` | `site_artwork_detail` | Artwork detail with full SEO payload | `/site/artworks/{slug}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/galleries` | `site_galleries` | Public galleries (paginated) | `/site/galleries` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/galleries/{slug}` | `site_gallery_detail` | Gallery detail with full SEO payload | `/site/galleries/{slug}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/meta` | `site_meta` | Site-wide metadata for the website shell | `/site/meta` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/pages/{slug}` | `site_page_detail` | Published CMS page with full SEO payload | `/site/pages/{slug}` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/posts` | `site_posts` | Published posts (paginated) | `/site/posts` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/posts/{slug}` | `site_post_detail` | Published post detail with full SEO payload | `/site/posts/{slug}` | mounted (/api/v1 router) |
| `DELETE` | `/api/v1/rty/dragon/site/session` | `delete_site_session` | Clear the visitor-session cookie | `/site/session` | mounted (/api/v1 router) |
| `GET` | `/api/v1/rty/dragon/site/session` | `read_site_session` | Read the encrypted visitor-session cookie | `/site/session` | mounted (/api/v1 router) |
| `POST` | `/api/v1/rty/dragon/site/session` | `create_site_session` | Issue an encrypted HttpOnly visitor-session cookie | `/site/session` | mounted (/api/v1 router) |

---

## Chat Monitor WebSocket

- **Source files:** `app/websockets/chat_monitor.py`
- **Endpoints:** 1
- **Mount/status:** mounted in main.py (1)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `WEBSOCKET` | `/ws/chat-monitor` | `chat_monitor_ws` |  | `/ws/chat-monitor` | mounted in main.py |

---

## Realtime WebSockets (Chat/Notifications)

- **Source files:** `app/websockets/endpoints.py`
- **Endpoints:** 2
- **Mount/status:** mounted in main.py (2)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `WEBSOCKET` | `/ws/chat/{room_id}` | `chat_endpoint` |  | `/ws/chat/{room_id}` | mounted in main.py |
| `WEBSOCKET` | `/ws/notifications/{user_id}` | `notifications_endpoint` |  | `/ws/notifications/{user_id}` | mounted in main.py |

---

## Auth Bridge (Cross-origin Cookie)

- **Source files:** `app/routers/auth_bridge.py`
- **Endpoints:** 4
- **Mount/status:** mounted in main.py (4)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/SetAuthorizeCookie` | `bridge_page` | Hidden iframe page | `/SetAuthorizeCookie` | mounted in main.py |
| `DELETE` | `/session` | `clear_session` | Clear the auth cookies | `/session` | mounted in main.py |
| `GET` | `/session` | `get_session` | Is the access cookie present and valid? | `/session` | mounted in main.py |
| `POST` | `/session` | `set_session` | Verify tokens and set the HttpOnly cookies | `/session` | mounted in main.py |

---

## Authentication (Legacy - not mounted)

- **Source files:** `app/api/v1/endpoints/auth_original.py`
- **Endpoints:** 16
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) (16)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/auth/google` | `google_login` | Redirect to Google consent screen (legacy) | `/google` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/login` | `login` |  | `/login` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/logout` | `logout` |  | `/logout` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `GET` | `/api/v1/auth/me` | `get_me` |  | `/me` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/me/avatar` | `upload_avatar` |  | `/me/avatar` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `GET` | `/api/v1/auth/me/plan` | `get_current_plan` |  | `/me/plan` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/me/update` | `update_profile` |  | `/me/update` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/oauth/initiate` | `oauth_initiate` | Build OAuth provider authorization URL | `/oauth/initiate` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `GET` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback_legacy` |  | `/oauth/telegram/callback` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback` | Telegram Login Widget callback | `/oauth/telegram/callback` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `GET` | `/api/v1/auth/oauth/telegram/config` | `telegram_config` |  | `/oauth/telegram/config` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/oauth/telegram/oidc` | `telegram_oidc_login` | Exchange a verified Telegram ID token for an app session | `/oauth/telegram/oidc` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `GET` | `/api/v1/auth/oauth/telegram/widget` | `telegram_widget` |  | `/oauth/telegram/widget` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `GET, POST` | `/api/v1/auth/oauth/{provider}/callback` | `oauth_callback` |  | `/oauth/{provider}/callback` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/refresh` | `refresh_token` |  | `/refresh` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| `POST` | `/api/v1/auth/register` | `register` |  | `/register` | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |

---

## Google Drive / OAuth (legacy v1 module - not mounted)

- **Source files:** `app/api/v1/endpoints/cms_oauth_v1.py`
- **Endpoints:** 16
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) (16)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/google-drive/activity/history` | `drive_activity_history` |  | `/activity/history` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `GET` | `/api/v1/google-drive/activity/query` | `drive_activity_query` |  | `/activity/query` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `GET` | `/api/v1/google-drive/activity/summary` | `drive_activity_summary` |  | `/activity/summary` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `GET` | `/api/v1/google-drive/callback` | `drive_callback` |  | `/callback` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/connect` | `connect_drive` |  | `/connect` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/connect_cls` | `connect_drive_cls` |  | `/connect_cls` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/disconnect` | `disconnect_drive` |  | `/disconnect` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `GET` | `/api/v1/google-drive/files` | `list_stored_drive_files` |  | `/files` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/labels/apply` | `drive_label_apply` |  | `/labels/apply` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/labels/create` | `drive_label_create` |  | `/labels/create` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `GET` | `/api/v1/google-drive/labels/list` | `drive_labels_list` |  | `/labels/list` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/labels/remove` | `drive_label_remove` |  | `/labels/remove` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `GET` | `/api/v1/google-drive/list` | `list_drive` |  | `/list` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `GET` | `/api/v1/google-drive/status` | `drive_status` |  | `/status` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/summary` | `drive_summary` |  | `/summary` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| `POST` | `/api/v1/google-drive/upload` | `upload_to_drive` |  | `/upload` | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |

---

## RTS Auth (legacy duplicate - not mounted)

- **Source files:** `app/api/v1/endpoints/rtsauth2.py`
- **Endpoints:** 2
- **Mount/status:** DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py) (2)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/rtsauth/oauth` | `rtsauth_oauth` | RTS SSO token endpoint (login or refresh) | `/oauth` | DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py) |
| `POST` | `/rtsauth/register` | `rtsauth_register` | RTS SSO register (creates account and signs in) | `/register` | DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py) |

---

## RTS Auth Passkeys (copy - not mounted)

- **Source files:** `app/api/v1/endpoints/rtsauth_passkey copy.py`
- **Endpoints:** 6
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) (6)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `POST` | `/rtsauth/passkey/login/options` | `passkey_login_options` | Passkey: start sign-in | `/passkey/login/options` | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| `POST` | `/rtsauth/passkey/login/verify` | `passkey_login_verify` | Passkey: finish sign-in (same response as POST /rtsauth/oauth) | `/passkey/login/verify` | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| `POST` | `/rtsauth/passkey/register/options` | `passkey_register_options` | Passkey: start adding a passkey | `/passkey/register/options` | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| `POST` | `/rtsauth/passkey/register/verify` | `passkey_register_verify` | Passkey: finish adding a passkey | `/passkey/register/verify` | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| `GET` | `/rtsauth/passkeys` | `passkey_list` | Passkey: list my passkeys | `/passkeys` | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| `DELETE` | `/rtsauth/passkeys/{passkey_id}` | `passkey_delete` | Passkey: remove one of my passkeys | `/passkeys/{passkey_id}` | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |

---

## Tests (non-production routes)

- **Source files:** `tests/test_language.py`
- **Endpoints:** 2
- **Mount/status:** mounted in main.py (app route) (2)

| Methods | Full path | Handler | Summary | Defined path | Status |
|---|---|---|---|---|---|
| `GET` | `/missing` | `missing` |  | `/missing` | mounted in main.py (app route) |
| `GET` | `/msg` | `msg` |  | `/msg` | mounted in main.py (app route) |

---

## Common Patterns

- **Headers/auth (typical):** `Authorization: Bearer <token>`; some flows also use `X-Requested-With: XMLHttpRequest`, tenant routing header `rty_database` / `db_name` / `database`, and/or HttpOnly auth cookies depending on endpoint/client.
- **Response casing:** predominantly PascalCase in project APIs (with some legacy/flat snake_case responses in specific auth/chat-demo flows).
- **Error envelope:** many endpoints use translated app error envelope (e.g. `Code`, `Message`, `Details`, `Errors`, `RequestId`); FastAPI validation/errors may also appear as `{"detail": ...}` depending on handler/path.
- **Rules (RULES_SYSTEM intent):** Create/Update/Get/Assign typically POST with payload; Delete commonly GET with query/payload identifiers; datatable lists commonly POST with `Pages/Records/Search/OrderBy/OrderDir` and per-item/collection total conventions where implemented (module-specific).
- **WebSockets:** dashboard/chat/notifications/chat-monitor use WS endpoints listed above (token/origin checks are endpoint-specific).

---

## Update Notes (delta vs previous API_URL_DOC)

### Coverage additions / newly documented modules

- **System & Health**: 4 route definition(s) documented from source scan.
- **Authentication (Core)**: 42 route definition(s) documented from source scan.
- **Dashboard API**: 4 route definition(s) documented from source scan.
- **AI Chat**: 1 route definition(s) documented from source scan.
- **Artists**: 11 route definition(s) documented from source scan.
- **Artworks, Galleries & Collections**: 24 route definition(s) documented from source scan.
- **Chat (v1 API)**: 18 route definition(s) documented from source scan.
- **CMS**: 16 route definition(s) documented from source scan.
- **Comments**: 6 route definition(s) documented from source scan.
- **Databases Controller**: 3 route definition(s) documented from source scan.
- **Google Drive Activity & Audit (nested)**: 5 route definition(s) documented from source scan.
- **Google Drive Labels & Metadata (nested)**: 7 route definition(s) documented from source scan.
- **Forum**: 27 route definition(s) documented from source scan.
- **Google Auth One Tap**: 1 route definition(s) documented from source scan.
- **Media / File Explore Management**: 11 route definition(s) documented from source scan.
- **Memberships**: 3 route definition(s) documented from source scan.
- **Messaging**: 10 route definition(s) documented from source scan.
- **Moderation**: 6 route definition(s) documented from source scan.
- **Notifications & Localization**: 17 route definition(s) documented from source scan.
- **Novels, Authors & Genres**: 32 route definition(s) documented from source scan.
- **Posts, Categories, Tags & Series**: 23 route definition(s) documented from source scan.
- **Account Recovery**: 15 route definition(s) documented from source scan.
- **RTS Auth Passkeys (mounted)**: 6 route definition(s) documented from source scan.
- **Security (API Keys / Internal)**: 4 route definition(s) documented from source scan.
- **Session (Auth)**: 2 route definition(s) documented from source scan.
- **Settings**: 6 route definition(s) documented from source scan.
- **Subscriptions, Plans & Payments**: 15 route definition(s) documented from source scan.
- **Telegram Auth**: 2 route definition(s) documented from source scan.
- **User Permissions**: 1 route definition(s) documented from source scan.
- **Public Contact**: 1 route definition(s) documented from source scan.
- **Website (Public)**: 13 route definition(s) documented from source scan.
- **Chat Monitor WebSocket**: 1 route definition(s) documented from source scan.
- **Realtime WebSockets (Chat/Notifications)**: 2 route definition(s) documented from source scan.
- **Auth Bridge (Cross-origin Cookie)**: 4 route definition(s) documented from source scan.
- **Authentication (Legacy - not mounted)**: 16 route definition(s) documented from source scan.
- **Google Drive / OAuth (legacy v1 module - not mounted)**: 16 route definition(s) documented from source scan.
- **RTS Auth (legacy duplicate - not mounted)**: 2 route definition(s) documented from source scan.
- **RTS Auth Passkeys (copy - not mounted)**: 6 route definition(s) documented from source scan.

### Corrected / updated endpoint patterns (notable)

- `POST /login`, `/register`, `/auth/*` in old doc -> actual mounted paths are under `/api/v1/auth/*` (e.g. `/api/v1/auth/login`, `/api/v1/auth/register`) per current scan.
- File Explorer in old doc showed `GET/POST /api/v1/file_explorer/folders`, `GET /files`, etc.; current implementation exposes action-style endpoints like `/api/v1/file_explorer/folders/list|read|create|update|assign|delete`, `/files/list|upload|read|update|assign|restore|download|delete`, `/providers/list|summary`, `/objects/list`, `/storage/read`, `/google/*` (see File Explorer section).
- RBAC old doc showed `GET /api/v1/rbac/roles` and `POST /api/v1/rbac/roles`; current scan shows `POST /api/v1/rbac/roles/list`, `/roles/assign`, `/roles/permissions`, `GET /permissions/list|matrix|users`, `POST /rbac/sync`, etc.
- Google Drive nested subroutes now include `/api/v1/google-drive/activity/*` and `/api/v1/google-drive/labels/*` (mounted via `cms_oauth.py`). CMD drive endpoints also exist at `/api/v1/cmd/activity/*` and `/api/v1/cmd/labels/*`.
- Media module now includes dashboard and datatable/action endpoints: `/api/v1/media/dashboard`, `/files/list`, `/files/delete`, `/folders/star`, plus legacy/action handlers.

### Newly discovered paths (not present in previous API_URL_DOC path set, best-effort compare)

- **Count:** 289 resolved paths/method targets newly present vs previous doc set (includes corrected mounts, nested routes, legacy-defined files, and test routes).

<details><summary><code>/</code> (1)</summary>

- `/`

</details>

<details><summary><code>/SetAuthorizeCookie</code> (1)</summary>

- `/SetAuthorizeCookie`

</details>

<details><summary><code>/api/v1/ai_chat</code> (1)</summary>

- `/api/v1/ai_chat/completions`

</details>

<details><summary><code>/api/v1/api</code> (1)</summary>

- `/api/v1/api/v1/u/GoogleLogin`

</details>

<details><summary><code>/api/v1/artists</code> (9)</summary>

- `/api/v1/artists`
- `/api/v1/artists/code/{code}`
- `/api/v1/artists/list`
- `/api/v1/artists/me`
- `/api/v1/artists/{artist_id}`
- `/api/v1/artists/{artist_id}/social-links`
- `/api/v1/artists/{artist_id}/social-links/list`
- `/api/v1/artists/{artist_id}/verifications`
- `/api/v1/artists/{artist_id}/verifications/list`

</details>

<details><summary><code>/api/v1/artwork-collections</code> (2)</summary>

- `/api/v1/artwork-collections`
- `/api/v1/artwork-collections/{col_id}`

</details>

<details><summary><code>/api/v1/artwork-tags</code> (1)</summary>

- `/api/v1/artwork-tags`

</details>

<details><summary><code>/api/v1/artworks</code> (4)</summary>

- `/api/v1/artworks`
- `/api/v1/artworks/featured`
- `/api/v1/artworks/slug/{slug}`
- `/api/v1/artworks/{artwork_id}`

</details>

<details><summary><code>/api/v1/auth</code> (27)</summary>

- `/api/v1/auth/google`
- `/api/v1/auth/login`
- `/api/v1/auth/logout`
- `/api/v1/auth/me`
- `/api/v1/auth/me/avatar`
- `/api/v1/auth/me/plan`
- `/api/v1/auth/me/update`
- `/api/v1/auth/oauth/exchange`
- `/api/v1/auth/oauth/initiate`
- `/api/v1/auth/oauth/telegram/callback`
- `/api/v1/auth/oauth/telegram/config`
- `/api/v1/auth/oauth/telegram/oidc`
- `/api/v1/auth/oauth/telegram/widget`
- `/api/v1/auth/oauth/token`
- `/api/v1/auth/oauth/{provider}/callback`
- `/api/v1/auth/recovery/account`
- `/api/v1/auth/recovery/config`
- `/api/v1/auth/recovery/detect`
- `/api/v1/auth/recovery/link`
- `/api/v1/auth/recovery/password/change`
- `/api/v1/auth/recovery/request`
- `/api/v1/auth/recovery/reset`
- `/api/v1/auth/recovery/verify`
- `/api/v1/auth/refresh`
- `/api/v1/auth/register`
- `/api/v1/auth/telegram/callback`
- `/api/v1/auth/telegram/start`

</details>

<details><summary><code>/api/v1/authors</code> (6)</summary>

- `/api/v1/authors/create`
- `/api/v1/authors/delete`
- `/api/v1/authors/get`
- `/api/v1/authors/list`
- `/api/v1/authors/slug/get`
- `/api/v1/authors/update`

</details>

<details><summary><code>/api/v1/categories</code> (3)</summary>

- `/api/v1/categories`
- `/api/v1/categories/list`
- `/api/v1/categories/{cat_id}`

</details>

<details><summary><code>/api/v1/chat</code> (16)</summary>

- `/api/v1/chat/assign`
- `/api/v1/chat/chat_monitor/active_users`
- `/api/v1/chat/chat_monitor/top_conversations`
- `/api/v1/chat/conversations`
- `/api/v1/chat/delete`
- `/api/v1/chat/edit`
- `/api/v1/chat/files`
- `/api/v1/chat/files/delete`
- `/api/v1/chat/files/upload`
- `/api/v1/chat/files/{message_id}`
- `/api/v1/chat/get`
- `/api/v1/chat/list_message_monitor`
- `/api/v1/chat/mongo/history`
- `/api/v1/chat/mongo/send`
- `/api/v1/chat/send`
- `/api/v1/chat/update`

</details>

<details><summary><code>/api/v1/cmd</code> (7)</summary>

- `/api/v1/cmd/activity/history`
- `/api/v1/cmd/activity/query`
- `/api/v1/cmd/activity/summary`
- `/api/v1/cmd/labels/apply`
- `/api/v1/cmd/labels/create`
- `/api/v1/cmd/labels/list`
- `/api/v1/cmd/labels/remove`

</details>

<details><summary><code>/api/v1/cms</code> (9)</summary>

- `/api/v1/cms/announcements`
- `/api/v1/cms/announcements/{ann_id}`
- `/api/v1/cms/banners`
- `/api/v1/cms/banners/{banner_id}`
- `/api/v1/cms/menus`
- `/api/v1/cms/menus/{menu_id}/items`
- `/api/v1/cms/pages`
- `/api/v1/cms/pages/slug/{slug}`
- `/api/v1/cms/pages/{page_id}`

</details>

<details><summary><code>/api/v1/comments</code> (4)</summary>

- `/api/v1/comments`
- `/api/v1/comments/list`
- `/api/v1/comments/{comment_id}`
- `/api/v1/comments/{comment_id}/replies`

</details>

<details><summary><code>/api/v1/contacts</code> (1)</summary>

- `/api/v1/contacts`

</details>

<details><summary><code>/api/v1/databases</code> (3)</summary>

- `/api/v1/databases`
- `/api/v1/databases/remove`
- `/api/v1/databases/userdatabase/get`

</details>

<details><summary><code>/api/v1/file_explorer</code> (16)</summary>

- `/api/v1/file_explorer/files/assign`
- `/api/v1/file_explorer/files/delete`
- `/api/v1/file_explorer/files/download`
- `/api/v1/file_explorer/files/list`
- `/api/v1/file_explorer/files/read`
- `/api/v1/file_explorer/files/restore`
- `/api/v1/file_explorer/files/update`
- `/api/v1/file_explorer/folders/assign`
- `/api/v1/file_explorer/folders/create`
- `/api/v1/file_explorer/folders/delete`
- `/api/v1/file_explorer/folders/list`
- `/api/v1/file_explorer/folders/read`
- `/api/v1/file_explorer/folders/update`
- `/api/v1/file_explorer/google/files/delete`
- `/api/v1/file_explorer/google/files/read`
- `/api/v1/file_explorer/google/folders/create`

</details>

<details><summary><code>/api/v1/galleries</code> (6)</summary>

- `/api/v1/galleries`
- `/api/v1/galleries/slug/{slug}`
- `/api/v1/galleries/{gallery_id}`
- `/api/v1/galleries/{gallery_id}/albums`
- `/api/v1/galleries/{gallery_id}/items`
- `/api/v1/galleries/{gallery_id}/items/{item_id}`

</details>

<details><summary><code>/api/v1/google-drive</code> (14)</summary>

- `/api/v1/google-drive/activity/audit/list`
- `/api/v1/google-drive/activity/history`
- `/api/v1/google-drive/activity/query`
- `/api/v1/google-drive/activity/summary`
- `/api/v1/google-drive/activity/sync`
- `/api/v1/google-drive/labels/apply`
- `/api/v1/google-drive/labels/assign`
- `/api/v1/google-drive/labels/create`
- `/api/v1/google-drive/labels/delete`
- `/api/v1/google-drive/labels/file`
- `/api/v1/google-drive/labels/get`
- `/api/v1/google-drive/labels/list`
- `/api/v1/google-drive/labels/remove`
- `/api/v1/google-drive/labels/update`

</details>

<details><summary><code>/api/v1/internal</code> (1)</summary>

- `/api/v1/internal/status`

</details>

<details><summary><code>/api/v1/localization</code> (2)</summary>

- `/api/v1/localization/countries`
- `/api/v1/localization/languages`

</details>

<details><summary><code>/api/v1/media</code> (9)</summary>

- `/api/v1/media/dashboard`
- `/api/v1/media/files`
- `/api/v1/media/files/delete`
- `/api/v1/media/files/list`
- `/api/v1/media/files/upload`
- `/api/v1/media/files/{file_id}`
- `/api/v1/media/folders`
- `/api/v1/media/folders/star`
- `/api/v1/media/types`

</details>

<details><summary><code>/api/v1/memberships</code> (3)</summary>

- `/api/v1/memberships/join`
- `/api/v1/memberships/payments/{payment_id}/complete`
- `/api/v1/memberships/payments/{payment_id}/confirm`

</details>

<details><summary><code>/api/v1/messaging</code> (9)</summary>

- `/api/v1/messaging/chat_monitor/active_users`
- `/api/v1/messaging/chat_monitor/top_conversations`
- `/api/v1/messaging/conversation`
- `/api/v1/messaging/conversations`
- `/api/v1/messaging/mark-read`
- `/api/v1/messaging/notifications/list`
- `/api/v1/messaging/notifications/mark-all-read`
- `/api/v1/messaging/notifications/mark-read`
- `/api/v1/messaging/send`

</details>

<details><summary><code>/api/v1/moderation</code> (5)</summary>

- `/api/v1/moderation/cases`
- `/api/v1/moderation/cases/{case_id}`
- `/api/v1/moderation/reports`
- `/api/v1/moderation/reports/{report_id}`
- `/api/v1/moderation/reports/{report_id}/review`

</details>

<details><summary><code>/api/v1/notification</code> (9)</summary>

- `/api/v1/notification/clearall`
- `/api/v1/notification/countunread`
- `/api/v1/notification/countunreadbyappmodes`
- `/api/v1/notification/createtoken`
- `/api/v1/notification/delete`
- `/api/v1/notification/get`
- `/api/v1/notification/markallasread`
- `/api/v1/notification/markasread`
- `/api/v1/notification/markasreadbytype`

</details>

<details><summary><code>/api/v1/notifications</code> (4)</summary>

- `/api/v1/notifications/clear`
- `/api/v1/notifications/list`
- `/api/v1/notifications/read`
- `/api/v1/notifications/read_all`

</details>

<details><summary><code>/api/v1/novel_genres</code> (5)</summary>

- `/api/v1/novel_genres/create`
- `/api/v1/novel_genres/delete`
- `/api/v1/novel_genres/get`
- `/api/v1/novel_genres/list`
- `/api/v1/novel_genres/update`

</details>

<details><summary><code>/api/v1/novels</code> (21)</summary>

- `/api/v1/novels/chapters/create`
- `/api/v1/novels/chapters/delete`
- `/api/v1/novels/chapters/get`
- `/api/v1/novels/chapters/list`
- `/api/v1/novels/chapters/revisions/get`
- `/api/v1/novels/chapters/revisions/list`
- `/api/v1/novels/chapters/revisions/restore`
- `/api/v1/novels/chapters/update`
- `/api/v1/novels/create`
- `/api/v1/novels/delete`
- `/api/v1/novels/featured/list`
- `/api/v1/novels/get`
- `/api/v1/novels/list`
- `/api/v1/novels/slug/get`
- `/api/v1/novels/slug/{slug}`
- `/api/v1/novels/update`
- `/api/v1/novels/volumes/create`
- `/api/v1/novels/volumes/delete`
- `/api/v1/novels/volumes/get`
- `/api/v1/novels/volumes/list`
- `/api/v1/novels/volumes/update`

</details>

<details><summary><code>/api/v1/phone_code</code> (1)</summary>

- `/api/v1/phone_code`

</details>

<details><summary><code>/api/v1/posts</code> (9)</summary>

- `/api/v1/posts`
- `/api/v1/posts/featured/list`
- `/api/v1/posts/list`
- `/api/v1/posts/slug/{slug}`
- `/api/v1/posts/{post_id}`
- `/api/v1/posts/{post_id}/bookmarks`
- `/api/v1/posts/{post_id}/bookmarks/{bookmark_id}`
- `/api/v1/posts/{post_id}/reactions`
- `/api/v1/posts/{post_id}/reactions/list`

</details>

<details><summary><code>/api/v1/rbac</code> (1)</summary>

- `/api/v1/rbac/roles/list`

</details>

<details><summary><code>/api/v1/rty</code> (22)</summary>

- `/api/v1/rty/dragon/site/artists`
- `/api/v1/rty/dragon/site/artists/{code}`
- `/api/v1/rty/dragon/site/artworks`
- `/api/v1/rty/dragon/site/artworks/{slug}`
- `/api/v1/rty/dragon/site/auth/login`
- `/api/v1/rty/dragon/site/auth/logout`
- `/api/v1/rty/dragon/site/auth/me`
- `/api/v1/rty/dragon/site/auth/recovery/account`
- `/api/v1/rty/dragon/site/auth/recovery/config`
- `/api/v1/rty/dragon/site/auth/recovery/detect`
- `/api/v1/rty/dragon/site/auth/recovery/link`
- `/api/v1/rty/dragon/site/auth/recovery/request`
- `/api/v1/rty/dragon/site/auth/recovery/reset`
- `/api/v1/rty/dragon/site/auth/recovery/verify`
- `/api/v1/rty/dragon/site/auth/register`
- `/api/v1/rty/dragon/site/galleries`
- `/api/v1/rty/dragon/site/galleries/{slug}`
- `/api/v1/rty/dragon/site/meta`
- `/api/v1/rty/dragon/site/pages/{slug}`
- `/api/v1/rty/dragon/site/posts`
- `/api/v1/rty/dragon/site/posts/{slug}`
- `/api/v1/rty/dragon/site/session`

</details>

<details><summary><code>/api/v1/security</code> (2)</summary>

- `/api/v1/security/api-keys`
- `/api/v1/security/api-keys/{key_id}`

</details>

<details><summary><code>/api/v1/series</code> (3)</summary>

- `/api/v1/series`
- `/api/v1/series/list`
- `/api/v1/series/{series_id}`

</details>

<details><summary><code>/api/v1/settings</code> (4)</summary>

- `/api/v1/settings`
- `/api/v1/settings/feature-flags/all`
- `/api/v1/settings/feature-flags/{code}`
- `/api/v1/settings/{code}`

</details>

<details><summary><code>/api/v1/subscriptions</code> (15)</summary>

- `/api/v1/subscriptions/payments/create`
- `/api/v1/subscriptions/payments/delete/{payment_id}`
- `/api/v1/subscriptions/payments/list`
- `/api/v1/subscriptions/payments/update/{payment_id}`
- `/api/v1/subscriptions/payments/{payment_id}`
- `/api/v1/subscriptions/plans/create`
- `/api/v1/subscriptions/plans/delete/{plan_id}`
- `/api/v1/subscriptions/plans/list`
- `/api/v1/subscriptions/plans/update/{plan_id}`
- `/api/v1/subscriptions/plans/{plan_id}`
- `/api/v1/subscriptions/subscriptions/create`
- `/api/v1/subscriptions/subscriptions/delete/{subscription_id}`
- `/api/v1/subscriptions/subscriptions/list`
- `/api/v1/subscriptions/subscriptions/update/{subscription_id}`
- `/api/v1/subscriptions/subscriptions/{subscription_id}`

</details>

<details><summary><code>/api/v1/tags</code> (3)</summary>

- `/api/v1/tags`
- `/api/v1/tags/list`
- `/api/v1/tags/{tag_id}`

</details>

<details><summary><code>/api/v1/users</code> (9)</summary>

- `/api/v1/users/address/delete`
- `/api/v1/users/address/save`
- `/api/v1/users/address/setDefault`
- `/api/v1/users/create`
- `/api/v1/users/detail`
- `/api/v1/users/profile`
- `/api/v1/users/profile/update`
- `/api/v1/users/remove`
- `/api/v1/users/update`

</details>

<details><summary><code>/chat</code> (2)</summary>

- `/chat/mongo/history`
- `/chat/mongo/send`

</details>

<details><summary><code>/debug</code> (1)</summary>

- `/debug/routes`

</details>

<details><summary><code>/health</code> (1)</summary>

- `/health`

</details>

<details><summary><code>/iframe-cookie</code> (1)</summary>

- `/iframe-cookie`

</details>

<details><summary><code>/missing</code> (1)</summary>

- `/missing`

</details>

<details><summary><code>/msg</code> (1)</summary>

- `/msg`

</details>

<details><summary><code>/redoc</code> (1)</summary>

- `/redoc`

</details>

<details><summary><code>/rtsauth</code> (8)</summary>

- `/rtsauth/oauth`
- `/rtsauth/passkey/login/options`
- `/rtsauth/passkey/login/verify`
- `/rtsauth/passkey/register/options`
- `/rtsauth/passkey/register/verify`
- `/rtsauth/passkeys`
- `/rtsauth/passkeys/{passkey_id}`
- `/rtsauth/register`

</details>

<details><summary><code>/session</code> (1)</summary>

- `/session`

</details>

<details><summary><code>/ws</code> (3)</summary>

- `/ws/chat-monitor`
- `/ws/chat/{room_id}`
- `/ws/notifications/{user_id}`

</details>

---

*End of generated API URL documentation.*