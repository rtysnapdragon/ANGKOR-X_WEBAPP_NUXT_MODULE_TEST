# API URL Documentation

> **Updated by:** static endpoint collection from project source (route decorators, `APIRouter`, `include_router`).
> **Scope:** all discovered route definitions in repository (excluding `.venv`, caches, `node_modules`).
> **Details included per endpoint URL:** methods, resolved/defined path, handler, source (file:line), mount/base/status, tags/summary/description, status code, response model/class/responses, dependencies flags, include_in_schema/deprecated/name/operation_id, and best-effort signature parameters (path/query/body/form/file/header/cookie/dependency/request markers, annotations, defaults, marker meta) plus docstrings.
> **Note:** best-effort from AST/static scan; verify runtime behavior and exact schemas via `main.py`, `app/api/v1/router.py`, and `/openapi.json`.
> **Manual additions:** the five `/api/v1/file_explorer/categories/*` endpoints were implemented after the scan from `API_URL_DOC_NEW_REQUIRED.md` and are documented in the File Explorer section (items 24-28).

## Summary

- **Total route definitions:** 499
- **Unique (methods, resolved path):** 445
- **Source files with routes:** 55
- **Mounted/active (inferred):** 455 definitions
- **Not mounted / legacy / unresolved:** 44 definitions

## Table of Contents

1. [System & Health](#system--health) (4 routes)
2. [Authentication (Core)](#authentication-core) (42 routes)
3. [User Profile](#user-profile) (10 routes)
4. [File Explorer (Multi-Provider)](#file-explorer-multi-provider) (28 routes)
5. [Dashboard API](#dashboard-api) (4 routes)
6. [RBAC (Roles & Permissions)](#rbac-roles--permissions) (29 routes)
7. [Employee & Signature](#employee--signature) (5 routes)
8. [User Management](#user-management) (10 routes)
9. [Address / Localization](#address--localization) (12 routes)
10. [AI Chat](#ai-chat) (1 routes)
11. [Artists](#artists) (11 routes)
12. [Artworks, Galleries & Collections](#artworks-galleries--collections) (24 routes)
13. [Chat (v1 API)](#chat-v1-api) (18 routes)
14. [CMS](#cms) (16 routes)
15. [CMS Management](#cms-management) (36 routes)
16. [Comments](#comments) (6 routes)
17. [Databases Controller](#databases-controller) (3 routes)
18. [Google Drive Activity & Audit (nested)](#google_drive-activity--audit-nested) (5 routes)
19. [Google Drive Labels & Metadata (nested)](#google_drive-labels--metadata-nested) (7 routes)
20. [Forum](#forum) (32 routes)
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
43. [Google Drive / OAuth (legacy v1 module - not mounted)](#google_drive--oauth-legacy-v1-module---not-mounted) (16 routes)
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

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/` | `root` |  | mounted in main.py (app route) |
| 2 | `GET` | `/debug/routes` | `debug_routes` |  | mounted in main.py (app route) |
| 3 | `GET` | `/health` | `health` |  | mounted in main.py (app route) |
| 4 | `GET` | `/redoc` | `redoc` |  | mounted in main.py (app route) |

### Endpoint details

#### 1. `GET` `/`

- **Handler:** `root` (async)
- **Source:** `main.py`:317
- **Defined path:** `/`
- **Router:** object=`app` prefix=`` resolved_base=``
- **Mount/status:** mounted in main.py (app route)
- **Tags:** `['Landing']`
- **Response class:** `HTMLResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

#### 2. `GET` `/debug/routes`

- **Handler:** `debug_routes` (async)
- **Source:** `main.py`:365
- **Defined path:** `/debug/routes`
- **Router:** object=`app` prefix=`` resolved_base=``
- **Mount/status:** mounted in main.py (app route)
- **Tags:** `['Debug']`
- **Include in schema:** `False`

**Parameters:** none declared in signature (or not detected).

#### 3. `GET` `/health`

- **Handler:** `health` (async)
- **Source:** `main.py`:339
- **Defined path:** `/health`
- **Router:** object=`app` prefix=`` resolved_base=``
- **Mount/status:** mounted in main.py (app route)
- **Tags:** `['Health']`

**Parameters:** none declared in signature (or not detected).

#### 4. `GET` `/redoc`

- **Handler:** `redoc` (async)
- **Source:** `main.py`:331
- **Defined path:** `/redoc`
- **Router:** object=`app` prefix=`` resolved_base=``
- **Mount/status:** mounted in main.py (app route)
- **Include in schema:** `False`

**Parameters:** none declared in signature (or not detected).

---

## Authentication (Core)

- **Source files:** `app/api/v1/endpoints/auth.py`, `app/api/v1/endpoints/cmd_oauth.py`, `app/api/v1/endpoints/cms_oauth.py`, `app/api/v1/endpoints/rtsauth.py`, `app/api/v1/endpoints/website_auth.py`, `app/routers/auth.py`
- **Endpoints:** 42
- **Mount/status:** DEFINED, NOT MOUNTED in main.py scan (legacy/unused?) (2); mounted (/api/v1 router) (38); mounted in main.py (2)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/SetAuthorizeCookie` | `authorize_iframe` |  | DEFINED, NOT MOUNTED in main.py scan (legacy/unused?) |
| 2 | `GET` | `/api/v1/auth/google` | `google_login` | Redirect to Google consent screen (legacy) | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/auth/login` | `login` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/auth/logout` | `logout` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/auth/me` | `get_me` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/auth/me/avatar` | `upload_avatar` |  | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/auth/me/plan` | `get_current_plan` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/auth/me/update` | `update_profile` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/auth/oauth/exchange` | `oauth_exchange` | Redeem a one-time OAuth ticket for an app session | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/auth/oauth/initiate` | `oauth_initiate` | Build OAuth provider authorization URL | mounted (/api/v1 router) |
| 11 | `GET` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback_legacy` |  | mounted (/api/v1 router) |
| 12 | `POST` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback` | Telegram Login Widget callback | mounted (/api/v1 router) |
| 13 | `GET` | `/api/v1/auth/oauth/telegram/config` | `telegram_config` |  | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/auth/oauth/telegram/oidc` | `telegram_oidc_login` | Exchange a verified Telegram ID token for an app session | mounted (/api/v1 router) |
| 15 | `GET` | `/api/v1/auth/oauth/telegram/widget` | `telegram_widget` |  | mounted (/api/v1 router) |
| 16 | `GET` | `/api/v1/auth/oauth/token` | `oauth_token` |  | mounted (/api/v1 router) |
| 17 | `GET, POST` | `/api/v1/auth/oauth/{provider}/callback` | `oauth_callback` |  | mounted (/api/v1 router) |
| 18 | `POST` | `/api/v1/auth/refresh` | `refresh_token` |  | mounted (/api/v1 router) |
| 19 | `POST` | `/api/v1/auth/register` | `register` |  | mounted (/api/v1 router) |
| 20 | `GET` | `/api/v1/cmd/activity/history` | `cmd_activity_history` |  | mounted (/api/v1 router) |
| 21 | `GET` | `/api/v1/cmd/activity/query` | `cmd_activity_query` |  | mounted (/api/v1 router) |
| 22 | `GET` | `/api/v1/cmd/activity/summary` | `cmd_activity_summary` |  | mounted (/api/v1 router) |
| 23 | `POST` | `/api/v1/cmd/labels/apply` | `cmd_label_apply` |  | mounted (/api/v1 router) |
| 24 | `POST` | `/api/v1/cmd/labels/create` | `cmd_label_create` |  | mounted (/api/v1 router) |
| 25 | `GET` | `/api/v1/cmd/labels/list` | `cmd_labels_list` |  | mounted (/api/v1 router) |
| 26 | `POST` | `/api/v1/cmd/labels/remove` | `cmd_label_remove` |  | mounted (/api/v1 router) |
| 27 | `GET` | `/api/v1/google_drive/callback` | `drive_callback` |  | mounted (/api/v1 router) |
| 28 | `POST` | `/api/v1/google_drive/connect` | `connect_drive` |  | mounted (/api/v1 router) |
| 29 | `POST` | `/api/v1/google_drive/connect_cls` | `connect_drive_cls` |  | mounted (/api/v1 router) |
| 30 | `POST` | `/api/v1/google_drive/disconnect` | `disconnect_drive` |  | mounted (/api/v1 router) |
| 31 | `GET` | `/api/v1/google_drive/files` | `list_stored_drive_files` |  | mounted (/api/v1 router) |
| 32 | `GET` | `/api/v1/google_drive/list` | `list_drive` |  | mounted (/api/v1 router) |
| 33 | `GET` | `/api/v1/google_drive/status` | `drive_status` |  | mounted (/api/v1 router) |
| 34 | `POST` | `/api/v1/google_drive/summary` | `drive_summary` |  | mounted (/api/v1 router) |
| 35 | `POST` | `/api/v1/google_drive/upload` | `upload_to_drive` |  | mounted (/api/v1 router) |
| 36 | `POST` | `/api/v1/rty/dragon/site/auth/login` | `website_login` | Sign in with encrypted email/username/phone + password | mounted (/api/v1 router) |
| 37 | `POST` | `/api/v1/rty/dragon/site/auth/logout` | `website_logout` | Revoke the current token and clear auth cookies | mounted (/api/v1 router) |
| 38 | `GET` | `/api/v1/rty/dragon/site/auth/me` | `website_me` | Current website user (encrypted email/username/phone) | mounted (/api/v1 router) |
| 39 | `POST` | `/api/v1/rty/dragon/site/auth/register` | `website_register` | Register with encrypted email/username/phone/password | mounted (/api/v1 router) |
| 40 | `POST` | `/iframe-cookie` | `iframe_cookie` |  | DEFINED, NOT MOUNTED in main.py scan (legacy/unused?) |
| 41 | `POST` | `/rtsauth/oauth` | `rtsauth_oauth` | RTS SSO token endpoint (login or refresh) | mounted in main.py |
| 42 | `POST` | `/rtsauth/register` | `rtsauth_register` | RTS SSO register (creates account and signs in) | mounted in main.py |

### Endpoint details

#### 1. `GET` `/SetAuthorizeCookie`

- **Handler:** `authorize_iframe` (async)
- **Source:** `app/routers/auth.py`:15
- **Defined path:** `/SetAuthorizeCookie`
- **Router:** object=`router` prefix=`` resolved_base=`/`
- **Mount/status:** DEFINED, NOT MOUNTED in main.py scan (legacy/unused?)
- **Tags:** `['Authentication Authorize IFrame']`
- **Response class:** `HTMLResponse`

**Parameters:** none declared in signature (or not detected).

#### 2. `GET` `/api/v1/auth/google`

- **Handler:** `google_login` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1947
- **Defined path:** `/google`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Summary:** Redirect to Google consent screen (legacy)

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `POST` `/api/v1/auth/login`

- **Handler:** `login` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:407
- **Defined path:** `/login`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response model:** `TokenResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `LoginRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `POST` `/api/v1/auth/logout`

- **Handler:** `logout` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:651
- **Defined path:** `/logout`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response model:** `dict`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |

**Docstring:**

```text
Revoke the presented access token (header or cookie) and clear cookies.
```

#### 5. `GET` `/api/v1/auth/me`

- **Handler:** `get_me` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:2027
- **Defined path:** `/me`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response model:** `CurrentUser`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 6. `POST` `/api/v1/auth/me/avatar`

- **Handler:** `upload_avatar` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:2085
- **Defined path:** `/me/avatar`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response model:** `dict`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `GET` `/api/v1/auth/me/plan`

- **Handler:** `get_current_plan` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:2154
- **Defined path:** `/me/plan`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response model:** `dict`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 8. `POST` `/api/v1/auth/me/update`

- **Handler:** `update_profile` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:2232
- **Defined path:** `/me/update`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response model:** `UserOut`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `UpdateProfileRequest` | `` | `` |  |
| `current_user` | `USER` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Update the current user's profile fields using raw SQL.
```

#### 9. `POST` `/api/v1/auth/oauth/exchange`

- **Handler:** `oauth_exchange` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1582
- **Defined path:** `/oauth/exchange`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Summary:** Redeem a one-time OAuth ticket for an app session

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `OAuthExchangeRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `POST` `/api/v1/auth/oauth/initiate`

- **Handler:** `oauth_initiate` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1482
- **Defined path:** `/oauth/initiate`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Summary:** Build OAuth provider authorization URL
- **Response model:** `OAuthInitiateResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `OAuthInitiateRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 11. `GET` `/api/v1/auth/oauth/telegram/callback`

- **Handler:** `telegram_oauth_callback_legacy` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1799
- **Defined path:** `/oauth/telegram/callback`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 12. `POST` `/api/v1/auth/oauth/telegram/callback`

- **Handler:** `telegram_oauth_callback` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1788
- **Defined path:** `/oauth/telegram/callback`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Summary:** Telegram Login Widget callback
- **Description:** Receives the Telegram Login Widget signed payload as a form POST (id, first_name, last_name, username, photo_url, auth_date, hash). Verifies the HMAC-SHA256 hash against TELEGRAM_BOT_TOKEN, rejects stale auth_date, upserts the Telegram user, and redirects to the frontend /oauth/callback with access_token, refresh_token and expires_in (or ?error=<code> on failure).
- **Response class:** `RedirectResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 13. `GET` `/api/v1/auth/oauth/telegram/config`

- **Handler:** `telegram_config` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1845
- **Defined path:** `/oauth/telegram/config`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

#### 14. `POST` `/api/v1/auth/oauth/telegram/oidc`

- **Handler:** `telegram_oidc_login` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1612
- **Defined path:** `/oauth/telegram/oidc`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Summary:** Exchange a verified Telegram ID token for an app session

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `TelegramOIDCLoginRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 15. `GET` `/api/v1/auth/oauth/telegram/widget`

- **Handler:** `telegram_widget` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1922
- **Defined path:** `/oauth/telegram/widget`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response class:** `HTMLResponse`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

**Docstring:**

```text
DEPRECATED: backend-rendered widget page. The widget must run on the
FRONTEND origin (registered in BotFather), so production uses the site's
/telegram-widget page instead. Kept only for backward compatibility.
```

#### 16. `GET` `/api/v1/auth/oauth/token`

- **Handler:** `oauth_token` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:507
- **Defined path:** `/oauth/token`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `db` | `` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 17. `GET, POST` `/api/v1/auth/oauth/{provider}/callback`

- **Handler:** `oauth_callback` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:1513
- **Defined path:** `/oauth/{provider}/callback`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `provider` | `str` | `` | `path` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 18. `POST` `/api/v1/auth/refresh`

- **Handler:** `refresh_token` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:677
- **Defined path:** `/refresh`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Response model:** `TokenResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RefreshRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Exchange a valid refresh token (body or encrypted cookie) for a new pair.
```

#### 19. `POST` `/api/v1/auth/register`

- **Handler:** `register` (async)
- **Source:** `app/api/v1/endpoints/auth.py`:320
- **Defined path:** `/register`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authentication']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `UserOut`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RegisterRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Create a local account. Credentials arrive AES-encrypted; decode -> validate -> insert.
```

#### 20. `GET` `/api/v1/cmd/activity/history`

- **Handler:** `cmd_activity_history` (async)
- **Source:** `app/api/v1/endpoints/cmd_oauth.py`:349
- **Defined path:** `/activity/history`
- **Router:** object=`router` prefix=`/cmd` resolved_base=`/api/v1/cmd`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMD Google Drive API']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `target_id` | `str \| None` | `Query(None, alias='targetId', max_length=255)` | `query` | {'arg': 'None', 'alias': "'targetId'", 'max_length': '255'} |
| `action` | `str \| None` | `Query(None, max_length=100)` | `query` | {'arg': 'None', 'max_length': '100'} |
| `days` | `int` | `Query(30, ge=1, le=365)` | `query` | {'arg': '30', 'ge': '1', 'le': '365'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Get Drive activity history via command-style endpoint.

Parameters
----------
target_id : str, optional
    Drive file or folder ID to filter by
action : str, optional
    Action name to filter by (create, edit, move, delete, etc.)
days : int, optional
    Lookback window in days (1-365)
```

#### 21. `GET` `/api/v1/cmd/activity/query`

- **Handler:** `cmd_activity_query` (async)
- **Source:** `app/api/v1/endpoints/cmd_oauth.py`:392
- **Defined path:** `/activity/query`
- **Router:** object=`router` prefix=`/cmd` resolved_base=`/api/v1/cmd`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMD Google Drive API']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `filter` | `str \| None` | `Query(None, max_length=2000)` | `query` | {'arg': 'None', 'max_length': '2000'} |
| `page_size` | `int` | `Query(50, ge=1, le=500)` | `query` | {'arg': '50', 'ge': '1', 'le': '500'} |
| `page_token` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Query Drive Activity API via command-style endpoint.

Executes arbitrary filter queries against the Drive Activity API.
```

#### 22. `GET` `/api/v1/cmd/activity/summary`

- **Handler:** `cmd_activity_summary` (async)
- **Source:** `app/api/v1/endpoints/cmd_oauth.py`:376
- **Defined path:** `/activity/summary`
- **Router:** object=`router` prefix=`/cmd` resolved_base=`/api/v1/cmd`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMD Google Drive API']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `days` | `int` | `Query(30, ge=1, le=365)` | `query` | {'arg': '30', 'ge': '1', 'le': '365'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Build activity summary via command-style endpoint.

Generates daily/weekly/monthly activity summaries from Drive Activity API.
```

#### 23. `POST` `/api/v1/cmd/labels/apply`

- **Handler:** `cmd_label_apply` (async)
- **Source:** `app/api/v1/endpoints/cmd_oauth.py`:463
- **Defined path:** `/labels/apply`
- **Router:** object=`router` prefix=`/cmd` resolved_base=`/api/v1/cmd`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMD Google Drive API']`
- **Status code:** `status.HTTP_200_OK`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any]` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.write'))` | `dependency` | {'arg': "require_permission('system.google_drive.write')"} |

**Docstring:**

```text
Apply a label to a Drive file via command-style endpoint.

Applies a label to a file for classification and structured metadata.
The label defines categorization such as department, document type,
confidentiality level, or approval status.
```

#### 24. `POST` `/api/v1/cmd/labels/create`

- **Handler:** `cmd_label_create` (async)
- **Source:** `app/api/v1/endpoints/cmd_oauth.py`:414
- **Defined path:** `/labels/create`
- **Router:** object=`router` prefix=`/cmd` resolved_base=`/api/v1/cmd`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMD Google Drive API']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any]` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.write'))` | `dependency` | {'arg': "require_permission('system.google_drive.write')"} |

**Docstring:**

```text
Create a Drive label via command-style endpoint.

Creates a new label for document classification and custom metadata.
Labels can categorize files by department, document type, or define
confidentiality levels and approval statuses.
```

#### 25. `GET` `/api/v1/cmd/labels/list`

- **Handler:** `cmd_labels_list` (async)
- **Source:** `app/api/v1/endpoints/cmd_oauth.py`:445
- **Defined path:** `/labels/list`
- **Router:** object=`router` prefix=`/cmd` resolved_base=`/api/v1/cmd`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMD Google Drive API']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
List Drive labels via command-style endpoint.

Returns all labels from Drive Labels API for document classification.
Labels can be used to categorize files by department, document type,
confidentiality levels (Public, Internal, Confidential), or approval
statuses (Pending, Approved, Rejected).
```

#### 26. `POST` `/api/v1/cmd/labels/remove`

- **Handler:** `cmd_label_remove` (async)
- **Source:** `app/api/v1/endpoints/cmd_oauth.py`:491
- **Defined path:** `/labels/remove`
- **Router:** object=`router` prefix=`/cmd` resolved_base=`/api/v1/cmd`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMD Google Drive API']`
- **Status code:** `status.HTTP_200_OK`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any]` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.write'))` | `dependency` | {'arg': "require_permission('system.google_drive.write')"} |

**Docstring:**

```text
Remove a label from a Drive file via command-style endpoint.

Removes a previously applied label from a file.
```

#### 27. `GET` `/api/v1/google_drive/callback`

- **Handler:** `drive_callback` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:710
- **Defined path:** `/callback`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `code` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `state` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `error` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Google redirects here. Exchanges the code and stores the tokens.

Unauthenticated by design - the signed-in identity comes from the
single-use ``state`` row written by :func:`connect_drive`, which carries the
user id the authorisation was started for.
```

#### 28. `POST` `/api/v1/google_drive/connect`

- **Handler:** `connect_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:480
- **Defined path:** `/connect`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `DriveConnectRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.connect'))` | `dependency` | {'arg': "require_permission('system.google_drive.connect')"} |

**Docstring:**

```text
Begin the Drive authorisation handshake.

Returns Google's consent URL for the frontend to navigate to. A ``state``
row is written first and consumed exactly once by the callback, which is what
prevents CSRF on the authorisation leg.

``Action: "authorize"`` is the embedded-widget variant: instead of a redirect
the browser posts the one-shot code it received in a popup, and the code is
exchanged right here.
```

#### 29. `POST` `/api/v1/google_drive/connect_cls`

- **Handler:** `connect_drive_cls` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:661
- **Defined path:** `/connect_cls`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveConnectionStatus`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `DriveConnectRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `Optional[CurrentUser]` | `Depends(_cls_optional_user)` | `dependency` | {'arg': '_cls_optional_user'} |

**Docstring:**

```text
Finish a Google Drive handshake started by the embedded widget **without
a system authorization token** - no ``require_permission(...)`` check runs
here, so the file-explorer widget can connect Drive even when the caller
lacks ``system.google_drive.connect``.

Payload (the CLS / ``postmessage`` variant of ``Action: "authorize"``)::

    {"Action": "authorize",
     "Code": "4/0AXlqoi...",
     "RedirectUri": "postmessage"}

The one-shot code is exchanged server-side (the client secret never
reaches the browser) and the tokens are written to ``OAUTH_ACCOUNTS`` for
the signed-in user, or for the system superuser when no session is present.
```

#### 30. `POST` `/api/v1/google_drive/disconnect`

- **Handler:** `disconnect_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:898
- **Defined path:** `/disconnect`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.delete'))` | `dependency` | {'arg': "require_permission('system.google_drive.delete')"} |

**Docstring:**

```text
Remove the stored Google tokens.
```

#### 31. `GET` `/api/v1/google_drive/files`

- **Handler:** `list_stored_drive_files` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:864
- **Defined path:** `/files`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveStoredFileListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(50, ge=1, le=200)` | `query` | {'arg': '50', 'ge': '1', 'le': '200'} |
| `folder_id` | `str \| None` | `Query(None, alias='folderId', max_length=255)` | `query` | {'arg': 'None', 'alias': "'folderId'", 'max_length': '255'} |
| `search` | `str \| None` | `Query(None, max_length=200)` | `query` | {'arg': 'None', 'max_length': '200'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Files this system uploaded, read back from ``CMS_DRIVE_FILES``.

The live Drive listing (``GET /list``) is unchanged; this answers from the
database so the record survives even when Drive is unreachable.
```

#### 32. `GET` `/api/v1/google_drive/list`

- **Handler:** `list_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:788
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `folder_id` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `page_size` | `int` | `Query(100, ge=1, le=1000)` | `query` | {'arg': '100', 'ge': '1', 'le': '1000'} |
| `page_token` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
List folders and files inside a Drive folder.
```

#### 33. `GET` `/api/v1/google_drive/status`

- **Handler:** `drive_status` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:316
- **Defined path:** `/status`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveConnectionStatus`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Whether the signed-in user has a usable Drive connection.

When the stored access token has lapsed the answer comes back immediately
(from the stored state) and a background task refreshes the token against
Google's token endpoint — ``RefreshingInBackground`` tells the caller a
refresh was scheduled; the next call reports the fresh expiry.
```

#### 34. `POST` `/api/v1/google_drive/summary`

- **Handler:** `drive_summary` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:912
- **Defined path:** `/summary`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveSummaryResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `DriveSummaryRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Deep Drive summary: file/folder counts, type breakdown, largest/recent files.

Controlled by payload (POST = Action in body per GET/POST-only contract):
- Deep: walk the tree (bounded by MaxItems/MaxPages)
- MaxItems/MaxPages: hard caps on the walk
- Refresh: bypass the 2-minute cache
- IncludeTypes/Largest/Recent: toggle sections to save time
```

#### 35. `POST` `/api/v1/google_drive/upload`

- **Handler:** `upload_to_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth.py`:812
- **Defined path:** `/upload`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveFileUploadResult`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `folder_id` | `str \| None` | `Form(None)` | `form` | {'arg': 'None'} |
| `make_public` | `bool` | `Form(False)` | `form` | {'arg': 'False'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.media.create'))` | `dependency` | {'arg': "require_permission('system.media.create')"} |

**Docstring:**

```text
Upload an asset into Drive for use as a CMS media item.
```

#### 36. `POST` `/api/v1/rty/dragon/site/auth/login`

- **Handler:** `website_login` (async)
- **Source:** `app/api/v1/endpoints/website_auth.py`:319
- **Defined path:** `/site/auth/login`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Auth']`
- **Summary:** Sign in with encrypted email/username/phone + password
- **Response model:** `SeoEnvelope[WebsiteAuthData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `WebsiteLoginRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 37. `POST` `/api/v1/rty/dragon/site/auth/logout`

- **Handler:** `website_logout` (async)
- **Source:** `app/api/v1/endpoints/website_auth.py`:511
- **Defined path:** `/site/auth/logout`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Auth']`
- **Summary:** Revoke the current token and clear auth cookies
- **Response model:** `SeoEnvelope[WebsiteAuthAck]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |

#### 38. `GET` `/api/v1/rty/dragon/site/auth/me`

- **Handler:** `website_me` (async)
- **Source:** `app/api/v1/endpoints/website_auth.py`:486
- **Defined path:** `/site/auth/me`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Auth']`
- **Summary:** Current website user (encrypted email/username/phone)
- **Response model:** `SeoEnvelope[WebsiteAuthMeData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 39. `POST` `/api/v1/rty/dragon/site/auth/register`

- **Handler:** `website_register` (async)
- **Source:** `app/api/v1/endpoints/website_auth.py`:174
- **Defined path:** `/site/auth/register`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Auth']`
- **Summary:** Register with encrypted email/username/phone/password
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `SeoEnvelope[WebsiteAuthData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `WebsiteRegisterRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 40. `POST` `/iframe-cookie`

- **Handler:** `iframe_cookie` (async)
- **Source:** `app/routers/auth.py`:54
- **Defined path:** `/iframe-cookie`
- **Router:** object=`router` prefix=`` resolved_base=`/`
- **Mount/status:** DEFINED, NOT MOUNTED in main.py scan (legacy/unused?)
- **Tags:** `['Authentication Authorize IFrame']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `data` | `IframeAuthData` | `` | `` |  |
| `response` | `Response` | `` | `response` |  |

#### 41. `POST` `/rtsauth/oauth`

- **Handler:** `rtsauth_oauth` (async)
- **Source:** `app/api/v1/endpoints/rtsauth.py`:812
- **Defined path:** `/oauth`
- **Router:** object=`sso_auth` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth ----------------------']`
- **Summary:** RTS SSO token endpoint (login or refresh)

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RtsOAuthRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 42. `POST` `/rtsauth/register`

- **Handler:** `rtsauth_register` (async)
- **Source:** `app/api/v1/endpoints/rtsauth.py`:1062
- **Defined path:** `/register`
- **Router:** object=`sso_auth` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth ----------------------']`
- **Summary:** RTS SSO register (creates account and signs in)
- **Status code:** `201`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RtsRegisterRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## User Profile

- **Source files:** `app/api/v1/endpoints/user_profile.py`
- **Endpoints:** 10
- **Mount/status:** mounted (/api/v1 router) (10)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/user/profile/address` | `list_addresses` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/user/profile/address/delete` | `delete_address` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/user/profile/address/save` | `save_address` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/user/profile/address/setDefault` | `set_default_address` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/user/profile/avatar` | `upload_avatar` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/user/profile/changeEmail` | `change_email` |  | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/user/profile/changePassword` | `change_password` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/user/profile/changePhone` | `change_phone` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/user/profile/info` | `get_profile_info_post` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/user/profile/update` | `update_profile` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/user/profile/address`

- **Handler:** `list_addresses` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:285
- **Defined path:** `/address`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `list[UserAddressRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 2. `POST` `/api/v1/user/profile/address/delete`

- **Handler:** `delete_address` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:308
- **Defined path:** `/address/delete`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserAddressRef` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 3. `POST` `/api/v1/user/profile/address/save`

- **Handler:** `save_address` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:295
- **Defined path:** `/address/save`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `UserAddressRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserAddressSave` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 4. `POST` `/api/v1/user/profile/address/setDefault`

- **Handler:** `set_default_address` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:320
- **Defined path:** `/address/setDefault`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `UserAddressRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserAddressRef` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 5. `POST` `/api/v1/user/profile/avatar`

- **Handler:** `upload_avatar` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:231
- **Defined path:** `/avatar`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `ProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Upload a cropped avatar to Google Drive and point the profile at it.
```

#### 6. `POST` `/api/v1/user/profile/changeEmail`

- **Handler:** `change_email` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:164
- **Defined path:** `/changeEmail`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `StatusResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `ChangeEmailRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 7. `POST` `/api/v1/user/profile/changePassword`

- **Handler:** `change_password` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:195
- **Defined path:** `/changePassword`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `StatusResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `ChangePasswordRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 8. `POST` `/api/v1/user/profile/changePhone`

- **Handler:** `change_phone` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:127
- **Defined path:** `/changePhone`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `StatusResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `ChangePhoneRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 9. `POST` `/api/v1/user/profile/info`

- **Handler:** `get_profile_info_post` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:67
- **Defined path:** `/info`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `ProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 10. `POST` `/api/v1/user/profile/update`

- **Handler:** `update_profile` (async)
- **Source:** `app/api/v1/endpoints/user_profile.py`:77
- **Defined path:** `/update`
- **Router:** object=`router` prefix=`/user/profile` resolved_base=`/api/v1/user/profile`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Profile operations']`
- **Response model:** `ProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `ProfileUpdate` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## File Explorer (Multi-Provider)

- **Source files:** `app/api/v1/endpoints/file_explorer.py`
- **Endpoints:** 28
- **Mount/status:** mounted (/api/v1 router) (28)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/file_explorer/files/assign` | `files_assign` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/file_explorer/files/delete` | `files_delete` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/file_explorer/files/download` | `files_download` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/file_explorer/files/list` | `files_list` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/file_explorer/files/read` | `files_read` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/file_explorer/files/restore` | `files_restore` |  | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/file_explorer/files/update` | `files_update` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/file_explorer/files/upload` | `files_upload` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/file_explorer/folders/assign` | `folders_assign` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/file_explorer/folders/create` | `folders_create` |  | mounted (/api/v1 router) |
| 11 | `GET` | `/api/v1/file_explorer/folders/delete` | `folders_delete` |  | mounted (/api/v1 router) |
| 12 | `POST` | `/api/v1/file_explorer/folders/list` | `folders_list` |  | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/file_explorer/folders/read` | `folders_read` |  | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/file_explorer/folders/update` | `folders_update` |  | mounted (/api/v1 router) |
| 15 | `GET` | `/api/v1/file_explorer/google/files/delete` | `google_files_delete` |  | mounted (/api/v1 router) |
| 16 | `POST` | `/api/v1/file_explorer/google/files/read` | `google_files_read` |  | mounted (/api/v1 router) |
| 17 | `POST` | `/api/v1/file_explorer/google/folders/create` | `google_folders_create` |  | mounted (/api/v1 router) |
| 18 | `POST` | `/api/v1/file_explorer/google/list` | `google_list` |  | mounted (/api/v1 router) |
| 19 | `POST` | `/api/v1/file_explorer/google/summary` | `google_summary` |  | mounted (/api/v1 router) |
| 20 | `POST` | `/api/v1/file_explorer/objects/list` | `objects_list` |  | mounted (/api/v1 router) |
| 21 | `POST` | `/api/v1/file_explorer/providers/list` | `providers_list` |  | mounted (/api/v1 router) |
| 22 | `POST` | `/api/v1/file_explorer/providers/summary` | `providers_summary` |  | mounted (/api/v1 router) |
| 23 | `POST` | `/api/v1/file_explorer/storage/read` | `storage_read` |  | mounted (/api/v1 router) |
| 24 | `POST` | `/api/v1/file_explorer/categories/list` | `categories_list` | List asset categories with search, built-in filtering and paging. | mounted (/api/v1 router) |
| 25 | `POST` | `/api/v1/file_explorer/categories/create` | `categories_create` | Create a category; names and extension ownership are unique. | mounted (/api/v1 router) |
| 26 | `POST` | `/api/v1/file_explorer/categories/update` | `categories_update` | Update a category. Omitted fields keep their current values. | mounted (/api/v1 router) |
| 27 | `GET` | `/api/v1/file_explorer/categories/delete` | `categories_delete` | `GET /categories/delete?Id=6` or `?Ids=6,7` (or the same keys as JSON). | mounted (/api/v1 router) |
| 28 | `POST` | `/api/v1/file_explorer/categories/reorder` | `categories_reorder` | Atomically apply new `SortOrder` values and return the updated list. | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/file_explorer/files/assign`

- **Handler:** `files_assign` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1364
- **Defined path:** `/files/assign`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `ExplorerFileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `FileAssignPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.assign'))` | `dependency` | {'arg': "_guard('system.file_explorer.assign')"} |

**Docstring:**

```text
Move a file into ``FolderId`` (``0`` = root level).
```

#### 2. `GET` `/api/v1/file_explorer/files/delete`

- **Handler:** `files_delete` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1424
- **Defined path:** `/files/delete`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `id_` | `Optional[str]` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `ids` | `Optional[str]` | `Query(None, alias='Ids')` | `query` | {'arg': 'None', 'alias': "'Ids'"} |
| `purge_` | `Optional[str]` | `Query(None, alias='Purge')` | `query` | {'arg': 'None', 'alias': "'Purge'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.delete'))` | `dependency` | {'arg': "_guard('system.file_explorer.delete')"} |

**Docstring:**

```text
``GET /files/delete?Id=1`` or ``?Ids=1,2,3`` (or the same keys as a JSON body).

Soft-deletes (``DELETED_AT``) by default. With ``Purge=true`` the provider
object is deleted best-effort and the row is removed. All-or-nothing:
every file is verified before any is touched.
```

#### 3. `POST` `/api/v1/file_explorer/files/download`

- **Handler:** `files_download` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1387
- **Defined path:** `/files/download`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `_IdPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.read'))` | `dependency` | {'arg': "_guard('system.file_explorer.read')"} |

**Docstring:**

```text
Stream the file's bytes back from whichever provider holds them.
```

#### 4. `POST` `/api/v1/file_explorer/files/list`

- **Handler:** `files_list` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1239
- **Defined path:** `/files/list`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `FileListPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.list'))` | `dependency` | {'arg': "_guard('system.file_explorer.list')"} |

#### 5. `POST` `/api/v1/file_explorer/files/read`

- **Handler:** `files_read` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1337
- **Defined path:** `/files/read`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `ExplorerFileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `_IdPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.read'))` | `dependency` | {'arg': "_guard('system.file_explorer.read')"} |

#### 6. `POST` `/api/v1/file_explorer/files/restore`

- **Handler:** `files_restore` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1376
- **Defined path:** `/files/restore`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `ExplorerFileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `_IdPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.update'))` | `dependency` | {'arg': "_guard('system.file_explorer.update')"} |

#### 7. `POST` `/api/v1/file_explorer/files/update`

- **Handler:** `files_update` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1347
- **Defined path:** `/files/update`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `ExplorerFileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `FileUpdatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.update'))` | `dependency` | {'arg': "_guard('system.file_explorer.update')"} |

**Docstring:**

```text
Rename / move a file, or toggle its public visibility. ``FolderId = 0`` = root level.
```

#### 8. `POST` `/api/v1/file_explorer/files/upload`

- **Handler:** `files_upload` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1266
- **Defined path:** `/files/upload`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `ExplorerFileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `file` | `UploadFile` | `File(..., alias='File')` | `file` | {'arg': '...', 'alias': "'File'"} |
| `provider` | `str` | `Form(..., alias='Provider')` | `form` | {'arg': '...', 'alias': "'Provider'"} |
| `folder_id` | `Optional[int]` | `Form(None, alias='FolderId')` | `form` | {'arg': 'None', 'alias': "'FolderId'"} |
| `make_public` | `bool` | `Form(False, alias='MakePublic')` | `form` | {'arg': 'False', 'alias': "'MakePublic'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.create'))` | `dependency` | {'arg': "_guard('system.file_explorer.create')"} |

**Docstring:**

```text
Validate + upload a file to the chosen provider and record its envelope.

The explorer folder is a *database* concept; bytes always land in the
provider's configured default location (Drive root folder / Supabase
bucket / the bot's storage chat).
```

#### 9. `POST` `/api/v1/file_explorer/folders/assign`

- **Handler:** `folders_assign` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1195
- **Defined path:** `/folders/assign`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `ExplorerFolderRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `FolderAssignPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.assign'))` | `dependency` | {'arg': "_guard('system.file_explorer.assign')"} |

**Docstring:**

```text
Move a folder under ``ParentId`` (``0`` = root level).
```

#### 10. `POST` `/api/v1/file_explorer/folders/create`

- **Handler:** `folders_create` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1145
- **Defined path:** `/folders/create`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `FolderCreatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.create'))` | `dependency` | {'arg': "_guard('system.file_explorer.create')"} |

#### 11. `GET` `/api/v1/file_explorer/folders/delete`

- **Handler:** `folders_delete` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1212
- **Defined path:** `/folders/delete`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `id_` | `Optional[str]` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `ids` | `Optional[str]` | `Query(None, alias='Ids')` | `query` | {'arg': 'None', 'alias': "'Ids'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.delete'))` | `dependency` | {'arg': "_guard('system.file_explorer.delete')"} |

**Docstring:**

```text
``GET /folders/delete?Id=1`` or ``?Ids=1,2,3`` (or the same keys as a JSON body).
Files inside survive and fall back to the root level. All-or-nothing: every
folder is verified before any is deleted.
```

#### 12. `POST` `/api/v1/file_explorer/folders/list`

- **Handler:** `folders_list` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1109
- **Defined path:** `/folders/list`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `FolderListPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.list'))` | `dependency` | {'arg': "_guard('system.file_explorer.list')"} |

**Docstring:**

```text
One directory level per call (``Root=true`` or ``ParentId``); omit both for all.
```

#### 13. `POST` `/api/v1/file_explorer/folders/read`

- **Handler:** `folders_read` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1135
- **Defined path:** `/folders/read`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `ExplorerFolderRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `_IdPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.read'))` | `dependency` | {'arg': "_guard('system.file_explorer.read')"} |

#### 14. `POST` `/api/v1/file_explorer/folders/update`

- **Handler:** `folders_update` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1168
- **Defined path:** `/folders/update`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `ExplorerFolderRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `FolderUpdatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.update'))` | `dependency` | {'arg': "_guard('system.file_explorer.update')"} |

**Docstring:**

```text
Rename / describe / move a folder; descendant paths are recalculated.

``ParentId = 0`` moves it to the root level; omit ``ParentId`` to keep it where it is.
```

#### 15. `GET` `/api/v1/file_explorer/google/files/delete`

- **Handler:** `google_files_delete` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1546
- **Defined path:** `/google/files/delete`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `id_` | `Optional[str]` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `ids` | `Optional[str]` | `Query(None, alias='Ids')` | `query` | {'arg': 'None', 'alias': "'Ids'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.delete'))` | `dependency` | {'arg': "_guard('system.file_explorer.delete')"} |

**Docstring:**

```text
``GET /google/files/delete?Id=<driveFileId>`` or ``?Ids=a,b`` (or a JSON body).
```

#### 16. `POST` `/api/v1/file_explorer/google/files/read`

- **Handler:** `google_files_read` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1513
- **Defined path:** `/google/files/read`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `GoogleFileReadPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.read'))` | `dependency` | {'arg': "_guard('system.file_explorer.read')"} |

**Docstring:**

```text
Drive file metadata via the caller's grant. ``Id`` is the Drive file id.
```

#### 17. `POST` `/api/v1/file_explorer/google/folders/create`

- **Handler:** `google_folders_create` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1490
- **Defined path:** `/google/folders/create`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `GoogleFolderCreatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.create'))` | `dependency` | {'arg': "_guard('system.file_explorer.create')"} |

**Docstring:**

```text
Create a folder in Drive via the caller's grant.
```

#### 18. `POST` `/api/v1/file_explorer/google/list`

- **Handler:** `google_list` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1463
- **Defined path:** `/google/list`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ExplorerObjectsListRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.list'))` | `dependency` | {'arg': "_guard('system.file_explorer.list')"} |

**Docstring:**

```text
Drive-native listing via the caller's grant.
```

#### 19. `POST` `/api/v1/file_explorer/google/summary`

- **Handler:** `google_summary` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1569
- **Defined path:** `/google/summary`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ExplorerStorageReadRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.read'))` | `dependency` | {'arg': "_guard('system.file_explorer.read')"} |

**Docstring:**

```text
Drive deep summary via the caller's grant.
```

#### 20. `POST` `/api/v1/file_explorer/objects/list`

- **Handler:** `objects_list` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:969
- **Defined path:** `/objects/list`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ExplorerObjectsListRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.list'))` | `dependency` | {'arg': "_guard('system.file_explorer.list')"} |

**Docstring:**

```text
Provider-native listing. The provider comes from ``Provider`` in the payload.
```

#### 21. `POST` `/api/v1/file_explorer/providers/list`

- **Handler:** `providers_list` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:937
- **Defined path:** `/providers/list`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `list[ExplorerProviderStatus]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ExplorerProviderListRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.list'))` | `dependency` | {'arg': "_guard('system.file_explorer.list')"} |

**Docstring:**

```text
All providers with connection state, storage figures and recorded usage.
```

#### 22. `POST` `/api/v1/file_explorer/providers/summary`

- **Handler:** `providers_summary` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:947
- **Defined path:** `/providers/summary`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ExplorerProviderReadRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.read'))` | `dependency` | {'arg': "_guard('system.file_explorer.read')"} |

**Docstring:**

```text
Deep summary for ``Provider`` = google | supabase | telegram | r2.
```

#### 23. `POST` `/api/v1/file_explorer/storage/read`

- **Handler:** `storage_read` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:958
- **Defined path:** `/storage/read`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ExplorerStorageReadRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.read'))` | `dependency` | {'arg': "_guard('system.file_explorer.read')"} |

**Docstring:**

```text
Provider storage summary (same result as ``/providers/summary``).
```

#### 24. `POST` `/api/v1/file_explorer/categories/list`

- **Handler:** `categories_list` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1722
- **Defined path:** `/categories/list`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `AssetCategoryListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryListPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.list'))` | `dependency` | {'arg': "_guard('system.file_explorer.list')"} |

**Payload:** `{ "Search": string|null, "IncludeBuiltin": boolean=true, "Page": integer=1, "PageSize": integer=100 (max 500), "SortBy": "SortOrder"|"Name"|"CreatedAt"|"UpdatedAt", "SortOrder": "asc"|"desc" }`

**Response:** `{ "Items": [AssetCategoryRead], "Total": integer }`; `FileCount` counts non-deleted files whose extension matches the category.

**Docstring:**

```text
List asset categories with search, built-in filtering and paging.
```

#### 25. `POST` `/api/v1/file_explorer/categories/create`

- **Handler:** `categories_create` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1752
- **Defined path:** `/categories/create`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `201 Created`
- **Response model:** `AssetCategoryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryCreatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.create'))` | `dependency` | {'arg': "_guard('system.file_explorer.create')"} |

**Payload:** `{ "Name": string (1-80, required), "Extensions": [string] (min 1, required), "IsPrivate": boolean=false, "Icon": string|null, "SortOrder": integer|null }`

**Docstring:**

```text
Create a category; names and extension ownership are unique.
```

#### 26. `POST` `/api/v1/file_explorer/categories/update`

- **Handler:** `categories_update` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1786
- **Defined path:** `/categories/update`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `AssetCategoryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryUpdatePayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.update'))` | `dependency` | {'arg': "_guard('system.file_explorer.update')"} |

**Payload:** `{ "Id": integer (required), "Name": string|null, "Extensions": [string]|null, "IsPrivate": boolean|null, "Icon": string|null, "SortOrder": integer|null }`. Omitted fields keep their current values; supplying `Extensions` replaces the whole list; `Icon: null` clears the icon.

**Docstring:**

```text
Update a category. Omitted fields keep their current values.
```

#### 27. `GET` `/api/v1/file_explorer/categories/delete`

- **Handler:** `categories_delete` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1823
- **Defined path:** `/categories/delete`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `id_` | `Optional[str]` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `ids` | `Optional[str]` | `Query(None, alias='Ids')` | `query` | {'arg': 'None', 'alias': "'Ids'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.delete'))` | `dependency` | {'arg': "_guard('system.file_explorer.delete')"} |

**Usage examples:** `GET /api/v1/file_explorer/categories/delete?Id=6`, `GET /api/v1/file_explorer/categories/delete?Ids=6,7` (or the same keys as a JSON body).

**Rules:** all-or-nothing validation; missing `Id`/`Ids` → `400`; unknown id → `404`; built-in category → `409`. Files are never deleted, only the category mapping.

**Docstring:**

```text
GET /categories/delete?Id=6 or ?Ids=6,7 (or the same keys as JSON).
```

#### 28. `POST` `/api/v1/file_explorer/categories/reorder`

- **Handler:** `categories_reorder` (async)
- **Source:** `app/api/v1/endpoints/file_explorer.py`:1849
- **Defined path:** `/categories/reorder`
- **Router:** object=`router` prefix=`/file_explorer` resolved_base=`/api/v1/file_explorer`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['File Explorer']`
- **Status code:** `200 OK`
- **Response model:** `AssetCategoryListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CategoryReorderPayload` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(_guard('system.file_explorer.update'))` | `dependency` | {'arg': "_guard('system.file_explorer.update')"} |

**Payload:** `{ "Items": [{ "Id": integer, "SortOrder": integer }] }` (min 1 item). Duplicate ids → `400`; unknown ids → `404`; one transaction, then the full updated list is returned.

**Docstring:**

```text
Atomically apply new SortOrder values and return the updated list.
```

### Asset category schemas

| Schema | Fields |
|---|---|
| `CategoryListPayload` | `Search: string\|null`, `IncludeBuiltin: bool=true`, `Page: int=1`, `PageSize: int=100` (max 500), `SortBy: str="SortOrder"`, `SortOrder: str="asc"` |
| `CategoryCreatePayload` | `Name: str` (1-80, required), `Extensions: list[str]` (min 1, required), `IsPrivate: bool=false`, `Icon: str\|null`, `SortOrder: int\|null` |
| `CategoryUpdatePayload` | `Id: int` (required), `Name/Extensions/IsPrivate/Icon/SortOrder` all optional |
| `CategoryOrderItem` | `Id: int`, `SortOrder: int` |
| `CategoryReorderPayload` | `Items: list[CategoryOrderItem]` (min 1) |
| `AssetCategoryRead` | `Id`, `Name`, `Slug`, `Extensions`, `IsPrivate`, `Icon`, `SortOrder`, `IsBuiltin`, `FileCount`, `CreatedAt`, `UpdatedAt` |
| `AssetCategoryListResponse` | `Items: list[AssetCategoryRead]`, `Total: int` |
| `MessageResponse` | `Message: str`, `Success: bool=true` |

**Persistence:** `EXPLORER_CATEGORIES` (created by `explorer_store.ensure_tables` alongside `EXPLORER_FOLDERS` / `EXPLORER_FILES`), seeded with six built-in categories (Images, Videos, Audio, Documents, Archives, PDFs) on first use. Extensions are normalised to lowercase, dot-free `^[a-z0-9]{1,20}$` values and are owned by exactly one category.

---

## Dashboard API

- **Source files:** `app/api/v1/endpoints/dashboard.py`, `app/websockets/dashboard.py`
- **Endpoints:** 4
- **Mount/status:** mounted (/api/v1 router) (3); mounted in main.py (1)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/dashboard/activity` | `dashboard_activity` | Dashboard audit-log feed (paginated) | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/dashboard/summary` | `dashboard_summary` | Dashboard snapshot (user/session/content stats + recent users) | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/dashboard/users` | `dashboard_users` | Dashboard user list (paginated, searchable, online flag) | mounted (/api/v1 router) |
| 4 | `WEBSOCKET` | `/ws/dashboard` | `dashboard_endpoint` |  | mounted in main.py |

### Endpoint details

#### 1. `GET` `/api/v1/dashboard/activity`

- **Handler:** `dashboard_activity` (async)
- **Source:** `app/api/v1/endpoints/dashboard.py`:109
- **Defined path:** `/activity`
- **Router:** object=`router` prefix=`/dashboard` resolved_base=`/api/v1/dashboard`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Dashboard']`
- **Summary:** Dashboard audit-log feed (paginated)
- **Response model:** `PaginatedResponse[DashboardActivityItem]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `GET` `/api/v1/dashboard/summary`

- **Handler:** `dashboard_summary` (async)
- **Source:** `app/api/v1/endpoints/dashboard.py`:64
- **Defined path:** `/summary`
- **Router:** object=`router` prefix=`/dashboard` resolved_base=`/api/v1/dashboard`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Dashboard']`
- **Summary:** Dashboard snapshot (user/session/content stats + recent users)
- **Response model:** `DashboardStats`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `GET` `/api/v1/dashboard/users`

- **Handler:** `dashboard_users` (async)
- **Source:** `app/api/v1/endpoints/dashboard.py`:77
- **Defined path:** `/users`
- **Router:** object=`router` prefix=`/dashboard` resolved_base=`/api/v1/dashboard`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Dashboard']`
- **Summary:** Dashboard user list (paginated, searchable, online flag)
- **Response model:** `PaginatedResponse[DashboardUserItem]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `q` | `Optional[str]` | `Query(None, max_length=100, description='Code/email/username/phone/name')` | `query` | {'arg': 'None', 'max_length': '100', 'description': "'Code/email/username/phone/name'"} |
| `active` | `Optional[bool]` | `Query(None, description='Filter by IS_ACTIVE')` | `query` | {'arg': 'None', 'description': "'Filter by IS_ACTIVE'"} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `WEBSOCKET` `/ws/dashboard`

- **Handler:** `dashboard_endpoint` (async)
- **Source:** `app/websockets/dashboard.py`:93
- **Defined path:** `/ws/dashboard`
- **Router:** object=`dashboard_router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py
- **Tags:** `['WebSockets']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `websocket` | `WebSocket` | `` | `websocket` |  |

**Docstring:**

```text
Live dashboard feed (superuser or ``ADMIN`` / ``SUPER_ADMIN`` role).

Development:
    ws://localhost:58721/ws/dashboard?token=<access_token>
Production:
    wss://api.example.com/ws/dashboard   (Sec-WebSocket-Protocol: token.<JWT>)
```

---

## RBAC (Roles & Permissions)

- **Source files:** `app/api/v1/endpoints/rbac.py`
- **Endpoints:** 29
- **Mount/status:** mounted (/api/v1 router) (29)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/rbac/databases` | `list_databases_get` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/rbac/databases` | `list_databases_post` |  | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/rbac/manifest` | `get_manifest` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/rbac/manifest` | `get_manifest` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/rbac/me` | `my_context` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/rbac/me` | `my_context` |  | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/rbac/permissions/list` | `list_permissions_get` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/rbac/permissions/list` | `list_permissions_post` |  | mounted (/api/v1 router) |
| 9 | `GET` | `/api/v1/rbac/permissions/matrix` | `permission_matrix` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/rbac/permissions/matrix` | `permission_matrix` |  | mounted (/api/v1 router) |
| 11 | `GET` | `/api/v1/rbac/permissions/users` | `list_user_permissions_get` |  | mounted (/api/v1 router) |
| 12 | `POST` | `/api/v1/rbac/permissions/users/list` | `list_user_permissions_datatable` |  | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/rbac/roles/assign` | `assign_role` |  | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/rbac/roles/create` | `create_role` |  | mounted (/api/v1 router) |
| 15 | `GET` | `/api/v1/rbac/roles/delete` | `delete_role` |  | mounted (/api/v1 router) |
| 16 | `POST` | `/api/v1/rbac/roles/get` | `get_role` |  | mounted (/api/v1 router) |
| 17 | `POST` | `/api/v1/rbac/roles/list` | `list_roles` |  | mounted (/api/v1 router) |
| 18 | `POST` | `/api/v1/rbac/roles/permissions` | `bulk_permissions` |  | mounted (/api/v1 router) |
| 19 | `POST` | `/api/v1/rbac/roles/read` | `get_role` |  | mounted (/api/v1 router) |
| 20 | `POST` | `/api/v1/rbac/roles/save` | `update_role` |  | mounted (/api/v1 router) |
| 21 | `POST` | `/api/v1/rbac/roles/update` | `update_role` |  | mounted (/api/v1 router) |
| 22 | `POST` | `/api/v1/rbac/sync` | `sync_manifest` |  | mounted (/api/v1 router) |
| 23 | `GET` | `/api/v1/rbac/sync-state` | `get_sync_state` |  | mounted (/api/v1 router) |
| 24 | `POST` | `/api/v1/rbac/sync-state` | `get_sync_state` |  | mounted (/api/v1 router) |
| 25 | `POST` | `/api/v1/rbac/user_roles/assign` | `assign_user_roles` |  | mounted (/api/v1 router) |
| 26 | `POST` | `/api/v1/rbac/users/permissions/get` | `get_user_permissions` |  | mounted (/api/v1 router) |
| 27 | `POST` | `/api/v1/rbac/users/permissions/list` | `list_user_permissions_datatable` |  | mounted (/api/v1 router) |
| 28 | `POST` | `/api/v1/rbac/users/roles/assign` | `assign_user_roles` |  | mounted (/api/v1 router) |
| 29 | `POST` | `/api/v1/rbac/users/roles/get` | `get_user_permissions` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/rbac/databases`

- **Handler:** `list_databases_get` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:87
- **Defined path:** `/databases`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `DatabaseList`

**Parameters:** none declared in signature (or not detected).

**Docstring:**

```text
Databases (GET compat).
```

#### 2. `POST` `/api/v1/rbac/databases`

- **Handler:** `list_databases_post` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:81
- **Defined path:** `/databases`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `DatabaseList`

**Parameters:** none declared in signature (or not detected).

**Docstring:**

```text
Databases selectable via ``rty_database`` / routing headers (POST list).
```

#### 3. `GET` `/api/v1/rbac/manifest`

- **Handler:** `get_manifest` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:63
- **Defined path:** `/manifest`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `ManifestResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `_` | `CurrentUser` | `Depends(require_permission('cms.pages.list'))` | `dependency` | {'arg': "require_permission('cms.pages.list')"} |

**Docstring:**

```text
RBAC manifest (frontend bootstrap).
```

#### 4. `POST` `/api/v1/rbac/manifest`

- **Handler:** `get_manifest` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:63
- **Defined path:** `/manifest`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `ManifestResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `_` | `CurrentUser` | `Depends(require_permission('cms.pages.list'))` | `dependency` | {'arg': "require_permission('cms.pages.list')"} |

**Docstring:**

```text
RBAC manifest (frontend bootstrap).
```

#### 5. `GET` `/api/v1/rbac/me`

- **Handler:** `my_context` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:50
- **Defined path:** `/me`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `UserContext`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Signed-in user's roles, permissions, resource registry and databases.
```

#### 6. `POST` `/api/v1/rbac/me`

- **Handler:** `my_context` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:50
- **Defined path:** `/me`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `UserContext`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Signed-in user's roles, permissions, resource registry and databases.
```

#### 7. `GET` `/api/v1/rbac/permissions/list`

- **Handler:** `list_permissions_get` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:228
- **Defined path:** `/permissions/list`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Search` | `str \| None` | `Query(default=None)` | `query` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.permissions.list'))` | `dependency` | {'arg': "require_permission('admin.permissions.list')"} |

**Docstring:**

```text
Permissions list (GET compat: Items/Total shape).
```

#### 8. `POST` `/api/v1/rbac/permissions/list`

- **Handler:** `list_permissions_post` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:218
- **Defined path:** `/permissions/list`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `PermissionListRequest \| None` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.permissions.list'))` | `dependency` | {'arg': "require_permission('admin.permissions.list')"} |

**Docstring:**

```text
Datatable list of permission codes (each item includes TotalRecord).
```

#### 9. `GET` `/api/v1/rbac/permissions/matrix`

- **Handler:** `permission_matrix` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:240
- **Defined path:** `/permissions/matrix`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `PermissionMatrix`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.permissions.read', '\|', 'admin.permissions.list'))` | `dependency` | {'arg': "require_permission('admin.permissions.read', '\|', 'admin.permissions.list')"} |

**Docstring:**

```text
Role x resource grant matrix.
```

#### 10. `POST` `/api/v1/rbac/permissions/matrix`

- **Handler:** `permission_matrix` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:240
- **Defined path:** `/permissions/matrix`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `PermissionMatrix`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.permissions.read', '\|', 'admin.permissions.list'))` | `dependency` | {'arg': "require_permission('admin.permissions.read', '\|', 'admin.permissions.list')"} |

**Docstring:**

```text
Role x resource grant matrix.
```

#### 11. `GET` `/api/v1/rbac/permissions/users`

- **Handler:** `list_user_permissions_get` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:260
- **Defined path:** `/permissions/users`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Search` | `str \| None` | `Query(default=None)` | `query` | {'default': 'None'} |
| `Role` | `str \| None` | `Query(default=None)` | `query` | {'default': 'None'} |
| `Limit` | `int` | `Query(default=100, ge=1, le=500)` | `query` | {'default': '100', 'ge': '1', 'le': '500'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.users.read'))` | `dependency` | {'arg': "require_permission('admin.users.read')"} |

**Docstring:**

```text
User permission rows (GET compat: Items/Total).
```

#### 12. `POST` `/api/v1/rbac/permissions/users/list`

- **Handler:** `list_user_permissions_datatable` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:250
- **Defined path:** `/permissions/users/list`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserPermissionRowsRequest \| None` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.users.read', '\|', 'admin.roles.list'))` | `dependency` | {'arg': "require_permission('admin.users.read', '\|', 'admin.roles.list')"} |

**Docstring:**

```text
Datatable of users with effective roles/permissions (each item includes TotalRecord).
```

#### 13. `POST` `/api/v1/rbac/roles/assign`

- **Handler:** `assign_role` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:181
- **Defined path:** `/roles/assign`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RoleAssignRequest \| UserRolesAssignRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('admin.roles.assign'))` | `dependency` | {'arg': "require_permission('admin.roles.assign')"} |

**Docstring:**

```text
Assign or revoke a role for user(s).
```

#### 14. `POST` `/api/v1/rbac/roles/create`

- **Handler:** `create_role` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:116
- **Defined path:** `/roles/create`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RoleCreateRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('admin.roles.update', '\|', 'admin.roles.create'))` | `dependency` | {'arg': "require_permission('admin.roles.update', '\|', 'admin.roles.create')"} |

**Docstring:**

```text
Create a role.
```

#### 15. `GET` `/api/v1/rbac/roles/delete`

- **Handler:** `delete_role` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:167
- **Defined path:** `/roles/delete`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Code` | `str \| None` | `Query(default=None)` | `query` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.roles.update', '\|', 'admin.roles.delete'))` | `dependency` | {'arg': "require_permission('admin.roles.update', '\|', 'admin.roles.delete')"} |

**Docstring:**

```text
Delete a role (GET, ?Code=ROLE_CODE).
```

#### 16. `POST` `/api/v1/rbac/roles/get`

- **Handler:** `get_role` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:106
- **Defined path:** `/roles/get`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RoleGetRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.roles.list', '\|', 'admin.roles.read'))` | `dependency` | {'arg': "require_permission('admin.roles.list', '\|', 'admin.roles.read')"} |

**Docstring:**

```text
Get one role with grants by Code.
```

#### 17. `POST` `/api/v1/rbac/roles/list`

- **Handler:** `list_roles` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:95
- **Defined path:** `/roles/list`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RoleListRequest \| None` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.roles.list'))` | `dependency` | {'arg': "require_permission('admin.roles.list')"} |

**Docstring:**

```text
Datatable list of roles (each item includes TotalRecord).
```

#### 18. `POST` `/api/v1/rbac/roles/permissions`

- **Handler:** `bulk_permissions` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:202
- **Defined path:** `/roles/permissions`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `BulkPermissionRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.permissions.update', '\|', 'admin.permissions.assign'))` | `dependency` | {'arg': "require_permission('admin.permissions.update', '\|', 'admin.permissions.assign')"} |

**Docstring:**

```text
Grant, revoke, or replace a role's permission grants.
```

#### 19. `POST` `/api/v1/rbac/roles/read`

- **Handler:** `get_role` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:106
- **Defined path:** `/roles/read`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RoleGetRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.roles.list', '\|', 'admin.roles.read'))` | `dependency` | {'arg': "require_permission('admin.roles.list', '\|', 'admin.roles.read')"} |

**Docstring:**

```text
Get one role with grants by Code.
```

#### 20. `POST` `/api/v1/rbac/roles/save`

- **Handler:** `update_role` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:142
- **Defined path:** `/roles/save`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RoleUpdateRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('admin.roles.update', '\|', 'admin.roles.create'))` | `dependency` | {'arg': "require_permission('admin.roles.update', '\|', 'admin.roles.create')"} |

**Docstring:**

```text
Update a role.
```

#### 21. `POST` `/api/v1/rbac/roles/update`

- **Handler:** `update_role` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:142
- **Defined path:** `/roles/update`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RoleUpdateRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('admin.roles.update', '\|', 'admin.roles.create'))` | `dependency` | {'arg': "require_permission('admin.roles.update', '\|', 'admin.roles.create')"} |

**Docstring:**

```text
Update a role.
```

#### 22. `POST` `/api/v1/rbac/sync`

- **Handler:** `sync_manifest` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:320
- **Defined path:** `/sync`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `SyncResult`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `SyncActionRequest \| None` | `Body(default=None)` | `body` | {'default': 'None'} |
| `force` | `bool` | `Query(default=False, description='Re-apply even when hash matches')` | `query` | {'default': 'False', 'description': "'Re-apply even when hash matches'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_super_admin)` | `dependency` | {'arg': 'require_super_admin'} |

**Docstring:**

```text
Reconcile RBAC manifest with database (super-admin only).
```

#### 23. `GET` `/api/v1/rbac/sync-state`

- **Handler:** `get_sync_state` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:72
- **Defined path:** `/sync-state`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `SyncState`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.roles.list'))` | `dependency` | {'arg': "require_permission('admin.roles.list')"} |

**Docstring:**

```text
Manifest sync state and drift.
```

#### 24. `POST` `/api/v1/rbac/sync-state`

- **Handler:** `get_sync_state` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:72
- **Defined path:** `/sync-state`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `SyncState`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.roles.list'))` | `dependency` | {'arg': "require_permission('admin.roles.list')"} |

**Docstring:**

```text
Manifest sync state and drift.
```

#### 25. `POST` `/api/v1/rbac/user_roles/assign`

- **Handler:** `assign_user_roles` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:299
- **Defined path:** `/user_roles/assign`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserRolesAssignRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('admin.roles.assign'))` | `dependency` | {'arg': "require_permission('admin.roles.assign')"} |

**Docstring:**

```text
Assign or revoke a role for one or many users (master user-role mapping).
```

#### 26. `POST` `/api/v1/rbac/users/permissions/get`

- **Handler:** `get_user_permissions` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:276
- **Defined path:** `/users/permissions/get`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `dict[str, Any]` | `Body(default_factory=dict)` | `body` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.users.read', '\|', 'admin.roles.list'))` | `dependency` | {'arg': "require_permission('admin.users.read', '\|', 'admin.roles.list')"} |

**Docstring:**

```text
Get effective roles/permissions for a specific user (UserId in payload).
```

#### 27. `POST` `/api/v1/rbac/users/permissions/list`

- **Handler:** `list_user_permissions_datatable` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:250
- **Defined path:** `/users/permissions/list`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserPermissionRowsRequest \| None` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.users.read', '\|', 'admin.roles.list'))` | `dependency` | {'arg': "require_permission('admin.users.read', '\|', 'admin.roles.list')"} |

**Docstring:**

```text
Datatable of users with effective roles/permissions (each item includes TotalRecord).
```

#### 28. `POST` `/api/v1/rbac/users/roles/assign`

- **Handler:** `assign_user_roles` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:299
- **Defined path:** `/users/roles/assign`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserRolesAssignRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('admin.roles.assign'))` | `dependency` | {'arg': "require_permission('admin.roles.assign')"} |

**Docstring:**

```text
Assign or revoke a role for one or many users (master user-role mapping).
```

#### 29. `POST` `/api/v1/rbac/users/roles/get`

- **Handler:** `get_user_permissions` (async)
- **Source:** `app/api/v1/endpoints/rbac.py`:276
- **Defined path:** `/users/roles/get`
- **Router:** object=`router` prefix=`/rbac` resolved_base=`/api/v1/rbac`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['RBAC']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `dict[str, Any]` | `Body(default_factory=dict)` | `body` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `_` | `CurrentUser` | `Depends(require_permission('admin.users.read', '\|', 'admin.roles.list'))` | `dependency` | {'arg': "require_permission('admin.users.read', '\|', 'admin.roles.list')"} |

**Docstring:**

```text
Get effective roles/permissions for a specific user (UserId in payload).
```

---

## Employee & Signature

- **Source files:** `app/api/v1/endpoints/employee.py`
- **Endpoints:** 5
- **Mount/status:** mounted (/api/v1 router) (5)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/employee/add_file_signature` | `add_signature` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/employee/delete_signature` | `delete_signature` |  | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/employee/detail` | `employee_detail` |  | mounted (/api/v1 router) |
| 4 | `GET` | `/api/v1/employee/get_signature` | `get_signatures` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/employee/upload_signature` | `upload_signature` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/employee/add_file_signature`

- **Handler:** `add_signature` (async)
- **Source:** `app/api/v1/endpoints/employee.py`:129
- **Defined path:** `/add_file_signature`
- **Router:** object=`router` prefix=`/employee` resolved_base=`/api/v1/employee`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Employee']`
- **Response model:** `SignatureRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `SignatureAdd` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 2. `GET` `/api/v1/employee/delete_signature`

- **Handler:** `delete_signature` (async)
- **Source:** `app/api/v1/endpoints/employee.py`:227
- **Defined path:** `/delete_signature`
- **Router:** object=`router` prefix=`/employee` resolved_base=`/api/v1/employee`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Employee']`
- **Response model:** `StatusResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `signature_id` | `Optional[int]` | `Query(None, alias='SignatureId')` | `query` | {'arg': 'None', 'alias': "'SignatureId'"} |
| `employee_id` | `Optional[int]` | `Query(None, alias='EmployeeId')` | `query` | {'arg': 'None', 'alias': "'EmployeeId'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 3. `GET` `/api/v1/employee/detail`

- **Handler:** `employee_detail` (async)
- **Source:** `app/api/v1/endpoints/employee.py`:89
- **Defined path:** `/detail`
- **Router:** object=`router` prefix=`/employee` resolved_base=`/api/v1/employee`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Employee']`
- **Response model:** `Optional[EmployeeRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `employee_id` | `Optional[int]` | `Query(None, alias='EmployeeId')` | `query` | {'arg': 'None', 'alias': "'EmployeeId'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 4. `GET` `/api/v1/employee/get_signature`

- **Handler:** `get_signatures` (async)
- **Source:** `app/api/v1/endpoints/employee.py`:107
- **Defined path:** `/get_signature`
- **Router:** object=`router` prefix=`/employee` resolved_base=`/api/v1/employee`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Employee']`
- **Response model:** `list[SignatureRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `employee_id` | `Optional[int]` | `Query(None, alias='EmployeeId')` | `query` | {'arg': 'None', 'alias': "'EmployeeId'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 5. `POST` `/api/v1/employee/upload_signature`

- **Handler:** `upload_signature` (async)
- **Source:** `app/api/v1/endpoints/employee.py`:158
- **Defined path:** `/upload_signature`
- **Router:** object=`router` prefix=`/employee` resolved_base=`/api/v1/employee`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Employee']`
- **Response model:** `SignatureRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `employee_id` | `Optional[int]` | `Form(None, alias='EmployeeId')` | `form` | {'arg': 'None', 'alias': "'EmployeeId'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## User Management

- **Source files:** `app/api/v1/endpoints/users.py`
- **Endpoints:** 10
- **Mount/status:** mounted (/api/v1 router) (10)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/users/address/delete` | `delete_user_address` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/users/address/save` | `save_user_address` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/users/address/setDefault` | `set_user_address_default` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/users/create` | `create_user` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/users/detail` | `get_user_detail` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/users/list` | `get_users` | Get all users | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/users/profile` | `get_user_profile` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/users/profile/update` | `update_user_profile` |  | mounted (/api/v1 router) |
| 9 | `GET` | `/api/v1/users/remove` | `remove_user_get` | Remove user with GET | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/users/update` | `update_user` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/users/address/delete`

- **Handler:** `delete_user_address` (async)
- **Source:** `app/api/v1/endpoints/users.py`:843
- **Defined path:** `/address/delete`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `` | `` |  |
| `body` | `UserAddressRef` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `POST` `/api/v1/users/address/save`

- **Handler:** `save_user_address` (async)
- **Source:** `app/api/v1/endpoints/users.py`:822
- **Defined path:** `/address/save`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Response model:** `UserAddressRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `` | `` |  |
| `body` | `UserAddressSave` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `POST` `/api/v1/users/address/setDefault`

- **Handler:** `set_user_address_default` (async)
- **Source:** `app/api/v1/endpoints/users.py`:861
- **Defined path:** `/address/setDefault`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Response model:** `UserAddressRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `` | `` |  |
| `body` | `UserAddressRef` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `POST` `/api/v1/users/create`

- **Handler:** `create_user` (async)
- **Source:** `app/api/v1/endpoints/users.py`:117
- **Defined path:** `/create`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `svc` | `UserService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 5. `POST` `/api/v1/users/detail`

- **Handler:** `get_user_detail` (async)
- **Source:** `app/api/v1/endpoints/users.py`:646
- **Defined path:** `/detail`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `UserDetailRequest` | `` | `` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db_async)` | `dependency` | {'arg': 'get_db_async'} |

#### 6. `POST` `/api/v1/users/list`

- **Handler:** `get_users` (async)
- **Source:** `app/api/v1/endpoints/users.py`:164
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users']`
- **Summary:** Get all users
- **Response model:** `list[UserListResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `ListRequest` | `` | `request` |  |
| `svc` | `UserService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 7. `POST` `/api/v1/users/profile`

- **Handler:** `get_user_profile` (async)
- **Source:** `app/api/v1/endpoints/users.py`:766
- **Defined path:** `/profile`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Response model:** `ProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `` | `` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 8. `POST` `/api/v1/users/profile/update`

- **Handler:** `update_user_profile` (async)
- **Source:** `app/api/v1/endpoints/users.py`:775
- **Defined path:** `/profile/update`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Response model:** `ProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `` | `` |  |
| `body` | `ProfileUpdate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 9. `GET` `/api/v1/users/remove`

- **Handler:** `remove_user_get` (async)
- **Source:** `app/api/v1/endpoints/users.py`:727
- **Defined path:** `/remove`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Summary:** Remove user with GET
- **Status code:** `status.HTTP_200_OK`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `Id` | `int \| None` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `svc` | `UserService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 10. `POST` `/api/v1/users/update`

- **Handler:** `update_user` (async)
- **Source:** `app/api/v1/endpoints/users.py`:683
- **Defined path:** `/update`
- **Router:** object=`router` prefix=`/users` resolved_base=`/api/v1/users`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Users CRUD operations']`
- **Response model:** `UserRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `` | `` |  |
| `body` | `UserUpdate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `UserService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

---

## Address / Localization

- **Source files:** `app/api/v1/endpoints/address.py`
- **Endpoints:** 12
- **Mount/status:** mounted (/api/v1 router) (12)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/address/communes` | `communes_get` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/address/communes` | `communes_post` |  | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/address/countries` | `countries_get` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/address/countries` | `countries_post` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/address/districts` | `districts_get` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/address/districts` | `districts_post` |  | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/address/provinces` | `provinces_get` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/address/provinces` | `provinces_post` |  | mounted (/api/v1 router) |
| 9 | `GET` | `/api/v1/address/search` | `search_address` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/address/summary` | `address_summary` |  | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/address/sync` | `sync_address` |  | mounted (/api/v1 router) |
| 12 | `POST` | `/api/v1/address/villages` | `villages_post` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/address/communes`

- **Handler:** `communes_get` (async)
- **Source:** `app/api/v1/endpoints/address.py`:717
- **Defined path:** `/communes`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `CommuneMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Action` | `str` | `Query(default='delete', description="Only 'delete' is supported")` | `query` | {'default': "'delete'", 'description': '"Only \'delete\' is supported"'} |
| `Id` | `Optional[int]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `Code` | `Optional[str]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `body` | `Optional[CountryDeleteRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete a commune, transported over GET (query params or body payload).
```

#### 2. `POST` `/api/v1/address/communes`

- **Handler:** `communes_post` (async)
- **Source:** `app/api/v1/endpoints/address.py`:686
- **Defined path:** `/communes`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `list[CommuneRead] | CommuneMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `Optional[CommuneRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `Optional[CurrentUser]` | `Depends(get_current_user_optional)` | `dependency` | {'arg': 'get_current_user_optional'} |

**Docstring:**

```text
Commune catalogue CRUD; ``Action`` (default ``list``) selects the op.
```

#### 3. `GET` `/api/v1/address/countries`

- **Handler:** `countries_get` (async)
- **Source:** `app/api/v1/endpoints/address.py`:286
- **Defined path:** `/countries`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `CountryMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Action` | `str` | `Query(default='delete', description="Only 'delete' is supported")` | `query` | {'default': "'delete'", 'description': '"Only \'delete\' is supported"'} |
| `Id` | `Optional[int]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `Code` | `Optional[str]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `body` | `Optional[CountryDeleteRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete a country, transported over GET (query params or body payload).
```

#### 4. `POST` `/api/v1/address/countries`

- **Handler:** `countries_post` (async)
- **Source:** `app/api/v1/endpoints/address.py`:248
- **Defined path:** `/countries`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `list[CountryRead] | CountryMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `Optional[CountryRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `Optional[CurrentUser]` | `Depends(get_current_user_optional)` | `dependency` | {'arg': 'get_current_user_optional'} |

**Docstring:**

```text
Country catalogue CRUD; ``Action`` (default ``list``) selects the op.
```

#### 5. `GET` `/api/v1/address/districts`

- **Handler:** `districts_get` (async)
- **Source:** `app/api/v1/endpoints/address.py`:573
- **Defined path:** `/districts`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `DistrictMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Action` | `str` | `Query(default='delete', description="Only 'delete' is supported")` | `query` | {'default': "'delete'", 'description': '"Only \'delete\' is supported"'} |
| `Id` | `Optional[int]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `Code` | `Optional[str]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `body` | `Optional[CountryDeleteRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete a district, transported over GET (query params or body payload).
```

#### 6. `POST` `/api/v1/address/districts`

- **Handler:** `districts_post` (async)
- **Source:** `app/api/v1/endpoints/address.py`:543
- **Defined path:** `/districts`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `list[DistrictRead] | DistrictMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `Optional[DistrictRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `Optional[CurrentUser]` | `Depends(get_current_user_optional)` | `dependency` | {'arg': 'get_current_user_optional'} |

**Docstring:**

```text
District catalogue CRUD; ``Action`` (default ``list``) selects the op.
```

#### 7. `GET` `/api/v1/address/provinces`

- **Handler:** `provinces_get` (async)
- **Source:** `app/api/v1/endpoints/address.py`:430
- **Defined path:** `/provinces`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `ProvinceMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Action` | `str` | `Query(default='delete', description="Only 'delete' is supported")` | `query` | {'default': "'delete'", 'description': '"Only \'delete\' is supported"'} |
| `Id` | `Optional[int]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `Code` | `Optional[str]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `body` | `Optional[CountryDeleteRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete a province, transported over GET (query params or body payload).
```

#### 8. `POST` `/api/v1/address/provinces`

- **Handler:** `provinces_post` (async)
- **Source:** `app/api/v1/endpoints/address.py`:399
- **Defined path:** `/provinces`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `list[ProvinceRead] | ProvinceMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `Optional[ProvinceRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `Optional[CurrentUser]` | `Depends(get_current_user_optional)` | `dependency` | {'arg': 'get_current_user_optional'} |

**Docstring:**

```text
Province catalogue CRUD; ``Action`` (default ``list``) selects the op.
```

#### 9. `GET` `/api/v1/address/search`

- **Handler:** `search_address` (async)
- **Source:** `app/api/v1/endpoints/address.py`:869
- **Defined path:** `/search`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `list[AddressSearchItem]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `level` | `Literal['province', 'district', 'commune', 'village']` | `Query('village', alias='Level')` | `query` | {'arg': "'village'", 'alias': "'Level'"} |
| `q` | `str` | `Query('', alias='Q', min_length=0, max_length=100)` | `query` | {'arg': "''", 'alias': "'Q'", 'min_length': '0', 'max_length': '100'} |
| `province_id` | `Optional[int]` | `Query(None, alias='ProvinceId')` | `query` | {'arg': 'None', 'alias': "'ProvinceId'"} |
| `district_id` | `Optional[int]` | `Query(None, alias='DistrictId')` | `query` | {'arg': 'None', 'alias': "'DistrictId'"} |
| `commune_id` | `Optional[int]` | `Query(None, alias='CommuneId')` | `query` | {'arg': 'None', 'alias': "'CommuneId'"} |
| `limit` | `int` | `Query(50, alias='Limit', ge=1, le=200)` | `query` | {'arg': '50', 'alias': "'Limit'", 'ge': '1', 'le': '200'} |

#### 10. `POST` `/api/v1/address/summary`

- **Handler:** `address_summary` (async)
- **Source:** `app/api/v1/endpoints/address.py`:956
- **Defined path:** `/summary`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `AddressSummary`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `CountryCode` | `Optional[str]` | `Query(default=None, description='ISO 3166-1 alpha-2 country code(s), comma separated (e.g. ``KH,LA``). Defaults to every country.')` | `query` | {'default': 'None', 'description': "'ISO 3166-1 alpha-2 country code(s), comma separated (e.g. ``KH,LA``). Defaults to every country.'"} |

**Docstring:**

```text
Row counts for countries/provinces/districts/communes/villages.

Without ``CountryCode`` the counts span the whole catalogue; with it only the
countries matching the given code(s) (case-insensitive) are counted, the
administrative levels being reached through their parent chain
(province -> district -> commune -> village).
```

#### 11. `POST` `/api/v1/address/sync`

- **Handler:** `sync_address` (async)
- **Source:** `app/api/v1/endpoints/address.py`:1046
- **Defined path:** `/sync`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `AddressSyncResult`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `AddressSyncRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 12. `POST` `/api/v1/address/villages`

- **Handler:** `villages_post` (async)
- **Source:** `app/api/v1/endpoints/address.py`:830
- **Defined path:** `/villages`
- **Router:** object=`router` prefix=`/address` resolved_base=`/api/v1/address`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Address']`
- **Response model:** `list[VillageRead] | VillageMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `Optional[VillageRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `Optional[CurrentUser]` | `Depends(get_current_user_optional)` | `dependency` | {'arg': 'get_current_user_optional'} |

**Docstring:**

```text
Village catalogue CRUD; ``Action`` (default ``list``) selects the op.
```

---

## AI Chat

- **Source files:** `app/api/v1/endpoints/ai_chat.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/ai_chat/completions` | `create_chat_completion` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/ai_chat/completions`

- **Handler:** `create_chat_completion` (async)
- **Source:** `app/api/v1/endpoints/ai_chat.py`:27
- **Defined path:** `/completions`
- **Router:** object=`router` prefix=`/ai_chat` resolved_base=`/api/v1/ai_chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['API Chat']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ChatCompletionRequest` | `` | `` |  |

---

## Artists

- **Source files:** `app/api/v1/endpoints/artists.py`
- **Endpoints:** 11
- **Mount/status:** mounted (/api/v1 router) (11)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/artists` | `create_artist` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/artists/code/{code}` | `get_artist_by_code` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/artists/list` | `list_artists` |  | mounted (/api/v1 router) |
| 4 | `GET` | `/api/v1/artists/me` | `get_current_artist` |  | mounted (/api/v1 router) |
| 5 | `DELETE` | `/api/v1/artists/{artist_id}` | `delete_artist` |  | mounted (/api/v1 router) |
| 6 | `GET` | `/api/v1/artists/{artist_id}` | `get_artist` |  | mounted (/api/v1 router) |
| 7 | `PATCH` | `/api/v1/artists/{artist_id}` | `update_artist` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/artists/{artist_id}/social-links` | `create_social_link` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/artists/{artist_id}/social-links/list` | `list_social_links` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/artists/{artist_id}/verifications` | `create_verification` |  | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/artists/{artist_id}/verifications/list` | `list_verifications` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/artists`

- **Handler:** `create_artist` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:64
- **Defined path:** ``
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ArtistProfileCreate` | `` | `` |  |
| `svc` | `ArtistProfileService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 2. `GET` `/api/v1/artists/code/{code}`

- **Handler:** `get_artist_by_code` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:92
- **Defined path:** `/code/{code}`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `ArtistProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `code` | `str` | `` | `path` |  |
| `svc` | `ArtistProfileService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 3. `POST` `/api/v1/artists/list`

- **Handler:** `list_artists` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:40
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `PaginatedResponse[ArtistProfileRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ArtistListRequest` | `` | `` |  |
| `svc` | `ArtistProfileService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 4. `GET` `/api/v1/artists/me`

- **Handler:** `get_current_artist` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:81
- **Defined path:** `/me`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `ArtistProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `svc` | `ArtistProfileService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 5. `DELETE` `/api/v1/artists/{artist_id}`

- **Handler:** `delete_artist` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:125
- **Defined path:** `/{artist_id}`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `` | `path` |  |
| `svc` | `ArtistProfileService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 6. `GET` `/api/v1/artists/{artist_id}`

- **Handler:** `get_artist` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:100
- **Defined path:** `/{artist_id}`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `ArtistProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `` | `path` |  |
| `svc` | `ArtistProfileService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 7. `PATCH` `/api/v1/artists/{artist_id}`

- **Handler:** `update_artist` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:108
- **Defined path:** `/{artist_id}`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `ArtistProfileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `` | `path` |  |
| `body` | `ArtistProfileUpdate` | `` | `` |  |
| `svc` | `ArtistProfileService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 8. `POST` `/api/v1/artists/{artist_id}/social-links`

- **Handler:** `create_social_link` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:158
- **Defined path:** `/{artist_id}/social-links`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `` | `path` |  |
| `body` | `ArtistSocialLinkCreate` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 9. `POST` `/api/v1/artists/{artist_id}/social-links/list`

- **Handler:** `list_social_links` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:142
- **Defined path:** `/{artist_id}/social-links/list`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `PaginatedResponse[ArtistSocialLinkRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `` | `path` |  |
| `body` | `ListRequest` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `POST` `/api/v1/artists/{artist_id}/verifications`

- **Handler:** `create_verification` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:199
- **Defined path:** `/{artist_id}/verifications`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `` | `path` |  |
| `body` | `ArtistVerificationCreate` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 11. `POST` `/api/v1/artists/{artist_id}/verifications/list`

- **Handler:** `list_verifications` (async)
- **Source:** `app/api/v1/endpoints/artists.py`:175
- **Defined path:** `/{artist_id}/verifications/list`
- **Router:** object=`router` prefix=`/artists` resolved_base=`/api/v1/artists`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artists']`
- **Response model:** `PaginatedResponse[ArtistVerificationRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `` | `path` |  |
| `body` | `ArtistVerificationListRequest` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Artworks, Galleries & Collections

- **Source files:** `app/api/v1/endpoints/artworks.py`
- **Endpoints:** 24
- **Mount/status:** mounted (/api/v1 router) (24)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/artwork-collections` | `list_collections` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/artwork-collections` | `create_collection` |  | mounted (/api/v1 router) |
| 3 | `DELETE` | `/api/v1/artwork-collections/{col_id}` | `delete_collection` |  | mounted (/api/v1 router) |
| 4 | `GET` | `/api/v1/artwork-collections/{col_id}` | `get_collection` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/artwork-tags` | `list_artwork_tags` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/artwork-tags` | `create_artwork_tag` |  | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/artworks` | `list_artworks` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/artworks` | `create_artwork` |  | mounted (/api/v1 router) |
| 9 | `GET` | `/api/v1/artworks/featured` | `list_featured_artworks` |  | mounted (/api/v1 router) |
| 10 | `GET` | `/api/v1/artworks/slug/{slug}` | `get_artwork_by_slug` |  | mounted (/api/v1 router) |
| 11 | `DELETE` | `/api/v1/artworks/{artwork_id}` | `delete_artwork` |  | mounted (/api/v1 router) |
| 12 | `GET` | `/api/v1/artworks/{artwork_id}` | `get_artwork` |  | mounted (/api/v1 router) |
| 13 | `PATCH` | `/api/v1/artworks/{artwork_id}` | `update_artwork` |  | mounted (/api/v1 router) |
| 14 | `GET` | `/api/v1/galleries` | `list_galleries` |  | mounted (/api/v1 router) |
| 15 | `POST` | `/api/v1/galleries` | `create_gallery` |  | mounted (/api/v1 router) |
| 16 | `GET` | `/api/v1/galleries/slug/{slug}` | `get_gallery_by_slug` |  | mounted (/api/v1 router) |
| 17 | `DELETE` | `/api/v1/galleries/{gallery_id}` | `delete_gallery` |  | mounted (/api/v1 router) |
| 18 | `GET` | `/api/v1/galleries/{gallery_id}` | `get_gallery` |  | mounted (/api/v1 router) |
| 19 | `PATCH` | `/api/v1/galleries/{gallery_id}` | `update_gallery` |  | mounted (/api/v1 router) |
| 20 | `GET` | `/api/v1/galleries/{gallery_id}/albums` | `list_albums` |  | mounted (/api/v1 router) |
| 21 | `POST` | `/api/v1/galleries/{gallery_id}/albums` | `create_album` |  | mounted (/api/v1 router) |
| 22 | `GET` | `/api/v1/galleries/{gallery_id}/items` | `list_gallery_items` |  | mounted (/api/v1 router) |
| 23 | `POST` | `/api/v1/galleries/{gallery_id}/items` | `add_gallery_item` |  | mounted (/api/v1 router) |
| 24 | `DELETE` | `/api/v1/galleries/{gallery_id}/items/{item_id}` | `remove_gallery_item` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/artwork-collections`

- **Handler:** `list_collections` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:224
- **Defined path:** ``
- **Router:** object=`collection_router` prefix=`/artwork-collections` resolved_base=`/api/v1/artwork-collections`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artwork Collections']`
- **Response model:** `PaginatedResponse[ArtworkCollectionRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int` | `Query(..., alias='ArtistId')` | `query` | {'arg': '...', 'alias': "'ArtistId'"} |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `svc` | `ArtworkCollectionService` | `Depends(_col_svc)` | `dependency` | {'arg': '_col_svc'} |

#### 2. `POST` `/api/v1/artwork-collections`

- **Handler:** `create_collection` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:240
- **Defined path:** ``
- **Router:** object=`collection_router` prefix=`/artwork-collections` resolved_base=`/api/v1/artwork-collections`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artwork Collections']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ArtworkCollectionCreate` | `` | `` |  |
| `svc` | `ArtworkCollectionService` | `Depends(_col_svc)` | `dependency` | {'arg': '_col_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 3. `DELETE` `/api/v1/artwork-collections/{col_id}`

- **Handler:** `delete_collection` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:263
- **Defined path:** `/{col_id}`
- **Router:** object=`collection_router` prefix=`/artwork-collections` resolved_base=`/api/v1/artwork-collections`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artwork Collections']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `col_id` | `int` | `` | `path` |  |
| `svc` | `ArtworkCollectionService` | `Depends(_col_svc)` | `dependency` | {'arg': '_col_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 4. `GET` `/api/v1/artwork-collections/{col_id}`

- **Handler:** `get_collection` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:255
- **Defined path:** `/{col_id}`
- **Router:** object=`collection_router` prefix=`/artwork-collections` resolved_base=`/api/v1/artwork-collections`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artwork Collections']`
- **Response model:** `ArtworkCollectionRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `col_id` | `int` | `` | `path` |  |
| `svc` | `ArtworkCollectionService` | `Depends(_col_svc)` | `dependency` | {'arg': '_col_svc'} |

#### 5. `GET` `/api/v1/artwork-tags`

- **Handler:** `list_artwork_tags` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:188
- **Defined path:** ``
- **Router:** object=`tag_router` prefix=`/artwork-tags` resolved_base=`/api/v1/artwork-tags`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artwork Tags']`
- **Response model:** `PaginatedResponse[ArtworkTagRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(50, ge=1, le=200)` | `query` | {'arg': '50', 'ge': '1', 'le': '200'} |
| `svc` | `ArtworkTagService` | `Depends(_tag_svc)` | `dependency` | {'arg': '_tag_svc'} |

#### 6. `POST` `/api/v1/artwork-tags`

- **Handler:** `create_artwork_tag` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:204
- **Defined path:** ``
- **Router:** object=`tag_router` prefix=`/artwork-tags` resolved_base=`/api/v1/artwork-tags`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artwork Tags']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ArtworkTagCreate` | `` | `` |  |
| `svc` | `ArtworkTagService` | `Depends(_tag_svc)` | `dependency` | {'arg': '_tag_svc'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 7. `GET` `/api/v1/artworks`

- **Handler:** `list_artworks` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:71
- **Defined path:** ``
- **Router:** object=`router` prefix=`/artworks` resolved_base=`/api/v1/artworks`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artworks']`
- **Response model:** `PaginatedResponse[ArtworkRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `artist_id` | `int \| None` | `Query(None, alias='ArtistId')` | `query` | {'arg': 'None', 'alias': "'ArtistId'"} |
| `svc` | `ArtworkService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 8. `POST` `/api/v1/artworks`

- **Handler:** `create_artwork` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:95
- **Defined path:** ``
- **Router:** object=`router` prefix=`/artworks` resolved_base=`/api/v1/artworks`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artworks']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ArtworkCreate` | `` | `` |  |
| `svc` | `ArtworkService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 9. `GET` `/api/v1/artworks/featured`

- **Handler:** `list_featured_artworks` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:112
- **Defined path:** `/featured`
- **Router:** object=`router` prefix=`/artworks` resolved_base=`/api/v1/artworks`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artworks']`
- **Response model:** `PaginatedResponse[ArtworkRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `svc` | `ArtworkService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 10. `GET` `/api/v1/artworks/slug/{slug}`

- **Handler:** `get_artwork_by_slug` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:127
- **Defined path:** `/slug/{slug}`
- **Router:** object=`router` prefix=`/artworks` resolved_base=`/api/v1/artworks`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artworks']`
- **Response model:** `ArtworkRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `svc` | `ArtworkService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 11. `DELETE` `/api/v1/artworks/{artwork_id}`

- **Handler:** `delete_artwork` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:162
- **Defined path:** `/{artwork_id}`
- **Router:** object=`router` prefix=`/artworks` resolved_base=`/api/v1/artworks`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artworks']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artwork_id` | `int` | `` | `path` |  |
| `svc` | `ArtworkService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 12. `GET` `/api/v1/artworks/{artwork_id}`

- **Handler:** `get_artwork` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:135
- **Defined path:** `/{artwork_id}`
- **Router:** object=`router` prefix=`/artworks` resolved_base=`/api/v1/artworks`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artworks']`
- **Response model:** `ArtworkRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artwork_id` | `int` | `` | `path` |  |
| `svc` | `ArtworkService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 13. `PATCH` `/api/v1/artworks/{artwork_id}`

- **Handler:** `update_artwork` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:143
- **Defined path:** `/{artwork_id}`
- **Router:** object=`router` prefix=`/artworks` resolved_base=`/api/v1/artworks`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Artworks']`
- **Response model:** `ArtworkRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artwork_id` | `int` | `` | `path` |  |
| `body` | `ArtworkUpdate` | `` | `` |  |
| `svc` | `ArtworkService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 14. `GET` `/api/v1/galleries`

- **Handler:** `list_galleries` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:284
- **Defined path:** ``
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `PaginatedResponse[GalleryRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `artist_id` | `int \| None` | `Query(None, alias='ArtistId')` | `query` | {'arg': 'None', 'alias': "'ArtistId'"} |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `svc` | `GalleryService` | `Depends(_gal_svc)` | `dependency` | {'arg': '_gal_svc'} |

#### 15. `POST` `/api/v1/galleries`

- **Handler:** `create_gallery` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:304
- **Defined path:** ``
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `GalleryCreate` | `` | `` |  |
| `svc` | `GalleryService` | `Depends(_gal_svc)` | `dependency` | {'arg': '_gal_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 16. `GET` `/api/v1/galleries/slug/{slug}`

- **Handler:** `get_gallery_by_slug` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:321
- **Defined path:** `/slug/{slug}`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `GalleryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `svc` | `GalleryService` | `Depends(_gal_svc)` | `dependency` | {'arg': '_gal_svc'} |

#### 17. `DELETE` `/api/v1/galleries/{gallery_id}`

- **Handler:** `delete_gallery` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:351
- **Defined path:** `/{gallery_id}`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `svc` | `GalleryService` | `Depends(_gal_svc)` | `dependency` | {'arg': '_gal_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 18. `GET` `/api/v1/galleries/{gallery_id}`

- **Handler:** `get_gallery` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:329
- **Defined path:** `/{gallery_id}`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `GalleryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `svc` | `GalleryService` | `Depends(_gal_svc)` | `dependency` | {'arg': '_gal_svc'} |

#### 19. `PATCH` `/api/v1/galleries/{gallery_id}`

- **Handler:** `update_gallery` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:337
- **Defined path:** `/{gallery_id}`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `GalleryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `body` | `GalleryUpdate` | `` | `` |  |
| `svc` | `GalleryService` | `Depends(_gal_svc)` | `dependency` | {'arg': '_gal_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 20. `GET` `/api/v1/galleries/{gallery_id}/albums`

- **Handler:** `list_albums` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:363
- **Defined path:** `/{gallery_id}/albums`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `PaginatedResponse[GalleryAlbumRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(50, ge=1, le=200)` | `query` | {'arg': '50', 'ge': '1', 'le': '200'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 21. `POST` `/api/v1/galleries/{gallery_id}/albums`

- **Handler:** `create_album` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:380
- **Defined path:** `/{gallery_id}/albums`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `body` | `GalleryAlbumCreate` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 22. `GET` `/api/v1/galleries/{gallery_id}/items`

- **Handler:** `list_gallery_items` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:395
- **Defined path:** `/{gallery_id}/items`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `PaginatedResponse[GalleryItemRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(50, ge=1, le=200)` | `query` | {'arg': '50', 'ge': '1', 'le': '200'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 23. `POST` `/api/v1/galleries/{gallery_id}/items`

- **Handler:** `add_gallery_item` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:412
- **Defined path:** `/{gallery_id}/items`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `body` | `GalleryItemCreate` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 24. `DELETE` `/api/v1/galleries/{gallery_id}/items/{item_id}`

- **Handler:** `remove_gallery_item` (async)
- **Source:** `app/api/v1/endpoints/artworks.py`:427
- **Defined path:** `/{gallery_id}/items/{item_id}`
- **Router:** object=`gallery_router` prefix=`/galleries` resolved_base=`/api/v1/galleries`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Galleries']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `gallery_id` | `int` | `` | `path` |  |
| `item_id` | `int` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## Chat (v1 API)

- **Source files:** `app/api/v1/endpoints/chat.py`, `app/api/v1/endpoints/mongo_db_endpoints/chat.py`, `app/routers/chat.py`
- **Endpoints:** 18
- **Mount/status:** DEFINED (endpoint module; not seen in api_router include list) (2); mounted (/api/v1 router) (14); mounted in main.py (2)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/chat/assign` | `assign_conversation_member` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/chat/chat_monitor/active_users` | `get_active_users` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/chat/chat_monitor/top_conversations` | `get_top_conversations` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/chat/conversations` | `list_conversations` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/chat/delete` | `delete_message` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/chat/edit` | `edit_message` |  | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/chat/files` | `list_chat_files` | List chat files (attachments) of a conversation — POST per RULES_SYSTEM.md | mounted (/api/v1 router) |
| 8 | `GET` | `/api/v1/chat/files/delete` | `delete_chat_file` | Delete a chat attachment — GET + URL param per RULES_SYSTEM.md | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/chat/files/upload` | `upload_chat_file` |  | mounted (/api/v1 router) |
| 10 | `GET` | `/api/v1/chat/files/{message_id}` | `get_chat_files` | List attachments of one message | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/chat/get` | `get_conversation_messages` |  | mounted (/api/v1 router) |
| 12 | `POST` | `/api/v1/chat/list_message_monitor` | `list_message_monitor` | Keyset-paginated message list for a chat (newest first) | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/chat/mongo/history` | `get_chat_history` |  | DEFINED (endpoint module; not seen in api_router include list) |
| 14 | `POST` | `/api/v1/chat/mongo/send` | `send_chat_message` |  | DEFINED (endpoint module; not seen in api_router include list) |
| 15 | `POST` | `/api/v1/chat/send` | `send_message` |  | mounted (/api/v1 router) |
| 16 | `POST` | `/api/v1/chat/update` | `update_conversation` |  | mounted (/api/v1 router) |
| 17 | `POST` | `/chat/mongo/history` | `get_chat_history` |  | mounted in main.py |
| 18 | `POST` | `/chat/mongo/send` | `send_chat_message` |  | mounted in main.py |

### Endpoint details

#### 1. `POST` `/api/v1/chat/assign`

- **Handler:** `assign_conversation_member` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:434
- **Defined path:** `/assign`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Response model:** `ChatActionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `AssignmentRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Assign (upsert) a member's role in a conversation.
```

#### 2. `POST` `/api/v1/chat/chat_monitor/active_users`

- **Handler:** `get_active_users` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:912
- **Defined path:** `/chat_monitor/active_users`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `limit` | `int` | `Query(10, ge=1, le=50)` | `query` | {'arg': '10', 'ge': '1', 'le': '50'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Recently active chat users (scoped to shared rooms for regular users).
```

#### 3. `POST` `/api/v1/chat/chat_monitor/top_conversations`

- **Handler:** `get_top_conversations` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:860
- **Defined path:** `/chat_monitor/top_conversations`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `limit` | `int` | `Query(10, ge=1, le=50)` | `query` | {'arg': '10', 'ge': '1', 'le': '50'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Top chat rooms by message count (admins see all rooms, users only theirs).
```

#### 4. `POST` `/api/v1/chat/conversations`

- **Handler:** `list_conversations` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:977
- **Defined path:** `/conversations`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `limit` | `int` | `Query(default=100, ge=1, le=200)` | `query` | {'default': '100', 'ge': '1', 'le': '200'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
List chat rooms/conversations the current user can access.
```

#### 5. `GET` `/api/v1/chat/delete`

- **Handler:** `delete_message` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:474
- **Defined path:** `/delete`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Response model:** `ChatActionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., description='Message ID to delete')` | `query` | {'arg': '...', 'description': "'Message ID to delete'"} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Soft-delete a message (GET + URL param per RULES_SYSTEM.md). Only the
sender (or staff) may delete. Content is removed from MongoDB; the MySQL
metadata row keeps the audit trail.
```

#### 6. `POST` `/api/v1/chat/edit`

- **Handler:** `edit_message` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:399
- **Defined path:** `/edit`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Response model:** `ChatActionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `MessageEditRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Edit a message's text. The previous value is preserved as edit history in
the MongoDB content document; MySQL records the EDITED_AT timestamp.
```

#### 7. `POST` `/api/v1/chat/files`

- **Handler:** `list_chat_files` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:513
- **Defined path:** `/files`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Summary:** List chat files (attachments) of a conversation — POST per RULES_SYSTEM.md
- **Response model:** `ChatFileListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ChatFileUploadRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `pagination` | `PaginationParams` | `Depends()` | `dependency` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
List files attached to messages of a conversation (paged).
```

#### 8. `GET` `/api/v1/chat/files/delete`

- **Handler:** `delete_chat_file` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:651
- **Defined path:** `/files/delete`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Summary:** Delete a chat attachment — GET + URL param per RULES_SYSTEM.md
- **Response model:** `ChatActionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., description='Attachment ID to delete')` | `query` | {'arg': '...', 'description': "'Attachment ID to delete'"} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Delete one attachment row and the underlying Google Drive file (best effort).
```

#### 9. `POST` `/api/v1/chat/files/upload`

- **Handler:** `upload_chat_file` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:576
- **Defined path:** `/files/upload`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `ChatFileItem`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `conversation_id` | `Optional[int]` | `Body(None, alias='ConversationId')` | `body` | {'arg': 'None', 'alias': "'ConversationId'"} |
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Upload a file to Google Drive and, when ConversationId is given, post it
as a FILE message (content doc in MongoDB, metadata in MySQL).
```

#### 10. `GET` `/api/v1/chat/files/{message_id}`

- **Handler:** `get_chat_files` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:689
- **Defined path:** `/files/{message_id}`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Summary:** List attachments of one message
- **Response model:** `ChatFileListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `message_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Files attached to a single message (descriptors from MySQL + Mongo doc).
```

#### 11. `POST` `/api/v1/chat/get`

- **Handler:** `get_conversation_messages` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:289
- **Defined path:** `/get`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Response model:** `PaginatedResponse[ChatResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ConversationGetRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `pagination` | `PaginationParams` | `Depends()` | `dependency` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Paginated conversation history. Metadata from MySQL, content bulk-fetched
from MongoDB in one round trip.
```

#### 12. `POST` `/api/v1/chat/list_message_monitor`

- **Handler:** `list_message_monitor` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:737
- **Defined path:** `/list_message_monitor`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Summary:** Keyset-paginated message list for a chat (newest first)
- **Response model:** `List[MessageMonitorItem]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ListMessageMonitorRequest` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Keyset-paginated chat window; bodies resolved from MongoDB in bulk.
```

#### 13. `POST` `/api/v1/chat/mongo/history`

- **Handler:** `get_chat_history` (async)
- **Source:** `app/api/v1/endpoints/mongo_db_endpoints/chat.py`:75
- **Defined path:** `/mongo/history`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** DEFINED (endpoint module; not seen in api_router include list)
- **Tags:** `['Chat System - MongoDB MySQL']`
- **Response model:** `List[ChatResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `HistoryRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `mysql_db` | `` | `Depends(get_mysql_db)` | `dependency` | {'arg': 'get_mysql_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Metadata from MySQL indices, long texts bulk-fetched from MongoDB.
```

#### 14. `POST` `/api/v1/chat/mongo/send`

- **Handler:** `send_chat_message` (async)
- **Source:** `app/api/v1/endpoints/mongo_db_endpoints/chat.py`:30
- **Defined path:** `/mongo/send`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** DEFINED (endpoint module; not seen in api_router include list)
- **Tags:** `['Chat System - MongoDB MySQL']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `ChatResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ChatCreateRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `mysql_db` | `` | `Depends(get_mysql_db)` | `dependency` | {'arg': 'get_mysql_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Step 1: content -> MongoDB. Step 2: coordinates -> MySQL.
```

#### 15. `POST` `/api/v1/chat/send`

- **Handler:** `send_message` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:161
- **Defined path:** `/send`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `ChatResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `SendMessageRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `file` | `UploadFile \| None` | `File(None)` | `file` | {'arg': 'None'} |
| `request` | `Request` | `None` | `request` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Send a direct message or post to a chat room.

Content is stored in MongoDB (via ChatStore); MySQL keeps the metadata row
pointing at it. Optional file upload goes to Google Drive, its descriptor
is stored with the message. Also pushes the message to every live
chat-monitor WebSocket.
```

#### 16. `POST` `/api/v1/chat/update`

- **Handler:** `update_conversation` (async)
- **Source:** `app/api/v1/endpoints/chat.py`:364
- **Defined path:** `/update`
- **Router:** object=`router` prefix=`/chat` resolved_base=`/api/v1/chat`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Chat']`
- **Response model:** `ChatActionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `MarkReadRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `conn` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Mark a conversation as read (advances the caller's read watermark).
```

#### 17. `POST` `/chat/mongo/history`

- **Handler:** `get_chat_history` (async)
- **Source:** `app/routers/chat.py`:80
- **Defined path:** `/mongo/history`
- **Router:** object=`chat_mongodb` prefix=`/chat` resolved_base=`/chat`
- **Mount/status:** mounted in main.py
- **Tags:** `['Chat System - MongoDB MySQL']`
- **Response model:** `List[ChatResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `HistoryRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `mysql_db` | `` | `Depends(get_mysql_db)` | `dependency` | {'arg': 'get_mysql_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Metadata from MySQL indices, long texts bulk-fetched from MongoDB.
```

#### 18. `POST` `/chat/mongo/send`

- **Handler:** `send_chat_message` (async)
- **Source:** `app/routers/chat.py`:35
- **Defined path:** `/mongo/send`
- **Router:** object=`chat_mongodb` prefix=`/chat` resolved_base=`/chat`
- **Mount/status:** mounted in main.py
- **Tags:** `['Chat System - MongoDB MySQL']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `ChatResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ChatCreateRequest` | `Body(...)` | `body` | {'arg': '...'} |
| `mysql_db` | `` | `Depends(get_mysql_db)` | `dependency` | {'arg': 'get_mysql_db'} |
| `store` | `ChatStore` | `Depends(get_chat_store)` | `dependency` | {'arg': 'get_chat_store'} |

**Docstring:**

```text
Step 1: content -> MongoDB. Step 2: coordinates -> MySQL.
```

---

## CMS

- **Source files:** `app/api/v1/endpoints/cms.py`
- **Endpoints:** 16
- **Mount/status:** mounted (/api/v1 router) (16)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/cms/announcements` | `list_announcements` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/cms/announcements` | `create_announcement` |  | mounted (/api/v1 router) |
| 3 | `DELETE` | `/api/v1/cms/announcements/{ann_id}` | `delete_announcement` |  | mounted (/api/v1 router) |
| 4 | `GET` | `/api/v1/cms/banners` | `list_banners` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/cms/banners` | `create_banner` |  | mounted (/api/v1 router) |
| 6 | `DELETE` | `/api/v1/cms/banners/{banner_id}` | `delete_banner` |  | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/cms/menus` | `list_menus` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/cms/menus` | `create_menu` |  | mounted (/api/v1 router) |
| 9 | `GET` | `/api/v1/cms/menus/{menu_id}/items` | `list_menu_items` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/cms/menus/{menu_id}/items` | `create_menu_item` |  | mounted (/api/v1 router) |
| 11 | `GET` | `/api/v1/cms/pages` | `list_pages` |  | mounted (/api/v1 router) |
| 12 | `POST` | `/api/v1/cms/pages` | `create_page` |  | mounted (/api/v1 router) |
| 13 | `GET` | `/api/v1/cms/pages/slug/{slug}` | `get_page_by_slug` |  | mounted (/api/v1 router) |
| 14 | `DELETE` | `/api/v1/cms/pages/{page_id}` | `delete_page` |  | mounted (/api/v1 router) |
| 15 | `GET` | `/api/v1/cms/pages/{page_id}` | `get_page` |  | mounted (/api/v1 router) |
| 16 | `PATCH` | `/api/v1/cms/pages/{page_id}` | `update_page` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/cms/announcements`

- **Handler:** `list_announcements` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:256
- **Defined path:** `/announcements`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PaginatedResponse[AnnouncementRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `POST` `/api/v1/cms/announcements`

- **Handler:** `create_announcement` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:272
- **Defined path:** `/announcements`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `AnnouncementCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `DELETE` `/api/v1/cms/announcements/{ann_id}`

- **Handler:** `delete_announcement` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:284
- **Defined path:** `/announcements/{ann_id}`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `ann_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `GET` `/api/v1/cms/banners`

- **Handler:** `list_banners` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:212
- **Defined path:** `/banners`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PaginatedResponse[BannerRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 5. `POST` `/api/v1/cms/banners`

- **Handler:** `create_banner` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:228
- **Defined path:** `/banners`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `BannerCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 6. `DELETE` `/api/v1/cms/banners/{banner_id}`

- **Handler:** `delete_banner` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:240
- **Defined path:** `/banners/{banner_id}`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `banner_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `GET` `/api/v1/cms/menus`

- **Handler:** `list_menus` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:151
- **Defined path:** `/menus`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PaginatedResponse[MenuRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 8. `POST` `/api/v1/cms/menus`

- **Handler:** `create_menu` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:167
- **Defined path:** `/menus`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `MenuCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 9. `GET` `/api/v1/cms/menus/{menu_id}/items`

- **Handler:** `list_menu_items` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:179
- **Defined path:** `/menus/{menu_id}/items`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PaginatedResponse[MenuItemRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `menu_id` | `int` | `` | `path` |  |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(100, ge=1, le=200)` | `query` | {'arg': '100', 'ge': '1', 'le': '200'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `POST` `/api/v1/cms/menus/{menu_id}/items`

- **Handler:** `create_menu_item` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:196
- **Defined path:** `/menus/{menu_id}/items`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `menu_id` | `int` | `` | `path` |  |
| `body` | `MenuItemCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 11. `GET` `/api/v1/cms/pages`

- **Handler:** `list_pages` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:71
- **Defined path:** `/pages`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PaginatedResponse[PageRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 12. `POST` `/api/v1/cms/pages`

- **Handler:** `create_page` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:87
- **Defined path:** `/pages`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `PageCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 13. `GET` `/api/v1/cms/pages/slug/{slug}`

- **Handler:** `get_page_by_slug` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:101
- **Defined path:** `/pages/slug/{slug}`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PageRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 14. `DELETE` `/api/v1/cms/pages/{page_id}`

- **Handler:** `delete_page` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:135
- **Defined path:** `/pages/{page_id}`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 15. `GET` `/api/v1/cms/pages/{page_id}`

- **Handler:** `get_page` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:110
- **Defined path:** `/pages/{page_id}`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PageRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page_id` | `int` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 16. `PATCH` `/api/v1/cms/pages/{page_id}`

- **Handler:** `update_page` (async)
- **Source:** `app/api/v1/endpoints/cms.py`:119
- **Defined path:** `/pages/{page_id}`
- **Router:** object=`router` prefix=`/cms` resolved_base=`/api/v1/cms`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS']`
- **Response model:** `PageRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page_id` | `int` | `` | `path` |  |
| `body` | `PageUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## CMS Management

- **Source files:** `app/api/v1/endpoints/cms_mgmt.py`
- **Endpoints:** 36
- **Mount/status:** mounted (/api/v1 router) (36)

### Update notes (RULES_SYSTEM.md)

- Prefix renamed from `/cms-mgmt` to snake_case `/cms_mgmt`.
- All list/read endpoints moved from `GET` to `POST` with a PascalCase payload
  (`Pages`, `Records`, `Search`, `OrderBy`, `OrderDir`).
- `Action` in the URL/query replaced by explicit purpose suffixes: `/get`,
  `/create`, `/edit`, `/delete`, `/search`, `/count`, `/export`, `/validate`, etc.
- Every delete is now `GET` only, via `?Id=` or `?Ids=`.
- `audit-logs` renamed to snake_case `audit_logs`; `web-config` to `web_config`.
- Generic `GET/POST /{resource}` split into one route per purpose.
- Translation and revision reads now carry `Resource` / `RecordId` / `RevisionId`
  in the POST payload instead of in the path.

### Previous to current URL mapping

| Previous | Current |
|---|---|
| `GET /api/v1/cms-mgmt/audit-logs` | `POST /api/v1/cms_mgmt/audit_logs/get` |
| `GET /api/v1/cms-mgmt/meta` | `POST /api/v1/cms_mgmt/meta/get` |
| `GET /api/v1/cms-mgmt/revisions/all` | `POST /api/v1/cms_mgmt/revisions/get` |
| `GET /api/v1/cms-mgmt/revisions/record/{resource}/{record_id}` | `POST /api/v1/cms_mgmt/revisions/get` (payload `Resource`, `RecordId`) |
| `GET /api/v1/cms-mgmt/revisions/{revision_id}/diff` | `POST /api/v1/cms_mgmt/revisions/diff/get` (payload `RevisionId`) |
| `POST /api/v1/cms-mgmt/revisions/{revision_id}/restore` | `POST /api/v1/cms_mgmt/revisions/restore/edit` (payload `RevisionId`) |
| `GET /api/v1/cms-mgmt/themes/detail` | `POST /api/v1/cms_mgmt/themes/detail/get` |
| `POST /api/v1/cms-mgmt/themes/detail` | `POST /api/v1/cms_mgmt/themes/create`, `/themes/edit`, `/themes/publish/edit` |
| `GET /api/v1/cms-mgmt/themes/list` | `POST /api/v1/cms_mgmt/themes/get` |
| `GET /api/v1/cms-mgmt/translations/{resource}/{record_id}` | `POST /api/v1/cms_mgmt/translations/get` |
| `POST /api/v1/cms-mgmt/translations/{resource}/{record_id}` | `POST /api/v1/cms_mgmt/translations/create`, `GET /api/v1/cms_mgmt/translations/delete` |
| `GET /api/v1/cms-mgmt/web-config` | `POST /api/v1/cms_mgmt/web_config/get` |
| `POST /api/v1/cms-mgmt/web-config` | `POST /api/v1/cms_mgmt/web_config/create`, `/web_config/edit`, `GET /api/v1/cms_mgmt/web_config/delete` |
| `GET /api/v1/cms-mgmt/{resource}` | `POST /api/v1/cms_mgmt/{resource}/get`, `/search`, `/count`, `/export`, `/validate` and `GET /api/v1/cms_mgmt/{resource}/delete` |
| `POST /api/v1/cms-mgmt/{resource}` | `POST /api/v1/cms_mgmt/{resource}/create`, `/edit`, `/publish`, `/unpublish`, `/reorder`, `/duplicate`, `/restore`, `/import`, `/sync`, `/connect`, `/disconnect`, `/clear` |

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/cms_mgmt/meta/get` | `get_metadata` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/cms_mgmt/web_config/get` | `get_web_config` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/cms_mgmt/web_config/create` | `create_web_config` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/cms_mgmt/web_config/edit` | `edit_web_config` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/cms_mgmt/web_config/delete` | `delete_web_config` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/cms_mgmt/audit_logs/get` | `get_audit_logs` |  | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/cms_mgmt/revisions/get` | `get_revisions` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/cms_mgmt/revisions/diff/get` | `get_revision_diff` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/cms_mgmt/revisions/restore/edit` | `restore_revision` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/cms_mgmt/translations/get` | `get_translation` |  | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/cms_mgmt/translations/create` | `create_translation` |  | mounted (/api/v1 router) |
| 12 | `GET` | `/api/v1/cms_mgmt/translations/delete` | `delete_translation` |  | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/cms_mgmt/themes/get` | `get_themes` |  | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/cms_mgmt/themes/detail/get` | `get_theme` |  | mounted (/api/v1 router) |
| 15 | `POST` | `/api/v1/cms_mgmt/themes/create` | `create_theme` |  | mounted (/api/v1 router) |
| 16 | `POST` | `/api/v1/cms_mgmt/themes/edit` | `edit_theme` |  | mounted (/api/v1 router) |
| 17 | `POST` | `/api/v1/cms_mgmt/themes/publish/edit` | `publish_theme` |  | mounted (/api/v1 router) |
| 18 | `GET` | `/api/v1/cms_mgmt/themes/delete` | `delete_theme` |  | mounted (/api/v1 router) |
| 19 | `POST` | `/api/v1/cms_mgmt/{resource}/get` | `get_content` |  | mounted (/api/v1 router) |
| 20 | `POST` | `/api/v1/cms_mgmt/{resource}/search` | `search_content` |  | mounted (/api/v1 router) |
| 21 | `POST` | `/api/v1/cms_mgmt/{resource}/count` | `count_content` |  | mounted (/api/v1 router) |
| 22 | `POST` | `/api/v1/cms_mgmt/{resource}/export` | `export_content` |  | mounted (/api/v1 router) |
| 23 | `GET` | `/api/v1/cms_mgmt/{resource}/delete` | `delete_content` |  | mounted (/api/v1 router) |
| 24 | `POST` | `/api/v1/cms_mgmt/{resource}/validate` | `validate_content` |  | mounted (/api/v1 router) |
| 25 | `POST` | `/api/v1/cms_mgmt/{resource}/create` | `create_content` |  | mounted (/api/v1 router) |
| 26 | `POST` | `/api/v1/cms_mgmt/{resource}/edit` | `edit_content` |  | mounted (/api/v1 router) |
| 27 | `POST` | `/api/v1/cms_mgmt/{resource}/publish` | `publish_content` |  | mounted (/api/v1 router) |
| 28 | `POST` | `/api/v1/cms_mgmt/{resource}/unpublish` | `unpublish_content` |  | mounted (/api/v1 router) |
| 29 | `POST` | `/api/v1/cms_mgmt/{resource}/reorder` | `reorder_content` |  | mounted (/api/v1 router) |
| 30 | `POST` | `/api/v1/cms_mgmt/{resource}/duplicate` | `duplicate_content` |  | mounted (/api/v1 router) |
| 31 | `POST` | `/api/v1/cms_mgmt/{resource}/restore` | `restore_content` |  | mounted (/api/v1 router) |
| 32 | `POST` | `/api/v1/cms_mgmt/{resource}/import` | `import_content` |  | mounted (/api/v1 router) |
| 33 | `POST` | `/api/v1/cms_mgmt/{resource}/sync` | `sync_content` |  | mounted (/api/v1 router) |
| 34 | `POST` | `/api/v1/cms_mgmt/{resource}/connect` | `connect_content` |  | mounted (/api/v1 router) |
| 35 | `POST` | `/api/v1/cms_mgmt/{resource}/disconnect` | `disconnect_content` |  | mounted (/api/v1 router) |
| 36 | `POST` | `/api/v1/cms_mgmt/{resource}/clear` | `clear_content` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/cms_mgmt/meta/get`

- **Handler:** `get_metadata` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:357
- **Defined path:** `/cms_mgmt/meta/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `dict`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 2. `POST` `/api/v1/cms_mgmt/web_config/get`

- **Handler:** `get_web_config` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:408
- **Defined path:** `/cms_mgmt/web_config/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `WebConfigListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `WebConfigGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 3. `POST` `/api/v1/cms_mgmt/web_config/create`

- **Handler:** `create_web_config` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:439
- **Defined path:** `/cms_mgmt/web_config/create`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `WebConfigWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 4. `POST` `/api/v1/cms_mgmt/web_config/edit`

- **Handler:** `edit_web_config` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:449
- **Defined path:** `/cms_mgmt/web_config/edit`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `WebConfigWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 5. `GET` `/api/v1/cms_mgmt/web_config/delete`

- **Handler:** `delete_web_config` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:459
- **Defined path:** `/cms_mgmt/web_config/delete`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 6. `POST` `/api/v1/cms_mgmt/audit_logs/get`

- **Handler:** `get_audit_logs` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:478
- **Defined path:** `/cms_mgmt/audit_logs/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `AuditLogListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `AuditLogGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 7. `POST` `/api/v1/cms_mgmt/revisions/get`

- **Handler:** `get_revisions` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:577
- **Defined path:** `/cms_mgmt/revisions/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `RevisionListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RevisionGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 8. `POST` `/api/v1/cms_mgmt/revisions/diff/get`

- **Handler:** `get_revision_diff` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:601
- **Defined path:** `/cms_mgmt/revisions/diff/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `RevisionDiff`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RevisionDiffGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 9. `POST` `/api/v1/cms_mgmt/revisions/restore/edit`

- **Handler:** `restore_revision` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:619
- **Defined path:** `/cms_mgmt/revisions/restore/edit`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `RevisionRestorePayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 10. `POST` `/api/v1/cms_mgmt/translations/get`

- **Handler:** `get_translation` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:652
- **Defined path:** `/cms_mgmt/translations/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `TranslationGroup`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `TranslationGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 11. `POST` `/api/v1/cms_mgmt/translations/create`

- **Handler:** `create_translation` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:740
- **Defined path:** `/cms_mgmt/translations/create`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `TranslationWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 12. `GET` `/api/v1/cms_mgmt/translations/delete`

- **Handler:** `delete_translation` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:752
- **Defined path:** `/cms_mgmt/translations/delete`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 13. `POST` `/api/v1/cms_mgmt/themes/get`

- **Handler:** `get_themes` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:780
- **Defined path:** `/cms_mgmt/themes/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ThemeListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ThemeGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 14. `POST` `/api/v1/cms_mgmt/themes/detail/get`

- **Handler:** `get_theme` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:793
- **Defined path:** `/cms_mgmt/themes/detail/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ThemeRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ThemeDetailGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 15. `POST` `/api/v1/cms_mgmt/themes/create`

- **Handler:** `create_theme` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:828
- **Defined path:** `/cms_mgmt/themes/create`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ThemeRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ThemeWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 16. `POST` `/api/v1/cms_mgmt/themes/edit`

- **Handler:** `edit_theme` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:838
- **Defined path:** `/cms_mgmt/themes/edit`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ThemeRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ThemeWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 17. `POST` `/api/v1/cms_mgmt/themes/publish/edit`

- **Handler:** `publish_theme` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:848
- **Defined path:** `/cms_mgmt/themes/publish/edit`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ThemeRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ThemeWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 18. `GET` `/api/v1/cms_mgmt/themes/delete`

- **Handler:** `delete_theme` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:858
- **Defined path:** `/cms_mgmt/themes/delete`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ThemeRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 19. `POST` `/api/v1/cms_mgmt/{resource}/get`

- **Handler:** `get_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:921
- **Defined path:** `/cms_mgmt/{resource}/get`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 20. `POST` `/api/v1/cms_mgmt/{resource}/search`

- **Handler:** `search_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:932
- **Defined path:** `/cms_mgmt/{resource}/search`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 21. `POST` `/api/v1/cms_mgmt/{resource}/count`

- **Handler:** `count_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:943
- **Defined path:** `/cms_mgmt/{resource}/count`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 22. `POST` `/api/v1/cms_mgmt/{resource}/export`

- **Handler:** `export_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:954
- **Defined path:** `/cms_mgmt/{resource}/export`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentGetPayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 23. `GET` `/api/v1/cms_mgmt/{resource}/delete`

- **Handler:** `delete_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:965
- **Defined path:** `/cms_mgmt/{resource}/delete`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 24. `POST` `/api/v1/cms_mgmt/{resource}/validate`

- **Handler:** `validate_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1045
- **Defined path:** `/cms_mgmt/{resource}/validate`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ValidationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ValidatePayload` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 25. `POST` `/api/v1/cms_mgmt/{resource}/create`

- **Handler:** `create_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1120
- **Defined path:** `/cms_mgmt/{resource}/create`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 26. `POST` `/api/v1/cms_mgmt/{resource}/edit`

- **Handler:** `edit_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1131
- **Defined path:** `/cms_mgmt/{resource}/edit`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 27. `POST` `/api/v1/cms_mgmt/{resource}/publish`

- **Handler:** `publish_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1142
- **Defined path:** `/cms_mgmt/{resource}/publish`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 28. `POST` `/api/v1/cms_mgmt/{resource}/unpublish`

- **Handler:** `unpublish_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1153
- **Defined path:** `/cms_mgmt/{resource}/unpublish`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 29. `POST` `/api/v1/cms_mgmt/{resource}/reorder`

- **Handler:** `reorder_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1164
- **Defined path:** `/cms_mgmt/{resource}/reorder`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 30. `POST` `/api/v1/cms_mgmt/{resource}/duplicate`

- **Handler:** `duplicate_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1175
- **Defined path:** `/cms_mgmt/{resource}/duplicate`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 31. `POST` `/api/v1/cms_mgmt/{resource}/restore`

- **Handler:** `restore_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1186
- **Defined path:** `/cms_mgmt/{resource}/restore`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 32. `POST` `/api/v1/cms_mgmt/{resource}/import`

- **Handler:** `import_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1197
- **Defined path:** `/cms_mgmt/{resource}/import`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 33. `POST` `/api/v1/cms_mgmt/{resource}/sync`

- **Handler:** `sync_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1208
- **Defined path:** `/cms_mgmt/{resource}/sync`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 34. `POST` `/api/v1/cms_mgmt/{resource}/connect`

- **Handler:** `connect_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1219
- **Defined path:** `/cms_mgmt/{resource}/connect`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 35. `POST` `/api/v1/cms_mgmt/{resource}/disconnect`

- **Handler:** `disconnect_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1230
- **Defined path:** `/cms_mgmt/{resource}/disconnect`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 36. `POST` `/api/v1/cms_mgmt/{resource}/clear`

- **Handler:** `clear_content` (async)
- **Source:** `app/api/v1/endpoints/cms_mgmt.py`:1241
- **Defined path:** `/cms_mgmt/{resource}/clear`
- **Router:** object=`router` prefix=`/cms_mgmt` resolved_base=`/api/v1/cms_mgmt`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['CMS Management']`
- **Response model:** `ContentMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `resource` | `str` | `` | `path` |  |
| `body` | `ContentWriteRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## Comments

- **Source files:** `app/api/v1/endpoints/comments.py`
- **Endpoints:** 6
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py) (6)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/comments` | `list_comments` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 2 | `POST` | `/api/v1/comments` | `create_comment` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 3 | `DELETE` | `/api/v1/comments/{comment_id}` | `delete_comment` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 4 | `GET` | `/api/v1/comments/{comment_id}` | `get_comment` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 5 | `PATCH` | `/api/v1/comments/{comment_id}` | `update_comment` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 6 | `GET` | `/api/v1/comments/{comment_id}/replies` | `list_replies` |  | DEFINED (mount inferred under /api/v1; verify router.py) |

### Endpoint details

#### 1. `GET` `/api/v1/comments`

- **Handler:** `list_comments` (async)
- **Source:** `app/api/v1/endpoints/comments.py`:43
- **Defined path:** ``
- **Router:** object=`router` prefix=`/comments` resolved_base=`/api/v1/comments`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Comments']`
- **Response model:** `PaginatedResponse[CommentRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `Query(..., alias='PostId')` | `query` | {'arg': '...', 'alias': "'PostId'"} |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `svc` | `CommentService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 2. `POST` `/api/v1/comments`

- **Handler:** `create_comment` (async)
- **Source:** `app/api/v1/endpoints/comments.py`:59
- **Defined path:** ``
- **Router:** object=`router` prefix=`/comments` resolved_base=`/api/v1/comments`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Comments']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `CommentCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `CommentService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 3. `DELETE` `/api/v1/comments/{comment_id}`

- **Handler:** `delete_comment` (async)
- **Source:** `app/api/v1/endpoints/comments.py`:115
- **Defined path:** `/{comment_id}`
- **Router:** object=`router` prefix=`/comments` resolved_base=`/api/v1/comments`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Comments']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `comment_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `CommentService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 4. `GET` `/api/v1/comments/{comment_id}`

- **Handler:** `get_comment` (async)
- **Source:** `app/api/v1/endpoints/comments.py`:71
- **Defined path:** `/{comment_id}`
- **Router:** object=`router` prefix=`/comments` resolved_base=`/api/v1/comments`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Comments']`
- **Response model:** `CommentRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `comment_id` | `int` | `` | `path` |  |
| `svc` | `CommentService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 5. `PATCH` `/api/v1/comments/{comment_id}`

- **Handler:** `update_comment` (async)
- **Source:** `app/api/v1/endpoints/comments.py`:95
- **Defined path:** `/{comment_id}`
- **Router:** object=`router` prefix=`/comments` resolved_base=`/api/v1/comments`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Comments']`
- **Response model:** `CommentRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `comment_id` | `int` | `` | `path` |  |
| `body` | `CommentUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `CommentService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 6. `GET` `/api/v1/comments/{comment_id}/replies`

- **Handler:** `list_replies` (async)
- **Source:** `app/api/v1/endpoints/comments.py`:79
- **Defined path:** `/{comment_id}/replies`
- **Router:** object=`router` prefix=`/comments` resolved_base=`/api/v1/comments`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Comments']`
- **Response model:** `PaginatedResponse[CommentRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `comment_id` | `int` | `` | `path` |  |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `svc` | `CommentService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

---

## Databases Controller

- **Source files:** `app/api/v1/endpoints/databases.py`
- **Endpoints:** 3
- **Mount/status:** mounted (/api/v1 router) (3)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/databases` | `databases_post` | CRUD Databases with POST and Action | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/databases/remove` | `databases_get` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/databases/userdatabase/get` | `get_users_database` | Get users database | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/databases`

- **Handler:** `databases_post` (async)
- **Source:** `app/api/v1/endpoints/databases.py`:244
- **Defined path:** ``
- **Router:** object=`router` prefix=`/databases` resolved_base=`/api/v1/databases`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['----------------------Databases Controller-------------------------']`
- **Summary:** CRUD Databases with POST and Action
- **Response model:** `DatabaseListResponse | DatabaseMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `Optional[DatabaseRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_default_db)` | `dependency` | {'arg': 'get_default_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `user` | `` | `Depends(authenticate)` | `dependency` | {'arg': 'authenticate'} |

**Docstring:**

```text
Single POST entry point; ``Action`` (default ``list``) selects the operation.
```

#### 2. `GET` `/api/v1/databases/remove`

- **Handler:** `databases_get` (async)
- **Source:** `app/api/v1/endpoints/databases.py`:321
- **Defined path:** `/remove`
- **Router:** object=`router` prefix=`/databases` resolved_base=`/api/v1/databases`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['----------------------Databases Controller-------------------------']`
- **Response model:** `DatabaseMutationResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Action` | `str` | `Query(default='delete', description="Only 'delete' is supported")` | `query` | {'default': "'delete'", 'description': '"Only \'delete\' is supported"'} |
| `Id` | `Optional[int]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `Code` | `Optional[str]` | `Query(default=None)` | `query` | {'default': 'None'} |
| `body` | `Optional[DatabaseDeleteRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_default_db)` | `dependency` | {'arg': 'get_default_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete a registry row, transported over GET (query params or body payload).
```

#### 3. `POST` `/api/v1/databases/userdatabase/get`

- **Handler:** `get_users_database` (async)
- **Source:** `app/api/v1/endpoints/databases.py`:283
- **Defined path:** `/userdatabase/get`
- **Router:** object=`router` prefix=`/databases` resolved_base=`/api/v1/databases`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['----------------------Databases Controller-------------------------']`
- **Summary:** Get users database
- **Response model:** `DatabaseListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `Optional[DatabaseRequest]` | `Body(default=None)` | `body` | {'default': 'None'} |
| `session` | `AsyncSession` | `Depends(get_default_db)` | `dependency` | {'arg': 'get_default_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Single POST entry point; ``Action`` (default ``list``) selects the operation.
```

---

## Google Drive Activity & Audit (nested)

- **Source files:** `app/api/v1/endpoints/drive_activity.py`
- **Endpoints:** 5
- **Mount/status:** mounted nested under /api/v1/google_drive/activity (5)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/google_drive/activity/audit/list` | `list_audit_logs` |  | mounted nested under /api/v1/google_drive/activity |
| 2 | `POST` | `/api/v1/google_drive/activity/history` | `activity_history` |  | mounted nested under /api/v1/google_drive/activity |
| 3 | `POST` | `/api/v1/google_drive/activity/query` | `query_activity` |  | mounted nested under /api/v1/google_drive/activity |
| 4 | `POST` | `/api/v1/google_drive/activity/summary` | `activity_summary` |  | mounted nested under /api/v1/google_drive/activity |
| 5 | `POST` | `/api/v1/google_drive/activity/sync` | `sync_activity` |  | mounted nested under /api/v1/google_drive/activity |

### Endpoint details

#### 1. `POST` `/api/v1/google_drive/activity/audit/list`

- **Handler:** `list_audit_logs` (async)
- **Source:** `app/api/v1/endpoints/drive_activity.py`:88
- **Defined path:** `/audit/list`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/activity`
- **Mount/status:** mounted nested under /api/v1/google_drive/activity
- **Tags:** `['Google Drive - Activity & Audit']`
- **Response model:** `AuditLogListResponse`
- **Responses:** `error_responses(UnprocessableError)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `AuditLogListRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_activity.read'))` | `dependency` | {'arg': "require_permission('system.drive_activity.read')"} |

**Docstring:**

```text
Stored audit trail, newest first. Filters: Actions, ActorId, ItemId, StartTime/EndTime, Search (title).
```

#### 2. `POST` `/api/v1/google_drive/activity/history`

- **Handler:** `activity_history` (async)
- **Source:** `app/api/v1/endpoints/drive_activity.py`:62
- **Defined path:** `/history`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/activity`
- **Mount/status:** mounted nested under /api/v1/google_drive/activity
- **Tags:** `['Google Drive - Activity & Audit']`
- **Response model:** `ActivityQueryResponse`
- **Responses:** `_READ_ERRORS`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ActivityHistoryRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_activity.read'))` | `dependency` | {'arg': "require_permission('system.drive_activity.read')"} |

**Docstring:**

```text
Who did what to one file/folder (ItemId required).
```

#### 3. `POST` `/api/v1/google_drive/activity/query`

- **Handler:** `query_activity` (async)
- **Source:** `app/api/v1/endpoints/drive_activity.py`:52
- **Defined path:** `/query`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/activity`
- **Mount/status:** mounted nested under /api/v1/google_drive/activity
- **Tags:** `['Google Drive - Activity & Audit']`
- **Response model:** `ActivityQueryResponse`
- **Responses:** `_READ_ERRORS`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ActivityQueryRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_activity.read'))` | `dependency` | {'arg': "require_permission('system.drive_activity.read')"} |

**Docstring:**

```text
Live Drive Activity query. Scope by ItemId or AncestorId (folder subtree).
```

#### 4. `POST` `/api/v1/google_drive/activity/summary`

- **Handler:** `activity_summary` (async)
- **Source:** `app/api/v1/endpoints/drive_activity.py`:98
- **Defined path:** `/summary`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/activity`
- **Mount/status:** mounted nested under /api/v1/google_drive/activity
- **Tags:** `['Google Drive - Activity & Audit']`
- **Response model:** `ActivitySummaryResponse`
- **Responses:** `error_responses(UnprocessableError)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ActivitySummaryRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_activity.read'))` | `dependency` | {'arg': "require_permission('system.drive_activity.read')"} |

**Docstring:**

```text
Daily / Weekly / Monthly report (UTC buckets) with per-action, top actors and top items.
```

#### 5. `POST` `/api/v1/google_drive/activity/sync`

- **Handler:** `sync_activity` (async)
- **Source:** `app/api/v1/endpoints/drive_activity.py`:75
- **Defined path:** `/sync`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/activity`
- **Mount/status:** mounted nested under /api/v1/google_drive/activity
- **Tags:** `['Google Drive - Activity & Audit']`
- **Response model:** `ActivitySyncResponse`
- **Responses:** `{**_READ_ERRORS, **error_responses(DriveActivityRangeTooLargeError)}`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ActivitySyncRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_activity.create'))` | `dependency` | {'arg': "require_permission('system.drive_activity.create')"} |

**Docstring:**

```text
Pull activity into CMS_DRIVE_ACTIVITY_LOGS. Idempotent; default window starts at the
last stored event. Run it from a scheduler (e.g. every 15 min) and before reports.
```

---

## Google Drive Labels & Metadata (nested)

- **Source files:** `app/api/v1/endpoints/drive_labels.py`
- **Endpoints:** 7
- **Mount/status:** mounted nested under /api/v1/google_drive/labels (7)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/google_drive/labels/assign` | `assign_labels` |  | mounted nested under /api/v1/google_drive/labels |
| 2 | `POST` | `/api/v1/google_drive/labels/create` | `create_label` |  | mounted nested under /api/v1/google_drive/labels |
| 3 | `GET` | `/api/v1/google_drive/labels/delete` | `delete_labels` |  | mounted nested under /api/v1/google_drive/labels |
| 4 | `POST` | `/api/v1/google_drive/labels/file` | `get_file_labels` |  | mounted nested under /api/v1/google_drive/labels |
| 5 | `POST` | `/api/v1/google_drive/labels/get` | `get_label` |  | mounted nested under /api/v1/google_drive/labels |
| 6 | `POST` | `/api/v1/google_drive/labels/list` | `list_labels` |  | mounted nested under /api/v1/google_drive/labels |
| 7 | `POST` | `/api/v1/google_drive/labels/update` | `update_label` |  | mounted nested under /api/v1/google_drive/labels |

### Endpoint details

#### 1. `POST` `/api/v1/google_drive/labels/assign`

- **Handler:** `assign_labels` (async)
- **Source:** `app/api/v1/endpoints/drive_labels.py`:111
- **Defined path:** `/assign`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/labels`
- **Mount/status:** mounted nested under /api/v1/google_drive/labels
- **Tags:** `['Google Drive - Labels & Metadata']`
- **Response model:** `FileLabelsResponse`
- **Responses:** `error_responses(*_COMMON, DriveItemNotFoundError, LabelNotFoundError, LabelFieldNotFoundError, LabelChoiceNotFoundError)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `LabelAssignRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_labels.assign'))` | `dependency` | {'arg': "require_permission('system.drive_labels.assign')"} |

**Docstring:**

```text
Apply structured metadata to a file. Fields and options may be given by id or display name:

    {"FileId": "1AbC...", "Labels": [{"LabelId": "x9", "Fields": [
        {"Field": "Confidentiality", "Values": ["Confidential"]},
        {"Field": "ApprovalStatus",  "Values": ["Pending"]}]}]}

`Remove: true` removes the label; `Clear: true` on a field unsets its value.
```

#### 2. `POST` `/api/v1/google_drive/labels/create`

- **Handler:** `create_label` (async)
- **Source:** `app/api/v1/endpoints/drive_labels.py`:83
- **Defined path:** `/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/labels`
- **Mount/status:** mounted nested under /api/v1/google_drive/labels
- **Tags:** `['Google Drive - Labels & Metadata']`
- **Response model:** `LabelDefinition`
- **Responses:** `error_responses(*_COMMON)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `LabelCreateRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_labels.create'))` | `dependency` | {'arg': "require_permission('system.drive_labels.create')"} |

**Docstring:**

```text
Create a label. `Preset: "Classification"` adds single-select fields
Confidentiality (Public | Internal | Confidential) and ApprovalStatus
(Pending | Approved | Rejected). Add Department / DocumentType as SELECTION fields in `Fields`.
`Publish: true` (default) makes it assignable immediately.
```

#### 3. `GET` `/api/v1/google_drive/labels/delete`

- **Handler:** `delete_labels` (async)
- **Source:** `app/api/v1/endpoints/drive_labels.py`:129
- **Defined path:** `/delete`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/labels`
- **Mount/status:** mounted nested under /api/v1/google_drive/labels
- **Tags:** `['Google Drive - Labels & Metadata']`
- **Response model:** `LabelDeleteResponse`
- **Responses:** `error_responses(*_COMMON)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `ids` | `list[str]` | `Depends(delete_ids)` | `dependency` | {'arg': 'delete_ids'} |
| `use_admin_access` | `bool` | `Query(False, alias='UseAdminAccess')` | `query` | {'arg': 'False', 'alias': "'UseAdminAccess'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_labels.delete'))` | `dependency` | {'arg': "require_permission('system.drive_labels.delete')"} |

**Docstring:**

```text
Published label -> DISABLED (reversible). Disabled/draft label -> permanently DELETED
(erases its metadata on all files). Per-id results; one failure does not stop the rest.
```

#### 4. `POST` `/api/v1/google_drive/labels/file`

- **Handler:** `get_file_labels` (async)
- **Source:** `app/api/v1/endpoints/drive_labels.py`:73
- **Defined path:** `/file`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/labels`
- **Mount/status:** mounted nested under /api/v1/google_drive/labels
- **Tags:** `['Google Drive - Labels & Metadata']`
- **Response model:** `FileLabelsResponse`
- **Responses:** `error_responses(*_COMMON, DriveItemNotFoundError)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `LabelFileRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_labels.read'))` | `dependency` | {'arg': "require_permission('system.drive_labels.read')"} |

**Docstring:**

```text
Labels (and their values) currently applied to a file.
```

#### 5. `POST` `/api/v1/google_drive/labels/get`

- **Handler:** `get_label` (async)
- **Source:** `app/api/v1/endpoints/drive_labels.py`:64
- **Defined path:** `/get`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/labels`
- **Mount/status:** mounted nested under /api/v1/google_drive/labels
- **Tags:** `['Google Drive - Labels & Metadata']`
- **Response model:** `LabelDefinition`
- **Responses:** `error_responses(*_COMMON, LabelNotFoundError)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `LabelGetRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_labels.read'))` | `dependency` | {'arg': "require_permission('system.drive_labels.read')"} |

#### 6. `POST` `/api/v1/google_drive/labels/list`

- **Handler:** `list_labels` (async)
- **Source:** `app/api/v1/endpoints/drive_labels.py`:55
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/labels`
- **Mount/status:** mounted nested under /api/v1/google_drive/labels
- **Tags:** `['Google Drive - Labels & Metadata']`
- **Response model:** `LabelListResponse`
- **Responses:** `error_responses(*_COMMON)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `LabelListRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_labels.read'))` | `dependency` | {'arg': "require_permission('system.drive_labels.read')"} |

#### 7. `POST` `/api/v1/google_drive/labels/update`

- **Handler:** `update_label` (async)
- **Source:** `app/api/v1/endpoints/drive_labels.py`:98
- **Defined path:** `/update`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1/google_drive/labels`
- **Mount/status:** mounted nested under /api/v1/google_drive/labels
- **Tags:** `['Google Drive - Labels & Metadata']`
- **Response model:** `LabelDefinition`
- **Responses:** `error_responses(*_COMMON, LabelNotFoundError)`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `LabelUpdateRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `user` | `CurrentUser` | `Depends(require_permission('system.drive_labels.update'))` | `dependency` | {'arg': "require_permission('system.drive_labels.update')"} |

---

## Forum

- **Source files:** `app/api/v1/endpoints/forum.py`
- **Endpoints:** 32
- **Mount/status:** mounted (/api/v1 router) (32)
- **Contract:** RULES_SYSTEM.md — create/list/get/update/assign use `POST` via PascalCase payload only; delete uses `GET /.../delete?Id=1` or `?Ids=1,2` (JSON `{"Id": [1, 2]}` also accepted). No `{id}` path parameters.
- **List payload:** `Pages`, `Records`, `Search`, `OrderBy`, `OrderDir`; list responses are arrays with `TotalRecord` added to every row.

### Payload schemas

| Action | Body schema | Identifier field |
|---|---|---|
| `create` | `ForumPostCreate`, `ForumCategoryCreate`, `ForumTagCreate`, `ForumSeriesCreate`, `ForumCommentCreate` | — |
| `list` | `ForumPostListRequest`, `ForumCategoryListRequest`, `ForumTagListRequest`, `ForumSeriesListRequest`, `ForumCommentListRequest` | — |
| `get` | `ForumGetRequest` | `Id` |
| `update` | `ForumPostUpdate`, `ForumCategoryUpdate`, `ForumTagUpdate`, `ForumSeriesUpdate`, `ForumCommentUpdate` | `Id` |
| `assign` | `ForumAssignRequest` | `Id` |
| `delete` | query `Id`/`Ids` or JSON `Id`/`Ids` | `Id`, `Ids` |
| `reactions/create` | `ForumReactionCreate` | `PostId` |
| `bookmarks/create` | `ForumBookmarkCreate` | `PostId` |

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/posts/create` | `create_post` | Create post | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/posts/list` | `list_posts` | Datatable list of posts | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/posts/get` | `get_post` | Get post by Id in payload | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/posts/update` | `update_post` | Update post by Id in payload | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/posts/assign` | `assign_post` | Assign post relations by Id in payload | mounted (/api/v1 router) |
| 6 | `GET` | `/api/v1/posts/delete` | `delete_posts` | Delete post(s) by Id/Ids payload | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/categories/create` | `create_category` | Create category | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/categories/list` | `list_categories` | Datatable list of categories | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/categories/get` | `get_category` | Get category by Id in payload | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/categories/update` | `update_category` | Update category by Id in payload | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/categories/assign` | `assign_category` | Assign category relations by Id in payload | mounted (/api/v1 router) |
| 12 | `GET` | `/api/v1/categories/delete` | `delete_categories` | Delete category(ies) by Id/Ids payload | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/tags/create` | `create_tag` | Create tag | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/tags/list` | `list_tags` | Datatable list of tags | mounted (/api/v1 router) |
| 15 | `POST` | `/api/v1/tags/get` | `get_tag` | Get tag by Id in payload | mounted (/api/v1 router) |
| 16 | `POST` | `/api/v1/tags/update` | `update_tag` | Update tag by Id in payload | mounted (/api/v1 router) |
| 17 | `POST` | `/api/v1/tags/assign` | `assign_tag` | Assign tag relations by Id in payload | mounted (/api/v1 router) |
| 18 | `GET` | `/api/v1/tags/delete` | `delete_tags` | Delete tag(s) by Id/Ids payload | mounted (/api/v1 router) |
| 19 | `POST` | `/api/v1/series/create` | `create_series` | Create series | mounted (/api/v1 router) |
| 20 | `POST` | `/api/v1/series/list` | `list_series` | Datatable list of series | mounted (/api/v1 router) |
| 21 | `POST` | `/api/v1/series/get` | `get_series` | Get series by Id in payload | mounted (/api/v1 router) |
| 22 | `POST` | `/api/v1/series/update` | `update_series` | Update series by Id in payload | mounted (/api/v1 router) |
| 23 | `POST` | `/api/v1/series/assign` | `assign_series` | Assign series relations by Id in payload | mounted (/api/v1 router) |
| 24 | `GET` | `/api/v1/series/delete` | `delete_series_batch` | Delete series by Id/Ids payload | mounted (/api/v1 router) |
| 25 | `POST` | `/api/v1/comments/create` | `create_comment` | Create comment | mounted (/api/v1 router) |
| 26 | `POST` | `/api/v1/comments/list` | `list_comments` | Datatable list of comments | mounted (/api/v1 router) |
| 27 | `POST` | `/api/v1/comments/get` | `get_comment` | Get comment by Id in payload | mounted (/api/v1 router) |
| 28 | `POST` | `/api/v1/comments/update` | `update_comment` | Update comment by Id in payload | mounted (/api/v1 router) |
| 29 | `POST` | `/api/v1/comments/assign` | `assign_comment` | Assign comment flags by Id in payload | mounted (/api/v1 router) |
| 30 | `GET` | `/api/v1/comments/delete` | `delete_comments` | Delete comment(s) by Id/Ids payload | mounted (/api/v1 router) |
| 31 | `POST` | `/api/v1/posts/reactions/create` | `create_reaction` | Add reaction by PostId in payload | mounted (/api/v1 router) |
| 32 | `POST` | `/api/v1/posts/bookmarks/create` | `create_bookmark` | Add bookmark by PostId in payload | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/posts/create`

- **Handler:** `create_post` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:208
- **Defined path:** `/posts/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumPostCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 2. `POST` `/api/v1/posts/list`

- **Handler:** `list_posts` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:222
- **Defined path:** `/posts/list`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumPostListRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 3. `POST` `/api/v1/posts/get`

- **Handler:** `get_post` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:236
- **Defined path:** `/posts/get`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumPostRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumGetRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 4. `POST` `/api/v1/posts/update`

- **Handler:** `update_post` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:249
- **Defined path:** `/posts/update`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumPostRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumPostUpdate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 5. `POST` `/api/v1/posts/assign`

- **Handler:** `assign_post` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:266
- **Defined path:** `/posts/assign`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumPostRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumAssignRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 6. `GET` `/api/v1/posts/delete`

- **Handler:** `delete_posts` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:282
- **Defined path:** `/posts/delete`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any] \| None` | `Body(default=None)` | `body` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 7. `POST` `/api/v1/categories/create`

- **Handler:** `create_category` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:305
- **Defined path:** `/categories/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumCategoryCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 8. `POST` `/api/v1/categories/list`

- **Handler:** `list_categories` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:319
- **Defined path:** `/categories/list`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumCategoryListRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 9. `POST` `/api/v1/categories/get`

- **Handler:** `get_category` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:332
- **Defined path:** `/categories/get`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumCategoryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumGetRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 10. `POST` `/api/v1/categories/update`

- **Handler:** `update_category` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:345
- **Defined path:** `/categories/update`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumCategoryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumCategoryUpdate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 11. `POST` `/api/v1/categories/assign`

- **Handler:** `assign_category` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:361
- **Defined path:** `/categories/assign`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumCategoryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumAssignRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 12. `GET` `/api/v1/categories/delete`

- **Handler:** `delete_categories` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:377
- **Defined path:** `/categories/delete`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any] \| None` | `Body(default=None)` | `body` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 13. `POST` `/api/v1/tags/create`

- **Handler:** `create_tag` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:398
- **Defined path:** `/tags/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumTagCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 14. `POST` `/api/v1/tags/list`

- **Handler:** `list_tags` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:412
- **Defined path:** `/tags/list`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumTagListRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 15. `POST` `/api/v1/tags/get`

- **Handler:** `get_tag` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:425
- **Defined path:** `/tags/get`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumTagRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumGetRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 16. `POST` `/api/v1/tags/update`

- **Handler:** `update_tag` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:438
- **Defined path:** `/tags/update`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumTagRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumTagUpdate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 17. `POST` `/api/v1/tags/assign`

- **Handler:** `assign_tag` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:454
- **Defined path:** `/tags/assign`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumTagRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumAssignRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 18. `GET` `/api/v1/tags/delete`

- **Handler:** `delete_tags` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:470
- **Defined path:** `/tags/delete`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any] \| None` | `Body(default=None)` | `body` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 19. `POST` `/api/v1/series/create`

- **Handler:** `create_series` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:491
- **Defined path:** `/series/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumSeriesCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 20. `POST` `/api/v1/series/list`

- **Handler:** `list_series` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:505
- **Defined path:** `/series/list`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumSeriesListRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 21. `POST` `/api/v1/series/get`

- **Handler:** `get_series` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:518
- **Defined path:** `/series/get`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumSeriesRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumGetRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 22. `POST` `/api/v1/series/update`

- **Handler:** `update_series` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:531
- **Defined path:** `/series/update`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumSeriesRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumSeriesUpdate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 23. `POST` `/api/v1/series/assign`

- **Handler:** `assign_series` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:548
- **Defined path:** `/series/assign`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumSeriesRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumAssignRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 24. `GET` `/api/v1/series/delete`

- **Handler:** `delete_series_batch` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:564
- **Defined path:** `/series/delete`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any] \| None` | `Body(default=None)` | `body` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 25. `POST` `/api/v1/comments/create`

- **Handler:** `create_comment` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:587
- **Defined path:** `/comments/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumCommentCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 26. `POST` `/api/v1/comments/list`

- **Handler:** `list_comments` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:602
- **Defined path:** `/comments/list`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumCommentListRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 27. `POST` `/api/v1/comments/get`

- **Handler:** `get_comment` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:615
- **Defined path:** `/comments/get`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumCommentRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumGetRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 28. `POST` `/api/v1/comments/update`

- **Handler:** `update_comment` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:628
- **Defined path:** `/comments/update`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumCommentRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumCommentUpdate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 29. `POST` `/api/v1/comments/assign`

- **Handler:** `assign_comment` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:645
- **Defined path:** `/comments/assign`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `ForumCommentRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumAssignRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 30. `GET` `/api/v1/comments/delete`

- **Handler:** `delete_comments` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:661
- **Defined path:** `/comments/delete`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any] \| None` | `Body(default=None)` | `body` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 31. `POST` `/api/v1/posts/reactions/create`

- **Handler:** `create_reaction` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:686
- **Defined path:** `/posts/reactions/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumReactionCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 32. `POST` `/api/v1/posts/bookmarks/create`

- **Handler:** `create_bookmark` (async)
- **Source:** `app/api/v1/endpoints/forum.py`:713
- **Defined path:** `/posts/bookmarks/create`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Forum']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ForumBookmarkCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## Google Auth One Tap

- **Source files:** `app/api/v1/endpoints/google_auth_one_tap.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/api/v1/u/GoogleLogin` | `google_login` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/api/v1/u/GoogleLogin`

- **Handler:** `google_login` (async)
- **Source:** `app/api/v1/endpoints/google_auth_one_tap.py`:161
- **Defined path:** `/u/GoogleLogin`
- **Router:** object=`router` prefix=`/api/v1` resolved_base=`/api/v1/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Google Auth one tap']`
- **Response model:** `GoogleLoginResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `GoogleLoginRequest` | `` | `` |  |
| `conn` | `` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Media / File Explore Management

- **Source files:** `app/api/v1/endpoints/media.py`
- **Endpoints:** 11
- **Mount/status:** mounted (/api/v1 router) (11)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/media/dashboard` | `media_dashboard` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/media/files` | `files_get` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/media/files` | `files_action` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/media/files/delete` | `media_files_delete` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/media/files/list` | `media_files_list` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/media/files/upload` | `upload_file` |  | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/media/files/{file_id}` | `get_file` |  | mounted (/api/v1 router) |
| 8 | `GET` | `/api/v1/media/folders` | `folders_get` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/media/folders` | `folders_action` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/media/folders/star` | `media_folder_star` |  | mounted (/api/v1 router) |
| 11 | `GET` | `/api/v1/media/types` | `list_types` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/media/dashboard`

- **Handler:** `media_dashboard` (async)
- **Source:** `app/api/v1/endpoints/media.py`:908
- **Defined path:** `/dashboard`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `MediaDashboardRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `body` | `MediaDashboardRequest \| None` | `None` | `` |  |

**Docstring:**

```text
Dashboard snapshot for the media page (storage, activity, announcements, folders, people).
```

#### 2. `GET` `/api/v1/media/files`

- **Handler:** `files_get` (async)
- **Source:** `app/api/v1/endpoints/media.py`:358
- **Defined path:** `/files`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `action` | `str` | `Query('list', alias='Action')` | `query` | {'arg': "'list'", 'alias': "'Action'"} |
| `id` | `Optional[int]` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `ids` | `Optional[str]` | `Query(None, alias='Ids')` | `query` | {'arg': 'None', 'alias': "'Ids'"} |
| `user_id` | `Optional[int]` | `Query(None, alias='UserId')` | `query` | {'arg': 'None', 'alias': "'UserId'"} |
| `folder_id` | `Optional[int]` | `Query(None, alias='FolderId')` | `query` | {'arg': 'None', 'alias': "'FolderId'"} |
| `root` | `bool` | `Query(False, alias='Root')` | `query` | {'arg': 'False', 'alias': "'Root'"} |
| `search` | `Optional[str]` | `Query(None, alias='Search')` | `query` | {'arg': 'None', 'alias': "'Search'"} |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(50, ge=1, le=200)` | `query` | {'arg': '50', 'ge': '1', 'le': '200'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete via ``Action=delete``; otherwise fall back to a read-only listing.
```

#### 3. `POST` `/api/v1/media/files`

- **Handler:** `files_action` (async)
- **Source:** `app/api/v1/endpoints/media.py`:185
- **Defined path:** `/files`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `MediaFileAction` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Single entry point for listing, creating and updating files.
```

#### 4. `POST` `/api/v1/media/files/delete`

- **Handler:** `media_files_delete` (async)
- **Source:** `app/api/v1/endpoints/media.py`:1039
- **Defined path:** `/files/delete`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `MediaFileDeleteResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `MediaFileDeleteRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete one or many media files: Google Drive object first, then the row.
```

#### 5. `POST` `/api/v1/media/files/list`

- **Handler:** `media_files_list` (async)
- **Source:** `app/api/v1/endpoints/media.py`:930
- **Defined path:** `/files/list`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `MediaFileListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `MediaFileListRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Files table query: search / filter / sort / paginate.
```

#### 6. `POST` `/api/v1/media/files/upload`

- **Handler:** `upload_file` (async)
- **Source:** `app/api/v1/endpoints/media.py`:295
- **Defined path:** `/files/upload`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `MediaFileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `folder_id` | `Optional[int]` | `Form(None, alias='FolderId')` | `form` | {'arg': 'None', 'alias': "'FolderId'"} |
| `is_public` | `int` | `Form(1, alias='IsPublic')` | `form` | {'arg': '1', 'alias': "'IsPublic'"} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Upload bytes to Google Drive and record the metadata in ``MEDIA_FILES``.
```

#### 7. `GET` `/api/v1/media/files/{file_id}`

- **Handler:** `get_file` (async)
- **Source:** `app/api/v1/endpoints/media.py`:428
- **Defined path:** `/files/{file_id}`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `MediaFileRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `file_id` | `int` | `` | `path` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 8. `GET` `/api/v1/media/folders`

- **Handler:** `folders_get` (async)
- **Source:** `app/api/v1/endpoints/media.py`:532
- **Defined path:** `/folders`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `action` | `str` | `Query('list', alias='Action')` | `query` | {'arg': "'list'", 'alias': "'Action'"} |
| `id` | `Optional[int]` | `Query(None, alias='Id')` | `query` | {'arg': 'None', 'alias': "'Id'"} |
| `ids` | `Optional[str]` | `Query(None, alias='Ids')` | `query` | {'arg': 'None', 'alias': "'Ids'"} |
| `user_id` | `Optional[int]` | `Query(None, alias='UserId')` | `query` | {'arg': 'None', 'alias': "'UserId'"} |
| `parent_id` | `Optional[int]` | `Query(None, alias='ParentId')` | `query` | {'arg': 'None', 'alias': "'ParentId'"} |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(200, ge=1, le=200)` | `query` | {'arg': '200', 'ge': '1', 'le': '200'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Delete via ``Action=delete``; otherwise fall back to a read-only listing.
```

#### 9. `POST` `/api/v1/media/folders`

- **Handler:** `folders_action` (async)
- **Source:** `app/api/v1/endpoints/media.py`:444
- **Defined path:** `/folders`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `None`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `MediaFolderAction` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Single entry point for listing, creating and updating folders.
```

#### 10. `POST` `/api/v1/media/folders/star`

- **Handler:** `media_folder_star` (async)
- **Source:** `app/api/v1/endpoints/media.py`:1074
- **Defined path:** `/folders/star`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `MediaFolderStarResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `MediaFolderStarRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
Star / unstar a media folder.
```

#### 11. `GET` `/api/v1/media/types`

- **Handler:** `list_types` (async)
- **Source:** `app/api/v1/endpoints/media.py`:591
- **Defined path:** `/types`
- **Router:** object=`router` prefix=`/media` resolved_base=`/api/v1/media`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Media in File Explore Management']`
- **Response model:** `list[MediaTypeRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## Memberships

- **Source files:** `app/api/v1/endpoints/memberships.py`
- **Endpoints:** 3
- **Mount/status:** mounted (/api/v1 router) (3)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/memberships/join` | `join_membership` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/memberships/payments/{payment_id}/complete` | `complete_payment` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/memberships/payments/{payment_id}/confirm` | `complete_payment` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/memberships/join`

- **Handler:** `join_membership` (async)
- **Source:** `app/api/v1/endpoints/memberships.py`:70
- **Defined path:** `/join`
- **Router:** object=`router` prefix=`/memberships` resolved_base=`/api/v1/memberships`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Memberships']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `JoinPlanRequest` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `POST` `/api/v1/memberships/payments/{payment_id}/complete`

- **Handler:** `complete_payment` (async)
- **Source:** `app/api/v1/endpoints/memberships.py`:172
- **Defined path:** `/payments/{payment_id}/complete`
- **Router:** object=`router` prefix=`/memberships` resolved_base=`/api/v1/memberships`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Memberships']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payment_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 3. `POST` `/api/v1/memberships/payments/{payment_id}/confirm`

- **Handler:** `complete_payment` (async)
- **Source:** `app/api/v1/endpoints/memberships.py`:172
- **Defined path:** `/payments/{payment_id}/confirm`
- **Router:** object=`router` prefix=`/memberships` resolved_base=`/api/v1/memberships`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Memberships']`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payment_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## Messaging

- **Source files:** `app/api/v1/endpoints/messaging.py`
- **Endpoints:** 10
- **Mount/status:** mounted (/api/v1 router) (10)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/messaging/chat_monitor/active_users` | `get_active_users` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/messaging/chat_monitor/top_conversations` | `get_top_conversations` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/messaging/conversation` | `get_conversation` |  | mounted (/api/v1 router) |
| 4 | `GET` | `/api/v1/messaging/conversations` | `conversations_get_list` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/messaging/conversations` | `list_conversations` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/messaging/mark-read` | `mark_messages_read` |  | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/messaging/notifications/list` | `list_notifications` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/messaging/notifications/mark-all-read` | `mark_all_notifications_read` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/messaging/notifications/mark-read` | `mark_notification_read` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/messaging/send` | `send_message` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/messaging/chat_monitor/active_users`

- **Handler:** `get_active_users` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:74
- **Defined path:** `/chat_monitor/active_users`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `limit` | `int` | `Query(10, ge=1, le=50)` | `query` | {'arg': '10', 'ge': '1', 'le': '50'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Get recently active users in chat for the current user.
```

#### 2. `POST` `/api/v1/messaging/chat_monitor/top_conversations`

- **Handler:** `get_top_conversations` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:22
- **Defined path:** `/chat_monitor/top_conversations`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `limit` | `int` | `Query(10, ge=1, le=50)` | `query` | {'arg': '10', 'ge': '1', 'le': '50'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Get top conversations by message count for the current user (admin sees all).
```

#### 3. `POST` `/api/v1/messaging/conversation`

- **Handler:** `get_conversation` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:250
- **Defined path:** `/conversation`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`
- **Response model:** `PaginatedResponse[MessageOut]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `other_user_id` | `int` | `` | `` |  |
| `pagination` | `PaginationParams` | `Depends()` | `dependency` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Retrieve paginated DM history between the current user and another user.
```

#### 4. `GET` `/api/v1/messaging/conversations`

- **Handler:** `conversations_get_list` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:382
- **Defined path:** `/conversations`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 5. `GET` `/api/v1/messaging/conversations`

- **Handler:** `list_conversations` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:162
- **Defined path:** `/conversations`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `limit` | `int` | `Query(100, ge=1, le=200)` | `query` | {'arg': '100', 'ge': '1', 'le': '200'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
List chat rooms/conversations the current user participates in.
```

#### 6. `POST` `/api/v1/messaging/mark-read`

- **Handler:** `mark_messages_read` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:294
- **Defined path:** `/mark-read`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `sender_id` | `int` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `POST` `/api/v1/messaging/notifications/list`

- **Handler:** `list_notifications` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:312
- **Defined path:** `/notifications/list`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`
- **Response model:** `PaginatedResponse[NotificationRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `unread_only` | `bool` | `False` | `` |  |
| `pagination` | `PaginationParams` | `Depends()` | `dependency` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 8. `POST` `/api/v1/messaging/notifications/mark-all-read`

- **Handler:** `mark_all_notifications_read` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:364
- **Defined path:** `/notifications/mark-all-read`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 9. `POST` `/api/v1/messaging/notifications/mark-read`

- **Handler:** `mark_notification_read` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:347
- **Defined path:** `/notifications/mark-read`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `notification_id` | `int` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `POST` `/api/v1/messaging/send`

- **Handler:** `send_message` (async)
- **Source:** `app/api/v1/endpoints/messaging.py`:214
- **Defined path:** `/send`
- **Router:** object=`router` prefix=`/messaging` resolved_base=`/api/v1/messaging`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Messaging']`
- **Status code:** `201`
- **Response model:** `MessageOut`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `SendMessageRequest` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Send a direct message or post to a chat room.
```

---

## Moderation

- **Source files:** `app/api/v1/endpoints/moderation.py`
- **Endpoints:** 6
- **Mount/status:** mounted (/api/v1 router) (6)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/moderation/cases` | `list_cases` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/moderation/cases/{case_id}` | `get_case` |  | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/moderation/reports` | `list_reports` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/moderation/reports` | `create_report` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/moderation/reports/{report_id}` | `get_report` |  | mounted (/api/v1 router) |
| 6 | `PATCH` | `/api/v1/moderation/reports/{report_id}/review` | `review_report` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/moderation/cases`

- **Handler:** `list_cases` (async)
- **Source:** `app/api/v1/endpoints/moderation.py`:110
- **Defined path:** `/cases`
- **Router:** object=`router` prefix=`/moderation` resolved_base=`/api/v1/moderation`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Moderation']`
- **Response model:** `PaginatedResponse[ModerationCaseRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `open_only` | `bool` | `Query(True)` | `query` | {'arg': 'True'} |
| `svc` | `ModerationCaseService` | `Depends(_case_svc)` | `dependency` | {'arg': '_case_svc'} |

#### 2. `GET` `/api/v1/moderation/cases/{case_id}`

- **Handler:** `get_case` (async)
- **Source:** `app/api/v1/endpoints/moderation.py`:129
- **Defined path:** `/cases/{case_id}`
- **Router:** object=`router` prefix=`/moderation` resolved_base=`/api/v1/moderation`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Moderation']`
- **Response model:** `ModerationCaseRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `case_id` | `int` | `` | `path` |  |
| `svc` | `ModerationCaseService` | `Depends(_case_svc)` | `dependency` | {'arg': '_case_svc'} |

#### 3. `GET` `/api/v1/moderation/reports`

- **Handler:** `list_reports` (async)
- **Source:** `app/api/v1/endpoints/moderation.py`:52
- **Defined path:** `/reports`
- **Router:** object=`router` prefix=`/moderation` resolved_base=`/api/v1/moderation`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Moderation']`
- **Response model:** `PaginatedResponse[ReportRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `pending_only` | `bool` | `Query(False)` | `query` | {'arg': 'False'} |
| `svc` | `ReportService` | `Depends(_rep_svc)` | `dependency` | {'arg': '_rep_svc'} |

#### 4. `POST` `/api/v1/moderation/reports`

- **Handler:** `create_report` (async)
- **Source:** `app/api/v1/endpoints/moderation.py`:71
- **Defined path:** `/reports`
- **Router:** object=`router` prefix=`/moderation` resolved_base=`/api/v1/moderation`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Moderation']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ReportCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `ReportService` | `Depends(_rep_svc)` | `dependency` | {'arg': '_rep_svc'} |

#### 5. `GET` `/api/v1/moderation/reports/{report_id}`

- **Handler:** `get_report` (async)
- **Source:** `app/api/v1/endpoints/moderation.py`:83
- **Defined path:** `/reports/{report_id}`
- **Router:** object=`router` prefix=`/moderation` resolved_base=`/api/v1/moderation`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Moderation']`
- **Response model:** `ReportRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `report_id` | `int` | `` | `path` |  |
| `svc` | `ReportService` | `Depends(_rep_svc)` | `dependency` | {'arg': '_rep_svc'} |

#### 6. `PATCH` `/api/v1/moderation/reports/{report_id}/review`

- **Handler:** `review_report` (async)
- **Source:** `app/api/v1/endpoints/moderation.py`:91
- **Defined path:** `/reports/{report_id}/review`
- **Router:** object=`router` prefix=`/moderation` resolved_base=`/api/v1/moderation`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Moderation']`
- **Response model:** `ReportRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `report_id` | `int` | `` | `path` |  |
| `new_status` | `int` | `Query(..., alias='Status')` | `query` | {'arg': '...', 'alias': "'Status'"} |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `ReportService` | `Depends(_rep_svc)` | `dependency` | {'arg': '_rep_svc'} |

---

## Notifications & Localization

- **Source files:** `app/api/v1/endpoints/notifications.py`
- **Endpoints:** 17
- **Mount/status:** mounted (/api/v1 router) (17)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/localization/countries` | `list_countries` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/localization/languages` | `list_languages` |  | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/notification/clearall` | `notification_delete_all` | Clear all notifications | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/notification/countunread` | `notification_count_unread` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/notification/countunreadbyappmodes` | `notification_count_unread_by_app_modes` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/notification/createtoken` | `notification_create_token` |  | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/notification/delete` | `notification_delete` |  | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/notification/get` | `notification_list` | Get all notification list , POST | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/notification/markallasread` | `notification_mark_all_as_read` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/notification/markasread` | `notification_mark_as_read` |  | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/notification/markasreadbytype` | `notification_mark_as_read_by_type` |  | mounted (/api/v1 router) |
| 12 | `GET` | `/api/v1/notifications/clear` | `delete_notification` |  | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/notifications/clear` | `clear_notifications` |  | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/notifications/list` | `list_notifications` | Get all list , list unread only | mounted (/api/v1 router) |
| 15 | `POST` | `/api/v1/notifications/read` | `mark_as_read` |  | mounted (/api/v1 router) |
| 16 | `POST` | `/api/v1/notifications/read_all` | `mark_all_as_read` |  | mounted (/api/v1 router) |
| 17 | `POST` | `/api/v1/phone_code` | `list_phone_codes` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/localization/countries`

- **Handler:** `list_countries` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:354
- **Defined path:** `/countries`
- **Router:** object=`locale_router` prefix=`/localization` resolved_base=`/api/v1/localization`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Localization']`
- **Response model:** `list[CountryRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `GET` `/api/v1/localization/languages`

- **Handler:** `list_languages` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:372
- **Defined path:** `/languages`
- **Router:** object=`locale_router` prefix=`/localization` resolved_base=`/api/v1/localization`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Localization']`
- **Response model:** `list[LanguageRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `GET` `/api/v1/notification/clearall`

- **Handler:** `notification_delete_all` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:319
- **Defined path:** `/clearall`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Summary:** Clear all notifications
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 4. `POST` `/api/v1/notification/countunread`

- **Handler:** `notification_count_unread` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:239
- **Defined path:** `/countunread`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `NotificationCountResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 5. `POST` `/api/v1/notification/countunreadbyappmodes`

- **Handler:** `notification_count_unread_by_app_modes` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:340
- **Defined path:** `/countunreadbyappmodes`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `NotificationCountByModeResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 6. `POST` `/api/v1/notification/createtoken`

- **Handler:** `notification_create_token` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:276
- **Defined path:** `/createtoken`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `NotificationTokenRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NotificationTokenCreate` | `` | `` |  |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationTokenService` | `Depends(_token_svc)` | `dependency` | {'arg': '_token_svc'} |

#### 7. `GET` `/api/v1/notification/delete`

- **Handler:** `notification_delete` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:306
- **Defined path:** `/delete`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., alias='Id')` | `query` | {'arg': '...', 'alias': "'Id'"} |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 8. `POST` `/api/v1/notification/get`

- **Handler:** `notification_list` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:217
- **Defined path:** `/get`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Summary:** Get all notification list , POST
- **Response model:** `list[NotificationRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NotificationListRequest` | `` | `` |  |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 9. `POST` `/api/v1/notification/markallasread`

- **Handler:** `notification_mark_all_as_read` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:248
- **Defined path:** `/markallasread`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 10. `POST` `/api/v1/notification/markasread`

- **Handler:** `notification_mark_as_read` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:260
- **Defined path:** `/markasread`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `NotificationRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NotificationActionRequest` | `` | `` |  |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 11. `POST` `/api/v1/notification/markasreadbytype`

- **Handler:** `notification_mark_as_read_by_type` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:330
- **Defined path:** `/markasreadbytype`
- **Router:** object=`notification_router` prefix=`/notification` resolved_base=`/api/v1/notification`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `TypeCode` | `str` | `Query(..., alias='TypeCode')` | `query` | {'arg': '...', 'alias': "'TypeCode'"} |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 12. `GET` `/api/v1/notifications/clear`

- **Handler:** `delete_notification` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:155
- **Defined path:** `/clear`
- **Router:** object=`router` prefix=`/notifications` resolved_base=`/api/v1/notifications`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NotificationActionRequest` | `` | `` |  |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 13. `POST` `/api/v1/notifications/clear`

- **Handler:** `clear_notifications` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:168
- **Defined path:** `/clear`
- **Router:** object=`router` prefix=`/notifications` resolved_base=`/api/v1/notifications`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 14. `POST` `/api/v1/notifications/list`

- **Handler:** `list_notifications` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:116
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/notifications` resolved_base=`/api/v1/notifications`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Summary:** Get all list , list unread only
- **Response model:** `list[NotificationRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `unread_only` | `bool` | `Query(False, alias='UnreadOnly')` | `query` | {'arg': 'False', 'alias': "'UnreadOnly'"} |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 15. `POST` `/api/v1/notifications/read`

- **Handler:** `mark_as_read` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:127
- **Defined path:** `/read`
- **Router:** object=`router` prefix=`/notifications` resolved_base=`/api/v1/notifications`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `NotificationRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NotificationActionRequest` | `` | `` |  |
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 16. `POST` `/api/v1/notifications/read_all`

- **Handler:** `mark_all_as_read` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:143
- **Defined path:** `/read_all`
- **Router:** object=`router` prefix=`/notifications` resolved_base=`/api/v1/notifications`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Notifications']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NotificationService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 17. `POST` `/api/v1/phone_code`

- **Handler:** `list_phone_codes` (async)
- **Source:** `app/api/v1/endpoints/notifications.py`:395
- **Defined path:** ``
- **Router:** object=`phone_code_router` prefix=`/phone_code` resolved_base=`/api/v1/phone_code`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Localization']`
- **Response model:** `list[PhoneCodeItem]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Novels, Authors & Genres

- **Source files:** `app/api/v1/endpoints/novels.py`
- **Endpoints:** 32
- **Mount/status:** mounted (/api/v1 router) (32)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/authors/create` | `create_author` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/authors/delete` | `delete_author` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/authors/get` | `get_author` |  | mounted (/api/v1 router) |
| 4 | `POST` | `/api/v1/authors/list` | `list_authors` |  | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/authors/slug/get` | `get_author_by_slug` |  | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/authors/update` | `update_author` |  | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/novel_genres/create` | `create_genre` |  | mounted (/api/v1 router) |
| 8 | `GET` | `/api/v1/novel_genres/delete` | `delete_genre` |  | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/novel_genres/get` | `get_genre` |  | mounted (/api/v1 router) |
| 10 | `POST` | `/api/v1/novel_genres/list` | `list_genres` |  | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/novel_genres/update` | `update_genre` |  | mounted (/api/v1 router) |
| 12 | `POST` | `/api/v1/novels/chapters/create` | `create_chapter` |  | mounted (/api/v1 router) |
| 13 | `GET` | `/api/v1/novels/chapters/delete` | `delete_chapter` |  | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/novels/chapters/get` | `get_chapter` |  | mounted (/api/v1 router) |
| 15 | `POST` | `/api/v1/novels/chapters/list` | `list_chapters` |  | mounted (/api/v1 router) |
| 16 | `POST` | `/api/v1/novels/chapters/revisions/get` | `get_chapter_revision` |  | mounted (/api/v1 router) |
| 17 | `POST` | `/api/v1/novels/chapters/revisions/list` | `list_chapter_revisions` |  | mounted (/api/v1 router) |
| 18 | `POST` | `/api/v1/novels/chapters/revisions/restore` | `restore_chapter_revision` |  | mounted (/api/v1 router) |
| 19 | `POST` | `/api/v1/novels/chapters/update` | `update_chapter` |  | mounted (/api/v1 router) |
| 20 | `POST` | `/api/v1/novels/create` | `create_novel` |  | mounted (/api/v1 router) |
| 21 | `GET` | `/api/v1/novels/delete` | `delete_novel` |  | mounted (/api/v1 router) |
| 22 | `POST` | `/api/v1/novels/featured/list` | `list_featured_novels` |  | mounted (/api/v1 router) |
| 23 | `POST` | `/api/v1/novels/get` | `get_novel` |  | mounted (/api/v1 router) |
| 24 | `POST` | `/api/v1/novels/list` | `list_novels` |  | mounted (/api/v1 router) |
| 25 | `POST` | `/api/v1/novels/slug/get` | `get_novel_by_slug` |  | mounted (/api/v1 router) |
| 26 | `GET` | `/api/v1/novels/slug/{slug}` | `get_novel_by_slug_path` |  | mounted (/api/v1 router) |
| 27 | `POST` | `/api/v1/novels/update` | `update_novel` |  | mounted (/api/v1 router) |
| 28 | `POST` | `/api/v1/novels/volumes/create` | `create_volume` |  | mounted (/api/v1 router) |
| 29 | `GET` | `/api/v1/novels/volumes/delete` | `delete_volume` |  | mounted (/api/v1 router) |
| 30 | `POST` | `/api/v1/novels/volumes/get` | `get_volume` |  | mounted (/api/v1 router) |
| 31 | `POST` | `/api/v1/novels/volumes/list` | `list_volumes` |  | mounted (/api/v1 router) |
| 32 | `POST` | `/api/v1/novels/volumes/update` | `update_volume` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/authors/create`

- **Handler:** `create_author` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:353
- **Defined path:** `/create`
- **Router:** object=`author_router` prefix=`/authors` resolved_base=`/api/v1/authors`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authors']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `AuthorCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends()` | `dependency` |  |
| `svc` | `AuthorService` | `Depends(_author_svc)` | `dependency` | {'arg': '_author_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `GET` `/api/v1/authors/delete`

- **Handler:** `delete_author` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:415
- **Defined path:** `/delete`
- **Router:** object=`author_router` prefix=`/authors` resolved_base=`/api/v1/authors`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authors']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., ge=1)` | `query` | {'arg': '...', 'ge': '1'} |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `AuthorService` | `Depends(_author_svc)` | `dependency` | {'arg': '_author_svc'} |

#### 3. `POST` `/api/v1/authors/get`

- **Handler:** `get_author` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:337
- **Defined path:** `/get`
- **Router:** object=`author_router` prefix=`/authors` resolved_base=`/api/v1/authors`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authors']`
- **Response model:** `AuthorRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `IdPayload` | `` | `` |  |
| `svc` | `AuthorService` | `Depends(_author_svc)` | `dependency` | {'arg': '_author_svc'} |

#### 4. `POST` `/api/v1/authors/list`

- **Handler:** `list_authors` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:307
- **Defined path:** `/list`
- **Router:** object=`author_router` prefix=`/authors` resolved_base=`/api/v1/authors`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authors']`
- **Response model:** `list[AuthorRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `AuthorListPayload` | `` | `` |  |
| `svc` | `AuthorService` | `Depends(_author_svc)` | `dependency` | {'arg': '_author_svc'} |

#### 5. `POST` `/api/v1/authors/slug/get`

- **Handler:** `get_author_by_slug` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:345
- **Defined path:** `/slug/get`
- **Router:** object=`author_router` prefix=`/authors` resolved_base=`/api/v1/authors`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authors']`
- **Response model:** `AuthorRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `SlugPayload` | `` | `` |  |
| `svc` | `AuthorService` | `Depends(_author_svc)` | `dependency` | {'arg': '_author_svc'} |

#### 6. `POST` `/api/v1/authors/update`

- **Handler:** `update_author` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:381
- **Defined path:** `/update`
- **Router:** object=`author_router` prefix=`/authors` resolved_base=`/api/v1/authors`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Authors']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `AuthorUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `AuthorService` | `Depends(_author_svc)` | `dependency` | {'arg': '_author_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `POST` `/api/v1/novel_genres/create`

- **Handler:** `create_genre` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:947
- **Defined path:** `/create`
- **Router:** object=`genre_router` prefix=`/novel_genres` resolved_base=`/api/v1/novel_genres`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novel Genres']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelGenreCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `NovelGenreService` | `Depends(_genre_svc)` | `dependency` | {'arg': '_genre_svc'} |

#### 8. `GET` `/api/v1/novel_genres/delete`

- **Handler:** `delete_genre` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:992
- **Defined path:** `/delete`
- **Router:** object=`genre_router` prefix=`/novel_genres` resolved_base=`/api/v1/novel_genres`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novel Genres']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., ge=1)` | `query` | {'arg': '...', 'ge': '1'} |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `NovelGenreService` | `Depends(_genre_svc)` | `dependency` | {'arg': '_genre_svc'} |

#### 9. `POST` `/api/v1/novel_genres/get`

- **Handler:** `get_genre` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:962
- **Defined path:** `/get`
- **Router:** object=`genre_router` prefix=`/novel_genres` resolved_base=`/api/v1/novel_genres`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novel Genres']`
- **Response model:** `NovelGenreRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `IdPayload` | `` | `` |  |
| `svc` | `NovelGenreService` | `Depends(_genre_svc)` | `dependency` | {'arg': '_genre_svc'} |

#### 10. `POST` `/api/v1/novel_genres/list`

- **Handler:** `list_genres` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:937
- **Defined path:** `/list`
- **Router:** object=`genre_router` prefix=`/novel_genres` resolved_base=`/api/v1/novel_genres`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novel Genres']`
- **Response model:** `list[NovelGenreRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelGenreListPayload` | `` | `` |  |
| `svc` | `NovelGenreService` | `Depends(_genre_svc)` | `dependency` | {'arg': '_genre_svc'} |

#### 11. `POST` `/api/v1/novel_genres/update`

- **Handler:** `update_genre` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:970
- **Defined path:** `/update`
- **Router:** object=`genre_router` prefix=`/novel_genres` resolved_base=`/api/v1/novel_genres`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novel Genres']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelGenreUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `NovelGenreService` | `Depends(_genre_svc)` | `dependency` | {'arg': '_genre_svc'} |

#### 12. `POST` `/api/v1/novels/chapters/create`

- **Handler:** `create_chapter` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:681
- **Defined path:** `/chapters/create`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelChapterCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `volume_svc` | `NovelVolumeService` | `Depends(_volume_svc)` | `dependency` | {'arg': '_volume_svc'} |
| `svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 13. `GET` `/api/v1/novels/chapters/delete`

- **Handler:** `delete_chapter` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:852
- **Defined path:** `/chapters/delete`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., ge=1)` | `query` | {'arg': '...', 'ge': '1'} |
| `NovelId` | `int` | `Query(..., ge=1)` | `query` | {'arg': '...', 'ge': '1'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 14. `POST` `/api/v1/novels/chapters/get`

- **Handler:** `get_chapter` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:741
- **Defined path:** `/chapters/get`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `NovelChapterDetailRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `IdPayload` | `` | `` |  |
| `svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |

#### 15. `POST` `/api/v1/novels/chapters/list`

- **Handler:** `list_chapters` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:645
- **Defined path:** `/chapters/list`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `list[NovelChapterRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelChapterListPayload` | `` | `` |  |
| `svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |

#### 16. `POST` `/api/v1/novels/chapters/revisions/get`

- **Handler:** `get_chapter_revision` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:901
- **Defined path:** `/chapters/revisions/get`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `ChapterRevisionRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ChapterRevisionGetPayload` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `chapter_svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |

#### 17. `POST` `/api/v1/novels/chapters/revisions/list`

- **Handler:** `list_chapter_revisions` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:885
- **Defined path:** `/chapters/revisions/list`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `list[ChapterRevisionRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ChapterRevisionListPayload` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `chapter_svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |

#### 18. `POST` `/api/v1/novels/chapters/revisions/restore`

- **Handler:** `restore_chapter_revision` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:916
- **Defined path:** `/chapters/revisions/restore`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `NovelChapterDetailRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ChapterRevisionGetPayload` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `chapter_svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |

#### 19. `POST` `/api/v1/novels/chapters/update`

- **Handler:** `update_chapter` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:752
- **Defined path:** `/chapters/update`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelChapterUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `volume_svc` | `NovelVolumeService` | `Depends(_volume_svc)` | `dependency` | {'arg': '_volume_svc'} |
| `svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 20. `POST` `/api/v1/novels/create`

- **Handler:** `create_novel` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:455
- **Defined path:** `/create`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 21. `GET` `/api/v1/novels/delete`

- **Handler:** `delete_novel` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:549
- **Defined path:** `/delete`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., ge=1)` | `query` | {'arg': '...', 'ge': '1'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `chapter_svc` | `NovelChapterService` | `Depends(_chapter_svc)` | `dependency` | {'arg': '_chapter_svc'} |
| `content_store` | `NovelChapterContentStore` | `Depends(get_novel_chapter_content)` | `dependency` | {'arg': 'get_novel_chapter_content'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 22. `POST` `/api/v1/novels/featured/list`

- **Handler:** `list_featured_novels` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:488
- **Defined path:** `/featured/list`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `list[NovelRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelListPayload` | `` | `` |  |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 23. `POST` `/api/v1/novels/get`

- **Handler:** `get_novel` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:498
- **Defined path:** `/get`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `NovelRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `IdPayload` | `` | `` |  |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 24. `POST` `/api/v1/novels/list`

- **Handler:** `list_novels` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:430
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `list[NovelRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelListPayload` | `` | `` |  |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 25. `POST` `/api/v1/novels/slug/get`

- **Handler:** `get_novel_by_slug` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:503
- **Defined path:** `/slug/get`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `NovelRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `SlugPayload` | `` | `` |  |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 26. `GET` `/api/v1/novels/slug/{slug}`

- **Handler:** `get_novel_by_slug_path` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:511
- **Defined path:** `/slug/{slug}`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `NovelRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 27. `POST` `/api/v1/novels/update`

- **Handler:** `update_novel` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:519
- **Defined path:** `/update`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelUpdatePayload` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 28. `POST` `/api/v1/novels/volumes/create`

- **Handler:** `create_volume` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:582
- **Defined path:** `/volumes/create`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelVolumeCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `svc` | `NovelVolumeService` | `Depends(_volume_svc)` | `dependency` | {'arg': '_volume_svc'} |

#### 29. `GET` `/api/v1/novels/volumes/delete`

- **Handler:** `delete_volume` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:629
- **Defined path:** `/volumes/delete`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `Id` | `int` | `Query(..., ge=1)` | `query` | {'arg': '...', 'ge': '1'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `svc` | `NovelVolumeService` | `Depends(_volume_svc)` | `dependency` | {'arg': '_volume_svc'} |

#### 30. `POST` `/api/v1/novels/volumes/get`

- **Handler:** `get_volume` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:600
- **Defined path:** `/volumes/get`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `NovelVolumeRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `IdPayload` | `` | `` |  |
| `svc` | `NovelVolumeService` | `Depends(_volume_svc)` | `dependency` | {'arg': '_volume_svc'} |

#### 31. `POST` `/api/v1/novels/volumes/list`

- **Handler:** `list_volumes` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:572
- **Defined path:** `/volumes/list`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `list[NovelVolumeRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelVolumeListPayload` | `` | `` |  |
| `svc` | `NovelVolumeService` | `Depends(_volume_svc)` | `dependency` | {'arg': '_volume_svc'} |

#### 32. `POST` `/api/v1/novels/volumes/update`

- **Handler:** `update_volume` (async)
- **Source:** `app/api/v1/endpoints/novels.py`:605
- **Defined path:** `/volumes/update`
- **Router:** object=`router` prefix=`/novels` resolved_base=`/api/v1/novels`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Novels']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `NovelVolumeUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `novel_svc` | `NovelService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |
| `svc` | `NovelVolumeService` | `Depends(_volume_svc)` | `dependency` | {'arg': '_volume_svc'} |

---

## Posts, Categories, Tags & Series

- **Source files:** `app/api/v1/endpoints/posts.py`
- **Endpoints:** 23
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py) (23)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/categories` | `create_category` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 2 | `POST` | `/api/v1/categories/list` | `list_categories` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 3 | `DELETE` | `/api/v1/categories/{cat_id}` | `delete_category` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 4 | `GET` | `/api/v1/categories/{cat_id}` | `get_category` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 5 | `PATCH` | `/api/v1/categories/{cat_id}` | `update_category` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 6 | `POST` | `/api/v1/posts` | `create_post` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 7 | `POST` | `/api/v1/posts/featured/list` | `list_featured_posts` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 8 | `POST` | `/api/v1/posts/list` | `list_posts` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 9 | `GET` | `/api/v1/posts/slug/{slug}` | `get_post_by_slug` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 10 | `DELETE` | `/api/v1/posts/{post_id}` | `delete_post` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 11 | `GET` | `/api/v1/posts/{post_id}` | `get_post` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 12 | `PATCH` | `/api/v1/posts/{post_id}` | `update_post` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 13 | `POST` | `/api/v1/posts/{post_id}/bookmarks` | `bookmark_post` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 14 | `DELETE` | `/api/v1/posts/{post_id}/bookmarks/{bookmark_id}` | `remove_bookmark` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 15 | `POST` | `/api/v1/posts/{post_id}/reactions` | `add_reaction` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 16 | `POST` | `/api/v1/posts/{post_id}/reactions/list` | `list_reactions` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 17 | `POST` | `/api/v1/series` | `create_series` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 18 | `POST` | `/api/v1/series/list` | `list_series` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 19 | `DELETE` | `/api/v1/series/{series_id}` | `delete_series` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 20 | `GET` | `/api/v1/series/{series_id}` | `get_series` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 21 | `POST` | `/api/v1/tags` | `create_tag` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 22 | `POST` | `/api/v1/tags/list` | `list_tags` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 23 | `DELETE` | `/api/v1/tags/{tag_id}` | `delete_tag` |  | DEFINED (mount inferred under /api/v1; verify router.py) |

### Endpoint details

#### 1. `POST` `/api/v1/categories`

- **Handler:** `create_category` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:218
- **Defined path:** ``
- **Router:** object=`cat_router` prefix=`/categories` resolved_base=`/api/v1/categories`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Categories']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `PostCategoryCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `PostCategoryService` | `Depends(_cat_svc)` | `dependency` | {'arg': '_cat_svc'} |

#### 2. `POST` `/api/v1/categories/list`

- **Handler:** `list_categories` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:204
- **Defined path:** `/list`
- **Router:** object=`cat_router` prefix=`/categories` resolved_base=`/api/v1/categories`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Categories']`
- **Response model:** `PaginatedResponse[PostCategoryRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ListRequest` | `` | `` |  |
| `svc` | `PostCategoryService` | `Depends(_cat_svc)` | `dependency` | {'arg': '_cat_svc'} |

#### 3. `DELETE` `/api/v1/categories/{cat_id}`

- **Handler:** `delete_category` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:254
- **Defined path:** `/{cat_id}`
- **Router:** object=`cat_router` prefix=`/categories` resolved_base=`/api/v1/categories`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Categories']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `cat_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `PostCategoryService` | `Depends(_cat_svc)` | `dependency` | {'arg': '_cat_svc'} |

#### 4. `GET` `/api/v1/categories/{cat_id}`

- **Handler:** `get_category` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:231
- **Defined path:** `/{cat_id}`
- **Router:** object=`cat_router` prefix=`/categories` resolved_base=`/api/v1/categories`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Categories']`
- **Response model:** `PostCategoryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `cat_id` | `int` | `` | `path` |  |
| `svc` | `PostCategoryService` | `Depends(_cat_svc)` | `dependency` | {'arg': '_cat_svc'} |

#### 5. `PATCH` `/api/v1/categories/{cat_id}`

- **Handler:** `update_category` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:239
- **Defined path:** `/{cat_id}`
- **Router:** object=`cat_router` prefix=`/categories` resolved_base=`/api/v1/categories`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Categories']`
- **Response model:** `PostCategoryRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `cat_id` | `int` | `` | `path` |  |
| `body` | `PostCategoryUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `PostCategoryService` | `Depends(_cat_svc)` | `dependency` | {'arg': '_cat_svc'} |

#### 6. `POST` `/api/v1/posts`

- **Handler:** `create_post` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:58
- **Defined path:** ``
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `PostCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `PostService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 7. `POST` `/api/v1/posts/featured/list`

- **Handler:** `list_featured_posts` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:72
- **Defined path:** `/featured/list`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `PaginatedResponse[PostRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ListRequest` | `` | `` |  |
| `svc` | `PostService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 8. `POST` `/api/v1/posts/list`

- **Handler:** `list_posts` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:34
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `PaginatedResponse[PostRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `PostListRequest` | `` | `` |  |
| `svc` | `PostService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 9. `GET` `/api/v1/posts/slug/{slug}`

- **Handler:** `get_post_by_slug` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:86
- **Defined path:** `/slug/{slug}`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `PostRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `svc` | `PostService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 10. `DELETE` `/api/v1/posts/{post_id}`

- **Handler:** `delete_post` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:119
- **Defined path:** `/{post_id}`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `PostService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 11. `GET` `/api/v1/posts/{post_id}`

- **Handler:** `get_post` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:94
- **Defined path:** `/{post_id}`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `PostRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `` | `path` |  |
| `svc` | `PostService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 12. `PATCH` `/api/v1/posts/{post_id}`

- **Handler:** `update_post` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:102
- **Defined path:** `/{post_id}`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `PostRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `` | `path` |  |
| `body` | `PostUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `svc` | `PostService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 13. `POST` `/api/v1/posts/{post_id}/bookmarks`

- **Handler:** `bookmark_post` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:169
- **Defined path:** `/{post_id}/bookmarks`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 14. `DELETE` `/api/v1/posts/{post_id}/bookmarks/{bookmark_id}`

- **Handler:** `remove_bookmark` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:180
- **Defined path:** `/{post_id}/bookmarks/{bookmark_id}`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `` | `path` |  |
| `bookmark_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 15. `POST` `/api/v1/posts/{post_id}/reactions`

- **Handler:** `add_reaction` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:152
- **Defined path:** `/{post_id}/reactions`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `` | `path` |  |
| `body` | `PostReactionCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 16. `POST` `/api/v1/posts/{post_id}/reactions/list`

- **Handler:** `list_reactions` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:136
- **Defined path:** `/{post_id}/reactions/list`
- **Router:** object=`router` prefix=`/posts` resolved_base=`/api/v1/posts`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Posts']`
- **Response model:** `PaginatedResponse[PostReactionRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `post_id` | `int` | `` | `path` |  |
| `body` | `ListRequest` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 17. `POST` `/api/v1/series`

- **Handler:** `create_series` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:339
- **Defined path:** ``
- **Router:** object=`series_router` prefix=`/series` resolved_base=`/api/v1/series`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Series']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `PostSeriesCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `PostSeriesService` | `Depends(_series_svc)` | `dependency` | {'arg': '_series_svc'} |

#### 18. `POST` `/api/v1/series/list`

- **Handler:** `list_series` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:324
- **Defined path:** `/list`
- **Router:** object=`series_router` prefix=`/series` resolved_base=`/api/v1/series`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Series']`
- **Response model:** `PaginatedResponse[PostSeriesRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ListRequest` | `` | `` |  |
| `svc` | `PostSeriesService` | `Depends(_series_svc)` | `dependency` | {'arg': '_series_svc'} |

#### 19. `DELETE` `/api/v1/series/{series_id}`

- **Handler:** `delete_series` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:360
- **Defined path:** `/{series_id}`
- **Router:** object=`series_router` prefix=`/series` resolved_base=`/api/v1/series`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Series']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `series_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `PostSeriesService` | `Depends(_series_svc)` | `dependency` | {'arg': '_series_svc'} |

#### 20. `GET` `/api/v1/series/{series_id}`

- **Handler:** `get_series` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:352
- **Defined path:** `/{series_id}`
- **Router:** object=`series_router` prefix=`/series` resolved_base=`/api/v1/series`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Series']`
- **Response model:** `PostSeriesRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `series_id` | `int` | `` | `path` |  |
| `svc` | `PostSeriesService` | `Depends(_series_svc)` | `dependency` | {'arg': '_series_svc'} |

#### 21. `POST` `/api/v1/tags`

- **Handler:** `create_tag` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:291
- **Defined path:** ``
- **Router:** object=`tag_router` prefix=`/tags` resolved_base=`/api/v1/tags`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Tags']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `PostTagCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `PostTagService` | `Depends(_tag_svc)` | `dependency` | {'arg': '_tag_svc'} |

#### 22. `POST` `/api/v1/tags/list`

- **Handler:** `list_tags` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:276
- **Defined path:** `/list`
- **Router:** object=`tag_router` prefix=`/tags` resolved_base=`/api/v1/tags`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Tags']`
- **Response model:** `PaginatedResponse[PostTagRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `ListRequest` | `` | `` |  |
| `svc` | `PostTagService` | `Depends(_tag_svc)` | `dependency` | {'arg': '_tag_svc'} |

#### 23. `DELETE` `/api/v1/tags/{tag_id}`

- **Handler:** `delete_tag` (async)
- **Source:** `app/api/v1/endpoints/posts.py`:302
- **Defined path:** `/{tag_id}`
- **Router:** object=`tag_router` prefix=`/tags` resolved_base=`/api/v1/tags`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Post Tags']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `tag_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `PostTagService` | `Depends(_tag_svc)` | `dependency` | {'arg': '_tag_svc'} |

---

## Account Recovery

- **Source files:** `app/api/v1/endpoints/recovery.py`, `app/api/v1/endpoints/website_recovery.py`
- **Endpoints:** 15
- **Mount/status:** mounted (/api/v1 router) (15)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/auth/recovery/account` | `recovery_account` | Unlock or restore an account using a verified recovery token | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/auth/recovery/config` | `recovery_config` | Everything a client needs to render the recovery flow | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/auth/recovery/detect` | `recovery_detect` | Free detection of an account by username, email or phone number | mounted (/api/v1 router) |
| 4 | `GET` | `/api/v1/auth/recovery/link` | `recovery_validate_link` | Inspect an emailed link without consuming it (scanner-safe) | mounted (/api/v1 router) |
| 5 | `POST` | `/api/v1/auth/recovery/password/change` | `change_password` | Change the password of the signed-in user | mounted (/api/v1 router) |
| 6 | `POST` | `/api/v1/auth/recovery/request` | `recovery_request` | Send a verification code and a one-time link | mounted (/api/v1 router) |
| 7 | `POST` | `/api/v1/auth/recovery/reset` | `recovery_reset` | Set a new password using a verified recovery token | mounted (/api/v1 router) |
| 8 | `POST` | `/api/v1/auth/recovery/verify` | `recovery_verify` | Verify a code or an emailed link | mounted (/api/v1 router) |
| 9 | `POST` | `/api/v1/rty/dragon/site/auth/recovery/account` | `website_recovery_account` | Unlock or restore a locked / deactivated account | mounted (/api/v1 router) |
| 10 | `GET` | `/api/v1/rty/dragon/site/auth/recovery/config` | `website_recovery_config` | Recovery flow configuration for the website | mounted (/api/v1 router) |
| 11 | `POST` | `/api/v1/rty/dragon/site/auth/recovery/detect` | `website_recovery_detect` | Free account detection (encrypted identifier) | mounted (/api/v1 router) |
| 12 | `GET` | `/api/v1/rty/dragon/site/auth/recovery/link` | `website_recovery_validate_link` | Inspect an emailed link without consuming it | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/rty/dragon/site/auth/recovery/request` | `website_recovery_request` | Send the verification code and link | mounted (/api/v1 router) |
| 14 | `POST` | `/api/v1/rty/dragon/site/auth/recovery/reset` | `website_recovery_reset` | Set a new password | mounted (/api/v1 router) |
| 15 | `POST` | `/api/v1/rty/dragon/site/auth/recovery/verify` | `website_recovery_verify` | Verify the code or the emailed link | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/auth/recovery/account`

- **Handler:** `recovery_account` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:471
- **Defined path:** `/account`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Unlock or restore an account using a verified recovery token
- **Response model:** `RecoveryAccountResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RecoveryAccountRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Undo lockouts, soft-deletes and (optionally) deactivations.

For a locked or deleted account this is the whole fix. For an
OAuth-only account with no password it reports
``RequiresPasswordReset`` so the client can continue into ``/reset``.
```

#### 2. `GET` `/api/v1/auth/recovery/config`

- **Handler:** `recovery_config` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:167
- **Defined path:** `/config`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Everything a client needs to render the recovery flow
- **Response model:** `RecoveryConfigResponse`

**Parameters:** none declared in signature (or not detected).

#### 3. `POST` `/api/v1/auth/recovery/detect`

- **Handler:** `recovery_detect` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:202
- **Defined path:** `/detect`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Free detection of an account by username, email or phone number
- **Response model:** `RecoveryDetectResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RecoveryDetectRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Look the account up and hand back a short-lived challenge token.

This step sends nothing and is intentionally cheap
(``RECOVERY_DETECT_IS_FREE``); the send/verify steps are what cost money,
and they require the ``ChallengeToken`` minted here.
```

#### 4. `GET` `/api/v1/auth/recovery/link`

- **Handler:** `recovery_validate_link` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:377
- **Defined path:** `/link`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Inspect an emailed link without consuming it (scanner-safe)
- **Response model:** `RecoveryLinkValidateResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `token` | `str` | `Query(..., min_length=10, max_length=1024)` | `query` | {'arg': '...', 'min_length': '10', 'max_length': '1024'} |

**Docstring:**

```text
Report whether a link is still usable *without* burning it.

Email security scanners fetch every link, so a consuming GET endpoint
would invalidate the link before the user ever sees it. The frontends
call this on page load, then POST ``/verify`` to actually spend it.
```

#### 5. `POST` `/api/v1/auth/recovery/password/change`

- **Handler:** `change_password` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:536
- **Defined path:** `/password/change`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Change the password of the signed-in user
- **Response model:** `PasswordChangeResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PasswordChangeRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Authenticated sibling of ``/reset`` — requires the current password.
```

#### 6. `POST` `/api/v1/auth/recovery/request`

- **Handler:** `recovery_request` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:254
- **Defined path:** `/request`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Send a verification code and a one-time link
- **Response model:** `RecoverySendResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RecoverySendRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `POST` `/api/v1/auth/recovery/reset`

- **Handler:** `recovery_reset` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:401
- **Defined path:** `/reset`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Set a new password using a verified recovery token
- **Response model:** `RecoveryResetResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RecoveryResetRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 8. `POST` `/api/v1/auth/recovery/verify`

- **Handler:** `recovery_verify` (async)
- **Source:** `app/api/v1/endpoints/recovery.py`:306
- **Defined path:** `/verify`
- **Router:** object=`router` prefix=`/auth/recovery` resolved_base=`/api/v1/auth/recovery`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Account Recovery']`
- **Summary:** Verify a code or an emailed link
- **Response model:** `RecoveryVerifyResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RecoveryVerifyRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 9. `POST` `/api/v1/rty/dragon/site/auth/recovery/account`

- **Handler:** `website_recovery_account` (async)
- **Source:** `app/api/v1/endpoints/website_recovery.py`:479
- **Defined path:** `/site/auth/recovery/account`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Recovery']`
- **Summary:** Unlock or restore a locked / deactivated account
- **Response model:** `SeoEnvelope[WebsiteRecoveryAccountData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `_WebsiteAccountBody` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `GET` `/api/v1/rty/dragon/site/auth/recovery/config`

- **Handler:** `website_recovery_config` (async)
- **Source:** `app/api/v1/endpoints/website_recovery.py`:153
- **Defined path:** `/site/auth/recovery/config`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Recovery']`
- **Summary:** Recovery flow configuration for the website
- **Response model:** `SeoEnvelope[RecoveryConfigResponse]`

**Parameters:** none declared in signature (or not detected).

#### 11. `POST` `/api/v1/rty/dragon/site/auth/recovery/detect`

- **Handler:** `website_recovery_detect` (async)
- **Source:** `app/api/v1/endpoints/website_recovery.py`:184
- **Defined path:** `/site/auth/recovery/detect`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Recovery']`
- **Summary:** Free account detection (encrypted identifier)
- **Response model:** `SeoEnvelope[WebsiteRecoveryDetectData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `_WebsiteDetectBody` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 12. `GET` `/api/v1/rty/dragon/site/auth/recovery/link`

- **Handler:** `website_recovery_validate_link` (async)
- **Source:** `app/api/v1/endpoints/website_recovery.py`:377
- **Defined path:** `/site/auth/recovery/link`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Recovery']`
- **Summary:** Inspect an emailed link without consuming it
- **Response model:** `SeoEnvelope[WebsiteRecoveryVerifyData | dict]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `token` | `str` | `Query(..., min_length=10, max_length=1024)` | `query` | {'arg': '...', 'min_length': '10', 'max_length': '1024'} |

#### 13. `POST` `/api/v1/rty/dragon/site/auth/recovery/request`

- **Handler:** `website_recovery_request` (async)
- **Source:** `app/api/v1/endpoints/website_recovery.py`:246
- **Defined path:** `/site/auth/recovery/request`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Recovery']`
- **Summary:** Send the verification code and link
- **Response model:** `SeoEnvelope[WebsiteRecoverySendData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `_WebsiteSendBody` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 14. `POST` `/api/v1/rty/dragon/site/auth/recovery/reset`

- **Handler:** `website_recovery_reset` (async)
- **Source:** `app/api/v1/endpoints/website_recovery.py`:395
- **Defined path:** `/site/auth/recovery/reset`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Recovery']`
- **Summary:** Set a new password
- **Response model:** `SeoEnvelope[WebsiteRecoveryResetData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `_WebsiteResetBody` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 15. `POST` `/api/v1/rty/dragon/site/auth/recovery/verify`

- **Handler:** `website_recovery_verify` (async)
- **Source:** `app/api/v1/endpoints/website_recovery.py`:309
- **Defined path:** `/site/auth/recovery/verify`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website Recovery']`
- **Summary:** Verify the code or the emailed link
- **Response model:** `SeoEnvelope[WebsiteRecoveryVerifyData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `_WebsiteVerifyBody` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## RTS Auth Passkeys (mounted)

- **Source files:** `app/api/v1/endpoints/rtsauth_passkey.py`
- **Endpoints:** 6
- **Mount/status:** mounted in main.py (6)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/rtsauth/passkey/login/options` | `passkey_login_options` | Passkey: start sign-in | mounted in main.py |
| 2 | `POST` | `/rtsauth/passkey/login/verify` | `passkey_login_verify` | Passkey: finish sign-in (same response as POST /rtsauth/oauth) | mounted in main.py |
| 3 | `POST` | `/rtsauth/passkey/register/options` | `passkey_register_options` | Passkey: start adding a passkey | mounted in main.py |
| 4 | `POST` | `/rtsauth/passkey/register/verify` | `passkey_register_verify` | Passkey: finish adding a passkey | mounted in main.py |
| 5 | `GET` | `/rtsauth/passkeys` | `passkey_list` | Passkey: list my passkeys | mounted in main.py |
| 6 | `DELETE` | `/rtsauth/passkeys/{passkey_id}` | `passkey_delete` | Passkey: remove one of my passkeys | mounted in main.py |

### Endpoint details

#### 1. `POST` `/rtsauth/passkey/login/options`

- **Handler:** `passkey_login_options` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey.py`:357
- **Defined path:** `/passkey/login/options`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: start sign-in

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `POST` `/rtsauth/passkey/login/verify`

- **Handler:** `passkey_login_verify` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey.py`:372
- **Defined path:** `/passkey/login/verify`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: finish sign-in (same response as POST /rtsauth/oauth)

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PasskeyLoginVerifyRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `POST` `/rtsauth/passkey/register/options`

- **Handler:** `passkey_register_options` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey.py`:242
- **Defined path:** `/passkey/register/options`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: start adding a passkey

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `POST` `/rtsauth/passkey/register/verify`

- **Handler:** `passkey_register_verify` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey.py`:287
- **Defined path:** `/passkey/register/verify`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: finish adding a passkey
- **Status code:** `201`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PasskeyRegisterVerifyRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 5. `GET` `/rtsauth/passkeys`

- **Handler:** `passkey_list` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey.py`:456
- **Defined path:** `/passkeys`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: list my passkeys

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 6. `DELETE` `/rtsauth/passkeys/{passkey_id}`

- **Handler:** `passkey_delete` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey.py`:479
- **Defined path:** `/passkeys/{passkey_id}`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** mounted in main.py
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: remove one of my passkeys

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `passkey_id` | `int` | `` | `path` |  |
| `request` | `Request` | `` | `request` |  |
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Security (API Keys / Internal)

- **Source files:** `app/api/v1/endpoints/security.py`
- **Endpoints:** 4
- **Mount/status:** mounted (/api/v1 router) (4)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/internal/status` | `internal_status` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/security/api-keys` | `list_api_keys` |  | mounted (/api/v1 router) |
| 3 | `POST` | `/api/v1/security/api-keys` | `create_api_key` |  | mounted (/api/v1 router) |
| 4 | `DELETE` | `/api/v1/security/api-keys/{key_id}` | `revoke_api_key` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/internal/status`

- **Handler:** `internal_status` (async)
- **Source:** `app/api/v1/endpoints/security.py`:143
- **Defined path:** `/internal/status`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Security']`
- **Response model:** `InternalStatusResponse`
- **Dependencies (decorator):** `[Depends(require_api_key_scope('internal'))]`

**Parameters:** none declared in signature (or not detected).

**Docstring:**

```text
Health/status for trusted backends. Protected by API key + request signing.
```

#### 2. `GET` `/api/v1/security/api-keys`

- **Handler:** `list_api_keys` (async)
- **Source:** `app/api/v1/endpoints/security.py`:95
- **Defined path:** `/security/api-keys`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Security']`
- **Response model:** `list[ApiKeyReadResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `POST` `/api/v1/security/api-keys`

- **Handler:** `create_api_key` (async)
- **Source:** `app/api/v1/endpoints/security.py`:40
- **Defined path:** `/security/api-keys`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Security']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `ApiKeyCreatedResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ApiKeyCreateRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Issue a new API key. The raw key is returned exactly once.
```

#### 4. `DELETE` `/api/v1/security/api-keys/{key_id}`

- **Handler:** `revoke_api_key` (async)
- **Source:** `app/api/v1/endpoints/security.py`:112
- **Defined path:** `/security/api-keys/{key_id}`
- **Router:** object=`router` prefix=`` resolved_base=`/api/v1`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Security']`
- **Response model:** `MessageResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `key_id` | `int` | `` | `path` |  |
| `request` | `Request` | `` | `request` |  |
| `admin` | `dict` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Session (Auth)

- **Source files:** `app/api/v1/endpoints/session.py`
- **Endpoints:** 2
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py) (2)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/auth/logout` | `logout` |  | DEFINED (mount inferred under /api/v1; verify router.py) |
| 2 | `GET` | `/api/v1/auth/me` | `me` |  | DEFINED (mount inferred under /api/v1; verify router.py) |

### Endpoint details

#### 1. `POST` `/api/v1/auth/logout`

- **Handler:** `logout` (async)
- **Source:** `app/api/v1/endpoints/session.py`:28
- **Defined path:** `/logout`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Authentication']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |

#### 2. `GET` `/api/v1/auth/me`

- **Handler:** `me` (async)
- **Source:** `app/api/v1/endpoints/session.py`:12
- **Defined path:** `/me`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED (mount inferred under /api/v1; verify router.py)
- **Tags:** `['Authentication']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user` | `User` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

---

## Settings

- **Source files:** `app/api/v1/endpoints/settings_ep.py`
- **Endpoints:** 6
- **Mount/status:** mounted (/api/v1 router) (6)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/settings` | `list_settings` |  | mounted (/api/v1 router) |
| 2 | `POST` | `/api/v1/settings` | `create_setting` |  | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/settings/feature-flags/all` | `list_feature_flags` |  | mounted (/api/v1 router) |
| 4 | `PATCH` | `/api/v1/settings/feature-flags/{code}` | `toggle_feature_flag` |  | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/settings/{code}` | `get_setting` |  | mounted (/api/v1 router) |
| 6 | `PATCH` | `/api/v1/settings/{code}` | `update_setting` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/settings`

- **Handler:** `list_settings` (async)
- **Source:** `app/api/v1/endpoints/settings_ep.py`:41
- **Defined path:** ``
- **Router:** object=`router` prefix=`/settings` resolved_base=`/api/v1/settings`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Settings']`
- **Response model:** `PaginatedResponse[SettingRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(100, ge=1, le=500)` | `query` | {'arg': '100', 'ge': '1', 'le': '500'} |
| `svc` | `SettingService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 2. `POST` `/api/v1/settings`

- **Handler:** `create_setting` (async)
- **Source:** `app/api/v1/endpoints/settings_ep.py`:54
- **Defined path:** ``
- **Router:** object=`router` prefix=`/settings` resolved_base=`/api/v1/settings`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Settings']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `IDResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `SettingCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `SettingService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 3. `GET` `/api/v1/settings/feature-flags/all`

- **Handler:** `list_feature_flags` (async)
- **Source:** `app/api/v1/endpoints/settings_ep.py`:88
- **Defined path:** `/feature-flags/all`
- **Router:** object=`router` prefix=`/settings` resolved_base=`/api/v1/settings`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Settings']`
- **Response model:** `PaginatedResponse[FeatureFlagRead]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(100, ge=1, le=200)` | `query` | {'arg': '100', 'ge': '1', 'le': '200'} |
| `svc` | `FeatureFlagService` | `Depends(_ff_svc)` | `dependency` | {'arg': '_ff_svc'} |

#### 4. `PATCH` `/api/v1/settings/feature-flags/{code}`

- **Handler:** `toggle_feature_flag` (async)
- **Source:** `app/api/v1/endpoints/settings_ep.py`:101
- **Defined path:** `/feature-flags/{code}`
- **Router:** object=`router` prefix=`/settings` resolved_base=`/api/v1/settings`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Settings']`
- **Response model:** `FeatureFlagRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `code` | `str` | `` | `path` |  |
| `enabled` | `bool` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `FeatureFlagService` | `Depends(_ff_svc)` | `dependency` | {'arg': '_ff_svc'} |

#### 5. `GET` `/api/v1/settings/{code}`

- **Handler:** `get_setting` (async)
- **Source:** `app/api/v1/endpoints/settings_ep.py`:65
- **Defined path:** `/{code}`
- **Router:** object=`router` prefix=`/settings` resolved_base=`/api/v1/settings`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Settings']`
- **Response model:** `SettingRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `code` | `str` | `` | `path` |  |
| `svc` | `SettingService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

#### 6. `PATCH` `/api/v1/settings/{code}`

- **Handler:** `update_setting` (async)
- **Source:** `app/api/v1/endpoints/settings_ep.py`:73
- **Defined path:** `/{code}`
- **Router:** object=`router` prefix=`/settings` resolved_base=`/api/v1/settings`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Settings']`
- **Response model:** `SettingRead`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `code` | `str` | `` | `path` |  |
| `body` | `SettingUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `svc` | `SettingService` | `Depends(_svc)` | `dependency` | {'arg': '_svc'} |

---

## Subscriptions, Plans & Payments

- **Source files:** `app/api/v1/endpoints/subscriptions.py`
- **Endpoints:** 15
- **Mount/status:** mounted nested under /api/v1/subscriptions (15)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/subscriptions/payments/create` | `payment_create` |  | mounted nested under /api/v1/subscriptions |
| 2 | `DELETE` | `/api/v1/subscriptions/payments/delete/{payment_id}` | `payment_delete` |  | mounted nested under /api/v1/subscriptions |
| 3 | `POST` | `/api/v1/subscriptions/payments/list` | `payments_list` |  | mounted nested under /api/v1/subscriptions |
| 4 | `POST` | `/api/v1/subscriptions/payments/update/{payment_id}` | `payment_update` |  | mounted nested under /api/v1/subscriptions |
| 5 | `GET` | `/api/v1/subscriptions/payments/{payment_id}` | `payment_detail` |  | mounted nested under /api/v1/subscriptions |
| 6 | `POST` | `/api/v1/subscriptions/plans/create` | `plan_create` |  | mounted nested under /api/v1/subscriptions |
| 7 | `DELETE` | `/api/v1/subscriptions/plans/delete/{plan_id}` | `plan_delete` |  | mounted nested under /api/v1/subscriptions |
| 8 | `POST` | `/api/v1/subscriptions/plans/list` | `plans_list` |  | mounted nested under /api/v1/subscriptions |
| 9 | `POST` | `/api/v1/subscriptions/plans/update/{plan_id}` | `plan_update` |  | mounted nested under /api/v1/subscriptions |
| 10 | `GET` | `/api/v1/subscriptions/plans/{plan_id}` | `plan_detail` |  | mounted nested under /api/v1/subscriptions |
| 11 | `POST` | `/api/v1/subscriptions/subscriptions/create` | `subscription_create` |  | mounted nested under /api/v1/subscriptions |
| 12 | `DELETE` | `/api/v1/subscriptions/subscriptions/delete/{subscription_id}` | `subscription_delete` |  | mounted nested under /api/v1/subscriptions |
| 13 | `POST` | `/api/v1/subscriptions/subscriptions/list` | `subscriptions_list` |  | mounted nested under /api/v1/subscriptions |
| 14 | `POST` | `/api/v1/subscriptions/subscriptions/update/{subscription_id}` | `subscription_update` |  | mounted nested under /api/v1/subscriptions |
| 15 | `GET` | `/api/v1/subscriptions/subscriptions/{subscription_id}` | `subscription_detail` |  | mounted nested under /api/v1/subscriptions |

### Endpoint details

#### 1. `POST` `/api/v1/subscriptions/payments/create`

- **Handler:** `payment_create` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:588
- **Defined path:** `/create`
- **Router:** object=`payments_router` prefix=`/payments` resolved_base=`/api/v1/subscriptions/payments`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Payments']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `PaymentResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PaymentCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `DELETE` `/api/v1/subscriptions/payments/delete/{payment_id}`

- **Handler:** `payment_delete` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:681
- **Defined path:** `/delete/{payment_id}`
- **Router:** object=`payments_router` prefix=`/payments` resolved_base=`/api/v1/subscriptions/payments`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Payments']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payment_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `POST` `/api/v1/subscriptions/payments/list`

- **Handler:** `payments_list` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:525
- **Defined path:** `/list`
- **Router:** object=`payments_router` prefix=`/payments` resolved_base=`/api/v1/subscriptions/payments`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Payments']`
- **Response model:** `list[PaymentResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PaymentListRequest` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `POST` `/api/v1/subscriptions/payments/update/{payment_id}`

- **Handler:** `payment_update` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:626
- **Defined path:** `/update/{payment_id}`
- **Router:** object=`payments_router` prefix=`/payments` resolved_base=`/api/v1/subscriptions/payments`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Payments']`
- **Response model:** `PaymentResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payment_id` | `int` | `` | `path` |  |
| `payload` | `PaymentUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 5. `GET` `/api/v1/subscriptions/payments/{payment_id}`

- **Handler:** `payment_detail` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:563
- **Defined path:** `/{payment_id}`
- **Router:** object=`payments_router` prefix=`/payments` resolved_base=`/api/v1/subscriptions/payments`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Payments']`
- **Response model:** `PaymentResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payment_id` | `int` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 6. `POST` `/api/v1/subscriptions/plans/create`

- **Handler:** `plan_create` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:185
- **Defined path:** `/create`
- **Router:** object=`plans_router` prefix=`/plans` resolved_base=`/api/v1/subscriptions/plans`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Plans']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `PlanResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PlanCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `DELETE` `/api/v1/subscriptions/plans/delete/{plan_id}`

- **Handler:** `plan_delete` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:275
- **Defined path:** `/delete/{plan_id}`
- **Router:** object=`plans_router` prefix=`/plans` resolved_base=`/api/v1/subscriptions/plans`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Plans']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `plan_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 8. `POST` `/api/v1/subscriptions/plans/list`

- **Handler:** `plans_list` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:120
- **Defined path:** `/list`
- **Router:** object=`plans_router` prefix=`/plans` resolved_base=`/api/v1/subscriptions/plans`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Plans']`
- **Response model:** `list[PlanResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PlanListRequest` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 9. `POST` `/api/v1/subscriptions/plans/update/{plan_id}`

- **Handler:** `plan_update` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:222
- **Defined path:** `/update/{plan_id}`
- **Router:** object=`plans_router` prefix=`/plans` resolved_base=`/api/v1/subscriptions/plans`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Plans']`
- **Response model:** `PlanResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `plan_id` | `int` | `` | `path` |  |
| `payload` | `PlanUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(require_roles('ADMIN'))` | `dependency` | {'arg': "require_roles('ADMIN')"} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `GET` `/api/v1/subscriptions/plans/{plan_id}`

- **Handler:** `plan_detail` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:160
- **Defined path:** `/{plan_id}`
- **Router:** object=`plans_router` prefix=`/plans` resolved_base=`/api/v1/subscriptions/plans`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Plans']`
- **Response model:** `PlanResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `plan_id` | `int` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 11. `POST` `/api/v1/subscriptions/subscriptions/create`

- **Handler:** `subscription_create` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:379
- **Defined path:** `/create`
- **Router:** object=`subscriptions_router` prefix=`/subscriptions` resolved_base=`/api/v1/subscriptions/subscriptions`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Subscriptions']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `SubscriptionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `SubscriptionCreate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 12. `DELETE` `/api/v1/subscriptions/subscriptions/delete/{subscription_id}`

- **Handler:** `subscription_delete` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:478
- **Defined path:** `/delete/{subscription_id}`
- **Router:** object=`subscriptions_router` prefix=`/subscriptions` resolved_base=`/api/v1/subscriptions/subscriptions`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Subscriptions']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `subscription_id` | `int` | `` | `path` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 13. `POST` `/api/v1/subscriptions/subscriptions/list`

- **Handler:** `subscriptions_list` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:316
- **Defined path:** `/list`
- **Router:** object=`subscriptions_router` prefix=`/subscriptions` resolved_base=`/api/v1/subscriptions/subscriptions`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Subscriptions']`
- **Response model:** `list[SubscriptionResponse]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `SubscriptionListRequest` | `` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 14. `POST` `/api/v1/subscriptions/subscriptions/update/{subscription_id}`

- **Handler:** `subscription_update` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:420
- **Defined path:** `/update/{subscription_id}`
- **Router:** object=`subscriptions_router` prefix=`/subscriptions` resolved_base=`/api/v1/subscriptions/subscriptions`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Subscriptions']`
- **Response model:** `SubscriptionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `subscription_id` | `int` | `` | `path` |  |
| `payload` | `SubscriptionUpdate` | `` | `` |  |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 15. `GET` `/api/v1/subscriptions/subscriptions/{subscription_id}`

- **Handler:** `subscription_detail` (async)
- **Source:** `app/api/v1/endpoints/subscriptions.py`:354
- **Defined path:** `/{subscription_id}`
- **Router:** object=`subscriptions_router` prefix=`/subscriptions` resolved_base=`/api/v1/subscriptions/subscriptions`
- **Mount/status:** mounted nested under /api/v1/subscriptions
- **Tags:** `['Subscriptions']`
- **Response model:** `SubscriptionResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `subscription_id` | `int` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Telegram Auth

- **Source files:** `app/api/v1/endpoints/telegram.py`
- **Endpoints:** 2
- **Mount/status:** mounted (/api/v1 router) (2)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/auth/telegram/callback` | `telegram_callback` |  | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/auth/telegram/start` | `telegram_login` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/auth/telegram/callback`

- **Handler:** `telegram_callback` (async)
- **Source:** `app/api/v1/endpoints/telegram.py`:227
- **Defined path:** `/callback`
- **Router:** object=`router` prefix=`/auth/telegram` resolved_base=`/api/v1/auth/telegram`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Telegram OAuth']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `code` | `str \| None` | `None` | `` |  |
| `state` | `str \| None` | `None` | `` |  |
| `error` | `str \| None` | `None` | `` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `GET` `/api/v1/auth/telegram/start`

- **Handler:** `telegram_login` (async)
- **Source:** `app/api/v1/endpoints/telegram.py`:182
- **Defined path:** `/start`
- **Router:** object=`router` prefix=`/auth/telegram` resolved_base=`/api/v1/auth/telegram`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Telegram OAuth']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## User Permissions

- **Source files:** `app/api/v1/endpoints/userpermission.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/userpermission/list` | `list_my_permissions_post` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/userpermission/list`

- **Handler:** `list_my_permissions_post` (async)
- **Source:** `app/api/v1/endpoints/userpermission.py`:48
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/userpermission` resolved_base=`/api/v1/userpermission`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['User Permissions']`
- **Response model:** `UserPermissionList`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

**Docstring:**

```text
POST twin of ``GET /list``.

The legacy frontend permission store posts to this path, so both verbs are
accepted and return the same payload.
```

---

## Public Contact

- **Source files:** `app/api/v1/endpoints/web/contact.py`
- **Endpoints:** 1
- **Mount/status:** mounted (/api/v1 router) (1)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/api/v1/contacts` | `submit_contact` |  | mounted (/api/v1 router) |

### Endpoint details

#### 1. `POST` `/api/v1/contacts`

- **Handler:** `submit_contact` (async)
- **Source:** `app/api/v1/endpoints/web/contact.py`:35
- **Defined path:** ``
- **Router:** object=`router` prefix=`/contacts` resolved_base=`/api/v1/contacts`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Public Contact']`
- **Status code:** `status.HTTP_201_CREATED`
- **Dependencies (decorator):** `[Depends(check_contact_rate_limit)]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `ContactCreate` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Website (Public)

- **Source files:** `app/api/v1/endpoints/website.py`
- **Endpoints:** 13
- **Mount/status:** mounted (/api/v1 router) (13)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/rty/dragon/site/artists` | `site_artists` | Public artists (paginated) | mounted (/api/v1 router) |
| 2 | `GET` | `/api/v1/rty/dragon/site/artists/{code}` | `site_artist_detail` | Artist profile with full SEO payload | mounted (/api/v1 router) |
| 3 | `GET` | `/api/v1/rty/dragon/site/artworks` | `site_artworks` | Public artworks (paginated) | mounted (/api/v1 router) |
| 4 | `GET` | `/api/v1/rty/dragon/site/artworks/{slug}` | `site_artwork_detail` | Artwork detail with full SEO payload | mounted (/api/v1 router) |
| 5 | `GET` | `/api/v1/rty/dragon/site/galleries` | `site_galleries` | Public galleries (paginated) | mounted (/api/v1 router) |
| 6 | `GET` | `/api/v1/rty/dragon/site/galleries/{slug}` | `site_gallery_detail` | Gallery detail with full SEO payload | mounted (/api/v1 router) |
| 7 | `GET` | `/api/v1/rty/dragon/site/meta` | `site_meta` | Site-wide metadata for the website shell | mounted (/api/v1 router) |
| 8 | `GET` | `/api/v1/rty/dragon/site/pages/{slug}` | `site_page_detail` | Published CMS page with full SEO payload | mounted (/api/v1 router) |
| 9 | `GET` | `/api/v1/rty/dragon/site/posts` | `site_posts` | Published posts (paginated) | mounted (/api/v1 router) |
| 10 | `GET` | `/api/v1/rty/dragon/site/posts/{slug}` | `site_post_detail` | Published post detail with full SEO payload | mounted (/api/v1 router) |
| 11 | `DELETE` | `/api/v1/rty/dragon/site/session` | `delete_site_session` | Clear the visitor-session cookie | mounted (/api/v1 router) |
| 12 | `GET` | `/api/v1/rty/dragon/site/session` | `read_site_session` | Read the encrypted visitor-session cookie | mounted (/api/v1 router) |
| 13 | `POST` | `/api/v1/rty/dragon/site/session` | `create_site_session` | Issue an encrypted HttpOnly visitor-session cookie | mounted (/api/v1 router) |

### Endpoint details

#### 1. `GET` `/api/v1/rty/dragon/site/artists`

- **Handler:** `site_artists` (async)
- **Source:** `app/api/v1/endpoints/website.py`:428
- **Defined path:** `/site/artists`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Public artists (paginated)
- **Response model:** `SeoEnvelope[WebsiteArtistListData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `pageSize` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `GET` `/api/v1/rty/dragon/site/artists/{code}`

- **Handler:** `site_artist_detail` (async)
- **Source:** `app/api/v1/endpoints/website.py`:489
- **Defined path:** `/site/artists/{code}`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Artist profile with full SEO payload
- **Response model:** `SeoEnvelope[WebsiteArtist]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `code` | `str` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `GET` `/api/v1/rty/dragon/site/artworks`

- **Handler:** `site_artworks` (async)
- **Source:** `app/api/v1/endpoints/website.py`:281
- **Defined path:** `/site/artworks`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Public artworks (paginated)
- **Response model:** `SeoEnvelope[WebsiteArtworkListData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `pageSize` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `search` | `str \| None` | `Query(None, max_length=200)` | `query` | {'arg': 'None', 'max_length': '200'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `GET` `/api/v1/rty/dragon/site/artworks/{slug}`

- **Handler:** `site_artwork_detail` (async)
- **Source:** `app/api/v1/endpoints/website.py`:354
- **Defined path:** `/site/artworks/{slug}`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Artwork detail with full SEO payload
- **Response model:** `SeoEnvelope[WebsiteArtwork]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 5. `GET` `/api/v1/rty/dragon/site/galleries`

- **Handler:** `site_galleries` (async)
- **Source:** `app/api/v1/endpoints/website.py`:554
- **Defined path:** `/site/galleries`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Public galleries (paginated)
- **Response model:** `SeoEnvelope[WebsiteGalleryListData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `pageSize` | `int` | `Query(12, ge=1, le=100)` | `query` | {'arg': '12', 'ge': '1', 'le': '100'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 6. `GET` `/api/v1/rty/dragon/site/galleries/{slug}`

- **Handler:** `site_gallery_detail` (async)
- **Source:** `app/api/v1/endpoints/website.py`:620
- **Defined path:** `/site/galleries/{slug}`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Gallery detail with full SEO payload
- **Response model:** `SeoEnvelope[WebsiteGallery]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `GET` `/api/v1/rty/dragon/site/meta`

- **Handler:** `site_meta` (async)
- **Source:** `app/api/v1/endpoints/website.py`:98
- **Defined path:** `/site/meta`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Site-wide metadata for the website shell
- **Response model:** `SeoEnvelope[WebsiteSiteMeta]`

**Parameters:** none declared in signature (or not detected).

#### 8. `GET` `/api/v1/rty/dragon/site/pages/{slug}`

- **Handler:** `site_page_detail` (async)
- **Source:** `app/api/v1/endpoints/website.py`:681
- **Defined path:** `/site/pages/{slug}`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Published CMS page with full SEO payload
- **Response model:** `SeoEnvelope[WebsitePage]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 9. `GET` `/api/v1/rty/dragon/site/posts`

- **Handler:** `site_posts` (async)
- **Source:** `app/api/v1/endpoints/website.py`:135
- **Defined path:** `/site/posts`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Published posts (paginated)
- **Response model:** `SeoEnvelope[WebsitePostListData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `pageSize` | `int` | `Query(20, ge=1, le=100)` | `query` | {'arg': '20', 'ge': '1', 'le': '100'} |
| `search` | `str \| None` | `Query(None, max_length=200)` | `query` | {'arg': 'None', 'max_length': '200'} |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `GET` `/api/v1/rty/dragon/site/posts/{slug}`

- **Handler:** `site_post_detail` (async)
- **Source:** `app/api/v1/endpoints/website.py`:206
- **Defined path:** `/site/posts/{slug}`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Published post detail with full SEO payload
- **Response model:** `SeoEnvelope[WebsitePost]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `slug` | `str` | `` | `path` |  |
| `db` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 11. `DELETE` `/api/v1/rty/dragon/site/session`

- **Handler:** `delete_site_session` (async)
- **Source:** `app/api/v1/endpoints/website.py`:816
- **Defined path:** `/site/session`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Clear the visitor-session cookie
- **Response model:** `SeoEnvelope[WebsiteSessionAck]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |

#### 12. `GET` `/api/v1/rty/dragon/site/session`

- **Handler:** `read_site_session` (async)
- **Source:** `app/api/v1/endpoints/website.py`:780
- **Defined path:** `/site/session`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Read the encrypted visitor-session cookie
- **Response model:** `SeoEnvelope[WebsiteSessionData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

#### 13. `POST` `/api/v1/rty/dragon/site/session`

- **Handler:** `create_site_session` (async)
- **Source:** `app/api/v1/endpoints/website.py`:730
- **Defined path:** `/site/session`
- **Router:** object=`router` prefix=`/rty/dragon` resolved_base=`/api/v1/rty/dragon`
- **Mount/status:** mounted (/api/v1 router)
- **Tags:** `['Website']`
- **Summary:** Issue an encrypted HttpOnly visitor-session cookie
- **Response model:** `SeoEnvelope[WebsiteSessionData]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |

---

## Chat Monitor WebSocket

- **Source files:** `app/websockets/chat_monitor.py`
- **Endpoints:** 1
- **Mount/status:** mounted in main.py (1)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `WEBSOCKET` | `/ws/chat-monitor` | `chat_monitor_ws` |  | mounted in main.py |

### Endpoint details

#### 1. `WEBSOCKET` `/ws/chat-monitor`

- **Handler:** `chat_monitor_ws` (async)
- **Source:** `app/websockets/chat_monitor.py`:388
- **Defined path:** `/ws/chat-monitor`
- **Router:** object=`router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `websocket` | `WebSocket` | `` | `websocket` |  |
| `token` | `str \| None` | `Query(default=None)` | `query` | {'default': 'None'} |

---

## Realtime WebSockets (Chat/Notifications)

- **Source files:** `app/websockets/endpoints.py`
- **Endpoints:** 2
- **Mount/status:** mounted in main.py (2)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `WEBSOCKET` | `/ws/chat/{room_id}` | `chat_endpoint` |  | mounted in main.py |
| 2 | `WEBSOCKET` | `/ws/notifications/{user_id}` | `notifications_endpoint` |  | mounted in main.py |

### Endpoint details

#### 1. `WEBSOCKET` `/ws/chat/{room_id}`

- **Handler:** `chat_endpoint` (async)
- **Source:** `app/websockets/endpoints.py`:165
- **Defined path:** `/ws/chat/{room_id}`
- **Router:** object=`ws_router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py
- **Tags:** `['WebSockets']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `websocket` | `WebSocket` | `` | `websocket` |  |
| `room_id` | `str` | `` | `path` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Real-time chat.
    /ws/chat/{room_id}        (token via subprotocol `token.<jwt>`)
    /ws/chat/{room_id}?token= (legacy query-parameter transport)

Everyone (including guests) may join the room configured as the public
room (settings.PUBLIC_CHAT_ROOM_ID) in read-only mode. Guests are
allowed to receive messages/history but not to post.
```

#### 2. `WEBSOCKET` `/ws/notifications/{user_id}`

- **Handler:** `notifications_endpoint` (async)
- **Source:** `app/websockets/endpoints.py`:351
- **Defined path:** `/ws/notifications/{user_id}`
- **Router:** object=`ws_router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py
- **Tags:** `['WebSockets']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `websocket` | `WebSocket` | `` | `websocket` |  |
| `user_id` | `int` | `` | `path` |  |
| `token` | `str` | `''` | `` |  |

**Docstring:**

```text
Persistent notification channel for a specific user.

WebSocket:
    ws://localhost:58721/ws/notifications/{user_id}?token=<JWT>
```

---

## Auth Bridge (Cross-origin Cookie)

- **Source files:** `app/routers/auth_bridge.py`
- **Endpoints:** 4
- **Mount/status:** mounted in main.py (4)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/SetAuthorizeCookie` | `bridge_page` | Hidden iframe page | mounted in main.py |
| 2 | `DELETE` | `/session` | `clear_session` | Clear the auth cookies | mounted in main.py |
| 3 | `GET` | `/session` | `get_session` | Is the access cookie present and valid? | mounted in main.py |
| 4 | `POST` | `/session` | `set_session` | Verify tokens and set the HttpOnly cookies | mounted in main.py |

### Endpoint details

#### 1. `GET` `/SetAuthorizeCookie`

- **Handler:** `bridge_page` (async)
- **Source:** `app/routers/auth_bridge.py`:199
- **Defined path:** `/SetAuthorizeCookie`
- **Router:** object=`router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py
- **Tags:** `['Auth Bridge (cross-origin cookie)']`
- **Summary:** Hidden iframe page
- **Response class:** `HTMLResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

#### 2. `DELETE` `/session`

- **Handler:** `clear_session` (async)
- **Source:** `app/routers/auth_bridge.py`:267
- **Defined path:** `/session`
- **Router:** object=`router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py
- **Tags:** `['Auth Bridge (cross-origin cookie)']`
- **Summary:** Clear the auth cookies

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

#### 3. `GET` `/session`

- **Handler:** `get_session` (async)
- **Source:** `app/routers/auth_bridge.py`:251
- **Defined path:** `/session`
- **Router:** object=`router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py
- **Tags:** `['Auth Bridge (cross-origin cookie)']`
- **Summary:** Is the access cookie present and valid?

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

#### 4. `POST` `/session`

- **Handler:** `set_session` (async)
- **Source:** `app/routers/auth_bridge.py`:225
- **Defined path:** `/session`
- **Router:** object=`router` prefix=`` resolved_base=`/`
- **Mount/status:** mounted in main.py
- **Tags:** `['Auth Bridge (cross-origin cookie)']`
- **Summary:** Verify tokens and set the HttpOnly cookies

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `BridgeSession` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |

---

## Authentication (Legacy - not mounted)

- **Source files:** `app/api/v1/endpoints/auth_original.py`
- **Endpoints:** 16
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) (16)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/auth/google` | `google_login` | Redirect to Google consent screen (legacy) | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 2 | `POST` | `/api/v1/auth/login` | `login` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 3 | `POST` | `/api/v1/auth/logout` | `logout` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 4 | `GET` | `/api/v1/auth/me` | `get_me` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 5 | `POST` | `/api/v1/auth/me/avatar` | `upload_avatar` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 6 | `GET` | `/api/v1/auth/me/plan` | `get_current_plan` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 7 | `POST` | `/api/v1/auth/me/update` | `update_profile` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 8 | `POST` | `/api/v1/auth/oauth/initiate` | `oauth_initiate` | Build OAuth provider authorization URL | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 9 | `GET` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback_legacy` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 10 | `POST` | `/api/v1/auth/oauth/telegram/callback` | `telegram_oauth_callback` | Telegram Login Widget callback | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 11 | `GET` | `/api/v1/auth/oauth/telegram/config` | `telegram_config` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 12 | `POST` | `/api/v1/auth/oauth/telegram/oidc` | `telegram_oidc_login` | Exchange a verified Telegram ID token for an app session | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 13 | `GET` | `/api/v1/auth/oauth/telegram/widget` | `telegram_widget` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 14 | `GET, POST` | `/api/v1/auth/oauth/{provider}/callback` | `oauth_callback` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 15 | `POST` | `/api/v1/auth/refresh` | `refresh_token` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |
| 16 | `POST` | `/api/v1/auth/register` | `register` |  | DEFINED, NOT MOUNTED (legacy/duplicate of auth.py) |

### Endpoint details

#### 1. `GET` `/api/v1/auth/google`

- **Handler:** `google_login` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1438
- **Defined path:** `/google`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Summary:** Redirect to Google consent screen (legacy)

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `POST` `/api/v1/auth/login`

- **Handler:** `login` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:207
- **Defined path:** `/login`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response model:** `TokenResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `LoginRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `POST` `/api/v1/auth/logout`

- **Handler:** `logout` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:337
- **Defined path:** `/logout`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response model:** `dict`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |

**Docstring:**

```text
Revoke the presented access token (header or cookie) and clear cookies.
```

#### 4. `GET` `/api/v1/auth/me`

- **Handler:** `get_me` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1518
- **Defined path:** `/me`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response model:** `CurrentUser`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |

#### 5. `POST` `/api/v1/auth/me/avatar`

- **Handler:** `upload_avatar` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1576
- **Defined path:** `/me/avatar`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response model:** `dict`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 6. `GET` `/api/v1/auth/me/plan`

- **Handler:** `get_current_plan` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1645
- **Defined path:** `/me/plan`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response model:** `dict`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `current_user` | `CurrentUser` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 7. `POST` `/api/v1/auth/me/update`

- **Handler:** `update_profile` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1723
- **Defined path:** `/me/update`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response model:** `UserOut`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `UpdateProfileRequest` | `` | `` |  |
| `current_user` | `USER` | `Depends(get_current_user)` | `dependency` | {'arg': 'get_current_user'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Update the current user's profile fields using raw SQL.
```

#### 8. `POST` `/api/v1/auth/oauth/initiate`

- **Handler:** `oauth_initiate` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1082
- **Defined path:** `/oauth/initiate`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Summary:** Build OAuth provider authorization URL
- **Response model:** `OAuthInitiateResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `OAuthInitiateRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 9. `GET` `/api/v1/auth/oauth/telegram/callback`

- **Handler:** `telegram_oauth_callback_legacy` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1309
- **Defined path:** `/oauth/telegram/callback`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 10. `POST` `/api/v1/auth/oauth/telegram/callback`

- **Handler:** `telegram_oauth_callback` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1298
- **Defined path:** `/oauth/telegram/callback`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Summary:** Telegram Login Widget callback
- **Description:** Receives the Telegram Login Widget signed payload as a form POST (id, first_name, last_name, username, photo_url, auth_date, hash). Verifies the HMAC-SHA256 hash against TELEGRAM_BOT_TOKEN, rejects stale auth_date, upserts the Telegram user, and redirects to the frontend /oauth/callback with access_token, refresh_token and expires_in (or ?error=<code> on failure).
- **Response class:** `RedirectResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 11. `GET` `/api/v1/auth/oauth/telegram/config`

- **Handler:** `telegram_config` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1355
- **Defined path:** `/oauth/telegram/config`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

#### 12. `POST` `/api/v1/auth/oauth/telegram/oidc`

- **Handler:** `telegram_oidc_login` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1159
- **Defined path:** `/oauth/telegram/oidc`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Summary:** Exchange a verified Telegram ID token for an app session

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `TelegramOIDCLoginRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 13. `GET` `/api/v1/auth/oauth/telegram/widget`

- **Handler:** `telegram_widget` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1413
- **Defined path:** `/oauth/telegram/widget`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response class:** `HTMLResponse`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |

**Docstring:**

```text
DEPRECATED: backend-rendered widget page. The widget must run on the
FRONTEND origin (registered in BotFather), so production uses the site's
/telegram-widget page instead. Kept only for backward compatibility.
```

#### 14. `GET, POST` `/api/v1/auth/oauth/{provider}/callback`

- **Handler:** `oauth_callback` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:1110
- **Defined path:** `/oauth/{provider}/callback`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Include in schema:** `False`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `provider` | `str` | `` | `path` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 15. `POST` `/api/v1/auth/refresh`

- **Handler:** `refresh_token` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:363
- **Defined path:** `/refresh`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Response model:** `TokenResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RefreshRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `response` | `Response` | `` | `response` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Exchange a valid refresh token (body or encrypted cookie) for a new pair.
```

#### 16. `POST` `/api/v1/auth/register`

- **Handler:** `register` (async)
- **Source:** `app/api/v1/endpoints/auth_original.py`:140
- **Defined path:** `/register`
- **Router:** object=`router` prefix=`/auth` resolved_base=`/api/v1/auth`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy/duplicate of auth.py)
- **Tags:** `['Authentication']`
- **Status code:** `status.HTTP_201_CREATED`
- **Response model:** `UserOut`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RegisterRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Create a new local account.
```

---

## Google Drive / OAuth (legacy v1 module - not mounted)

- **Source files:** `app/api/v1/endpoints/cms_oauth_v1.py`
- **Endpoints:** 16
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) (16)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/api/v1/google_drive/activity/history` | `drive_activity_history` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 2 | `GET` | `/api/v1/google_drive/activity/query` | `drive_activity_query` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 3 | `GET` | `/api/v1/google_drive/activity/summary` | `drive_activity_summary` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 4 | `GET` | `/api/v1/google_drive/callback` | `drive_callback` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 5 | `POST` | `/api/v1/google_drive/connect` | `connect_drive` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 6 | `POST` | `/api/v1/google_drive/connect_cls` | `connect_drive_cls` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 7 | `POST` | `/api/v1/google_drive/disconnect` | `disconnect_drive` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 8 | `GET` | `/api/v1/google_drive/files` | `list_stored_drive_files` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 9 | `POST` | `/api/v1/google_drive/labels/apply` | `drive_label_apply` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 10 | `POST` | `/api/v1/google_drive/labels/create` | `drive_label_create` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 11 | `GET` | `/api/v1/google_drive/labels/list` | `drive_labels_list` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 12 | `POST` | `/api/v1/google_drive/labels/remove` | `drive_label_remove` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 13 | `GET` | `/api/v1/google_drive/list` | `list_drive` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 14 | `GET` | `/api/v1/google_drive/status` | `drive_status` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 15 | `POST` | `/api/v1/google_drive/summary` | `drive_summary` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |
| 16 | `POST` | `/api/v1/google_drive/upload` | `upload_to_drive` |  | DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py) |

### Endpoint details

#### 1. `GET` `/api/v1/google_drive/activity/history`

- **Handler:** `drive_activity_history` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:1196
- **Defined path:** `/activity/history`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `target_id` | `str \| None` | `Query(None, alias='targetId', max_length=255)` | `query` | {'arg': 'None', 'alias': "'targetId'", 'max_length': '255'} |
| `action` | `str \| None` | `Query(None, max_length=100)` | `query` | {'arg': 'None', 'max_length': '100'} |
| `days` | `int` | `Query(30, ge=1, le=365)` | `query` | {'arg': '30', 'ge': '1', 'le': '365'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Get Drive activity history for a user, optionally filtered by target file/Folder ID or action type.

- **targetId**: Drive file or folder ID to filter by
- **action**: Action name to filter by (e.g., 'create', 'edit', 'move', 'delete')
- **days**: Lookback window in days (1-365)
```

#### 2. `GET` `/api/v1/google_drive/activity/query`

- **Handler:** `drive_activity_query` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:1234
- **Defined path:** `/activity/query`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `filter` | `str \| None` | `Query(None, max_length=2000)` | `query` | {'arg': 'None', 'max_length': '2000'} |
| `page_size` | `int` | `Query(50, ge=1, le=500)` | `query` | {'arg': '50', 'ge': '1', 'le': '500'} |
| `page_token` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Query Drive Activity API with advanced filters.

- **filter**: Google Drive Activity API filter string
- **pageSize**: Number of results per page (1-500)
- **pageToken**: Pagination token from previous response
```

#### 3. `GET` `/api/v1/google_drive/activity/summary`

- **Handler:** `drive_activity_summary` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:1218
- **Defined path:** `/activity/summary`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `days` | `int` | `Query(30, ge=1, le=365)` | `query` | {'arg': '30', 'ge': '1', 'le': '365'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Build daily/weekly/monthly activity summary from Drive Activity API.

- **days**: Lookback window in days (1-365)
```

#### 4. `GET` `/api/v1/google_drive/callback`

- **Handler:** `drive_callback` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:646
- **Defined path:** `/callback`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `code` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `state` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `error` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

**Docstring:**

```text
Google redirects here. Exchanges the code and stores the tokens.

Unauthenticated by design - the signed-in identity comes from the
single-use ``state`` row written by :func:`connect_drive`, which carries the
user id the authorisation was started for.
```

#### 5. `POST` `/api/v1/google_drive/connect`

- **Handler:** `connect_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:418
- **Defined path:** `/connect`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `DriveConnectRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.connect'))` | `dependency` | {'arg': "require_permission('system.google_drive.connect')"} |

**Docstring:**

```text
Begin the Drive authorisation handshake.

Returns Google's consent URL for the frontend to navigate to. A ``state``
row is written first and consumed exactly once by the callback, which is what
prevents CSRF on the authorisation leg.

``Action: "authorize"`` is the embedded-widget variant: instead of a redirect
the browser posts the one-shot code it received in a popup, and the code is
exchanged right here.
```

#### 6. `POST` `/api/v1/google_drive/connect_cls`

- **Handler:** `connect_drive_cls` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:597
- **Defined path:** `/connect_cls`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveConnectionStatus`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `DriveConnectRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `Optional[CurrentUser]` | `Depends(_cls_optional_user)` | `dependency` | {'arg': '_cls_optional_user'} |

**Docstring:**

```text
Finish a Google Drive handshake started by the embedded widget **without
a system authorization token** - no ``require_permission(...)`` check runs
here, so the file-explorer widget can connect Drive even when the caller
lacks ``system.google_drive.connect``.

Payload (the CLS / ``postmessage`` variant of ``Action: "authorize"``)::

    {"Action": "authorize",
     "Code": "4/0AXlqoi...",
     "RedirectUri": "postmessage"}

The one-shot code is exchanged server-side (the client secret never
reaches the browser) and the tokens are written to ``OAUTH_ACCOUNTS`` for
the signed-in user, or for the system superuser when no session is present.
```

#### 7. `POST` `/api/v1/google_drive/disconnect`

- **Handler:** `disconnect_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:834
- **Defined path:** `/disconnect`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.delete'))` | `dependency` | {'arg': "require_permission('system.google_drive.delete')"} |

**Docstring:**

```text
Remove the stored Google tokens.
```

#### 8. `GET` `/api/v1/google_drive/files`

- **Handler:** `list_stored_drive_files` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:800
- **Defined path:** `/files`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveStoredFileListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `page` | `int` | `Query(1, ge=1)` | `query` | {'arg': '1', 'ge': '1'} |
| `page_size` | `int` | `Query(50, ge=1, le=200)` | `query` | {'arg': '50', 'ge': '1', 'le': '200'} |
| `folder_id` | `str \| None` | `Query(None, alias='folderId', max_length=255)` | `query` | {'arg': 'None', 'alias': "'folderId'", 'max_length': '255'} |
| `search` | `str \| None` | `Query(None, max_length=200)` | `query` | {'arg': 'None', 'max_length': '200'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Files this system uploaded, read back from ``CMS_DRIVE_FILES``.

The live Drive listing (``GET /list``) is unchanged; this answers from the
database so the record survives even when Drive is unreachable.
```

#### 9. `POST` `/api/v1/google_drive/labels/apply`

- **Handler:** `drive_label_apply` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:1304
- **Defined path:** `/labels/apply`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any]` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.write'))` | `dependency` | {'arg': "require_permission('system.google_drive.write')"} |

**Docstring:**

```text
Apply a label to a Drive file for classification and metadata.

- **fileId**: Drive file ID to apply label to
- **labelId**: Label ID to apply
```

#### 10. `POST` `/api/v1/google_drive/labels/create`

- **Handler:** `drive_label_create` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:1256
- **Defined path:** `/labels/create`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any]` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.write'))` | `dependency` | {'arg': "require_permission('system.google_drive.write')"} |

**Docstring:**

```text
Create a new Drive label for document classification and metadata.

- **title**: Required label title
- **description**: Optional description
- **labelType**: Optional label type (e.g., 'confidentiality', 'department')
- **properties**: Optional structured metadata properties
```

#### 11. `GET` `/api/v1/google_drive/labels/list`

- **Handler:** `drive_labels_list` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:1288
- **Defined path:** `/labels/list`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
List all labels from Drive Labels API for document classification.

Returns cached/live labels that can be used to categorize files by
department, document type, confidentiality levels, or approval statuses.
```

#### 12. `POST` `/api/v1/google_drive/labels/remove`

- **Handler:** `drive_label_remove` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:1328
- **Defined path:** `/labels/remove`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `dict[str, Any]`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `body` | `dict[str, Any]` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.write'))` | `dependency` | {'arg': "require_permission('system.google_drive.write')"} |

**Docstring:**

```text
Remove a label from a Drive file.

- **fileId**: Drive file ID to remove label from
- **labelId**: Label ID to remove
```

#### 13. `GET` `/api/v1/google_drive/list`

- **Handler:** `list_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:724
- **Defined path:** `/list`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveListResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `folder_id` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `page_size` | `int` | `Query(100, ge=1, le=1000)` | `query` | {'arg': '100', 'ge': '1', 'le': '1000'} |
| `page_token` | `str \| None` | `Query(None)` | `query` | {'arg': 'None'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
List folders and files inside a Drive folder.
```

#### 14. `GET` `/api/v1/google_drive/status`

- **Handler:** `drive_status` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:256
- **Defined path:** `/status`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveConnectionStatus`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Whether the signed-in user has a usable Drive connection.
```

#### 15. `POST` `/api/v1/google_drive/summary`

- **Handler:** `drive_summary` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:848
- **Defined path:** `/summary`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveSummaryResponse`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `body` | `DriveSummaryRequest` | `` | `` |  |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.google_drive.read'))` | `dependency` | {'arg': "require_permission('system.google_drive.read')"} |

**Docstring:**

```text
Deep Drive summary: file/folder counts, type breakdown, largest/recent files.

Controlled by payload (POST = Action in body per GET/POST-only contract):
- Deep: walk the tree (bounded by MaxItems/MaxPages)
- MaxItems/MaxPages: hard caps on the walk
- Refresh: bypass the 2-minute cache
- IncludeTypes/Largest/Recent: toggle sections to save time
```

#### 16. `POST` `/api/v1/google_drive/upload`

- **Handler:** `upload_to_drive` (async)
- **Source:** `app/api/v1/endpoints/cms_oauth_v1.py`:748
- **Defined path:** `/upload`
- **Router:** object=`router` prefix=`/google_drive` resolved_base=`/api/v1/google_drive`
- **Mount/status:** DEFINED, NOT MOUNTED (legacy; active: cms_oauth.py)
- **Tags:** `['--------------------------- Google Drive - Cloud Manager ------------------------------']`
- **Response model:** `DriveFileUploadResult`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `file` | `UploadFile` | `File(...)` | `file` | {'arg': '...'} |
| `folder_id` | `str \| None` | `Form(None)` | `form` | {'arg': 'None'} |
| `make_public` | `bool` | `Form(False)` | `form` | {'arg': 'False'} |
| `session` | `AsyncSession` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |
| `current_user` | `CurrentUser` | `Depends(require_permission('system.media.create'))` | `dependency` | {'arg': "require_permission('system.media.create')"} |

**Docstring:**

```text
Upload an asset into Drive for use as a CMS media item.
```

---

## RTS Auth (legacy duplicate - not mounted)

- **Source files:** `app/api/v1/endpoints/rtsauth2.py`
- **Endpoints:** 2
- **Mount/status:** DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py) (2)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/rtsauth/oauth` | `rtsauth_oauth` | RTS SSO token endpoint (login or refresh) | DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py) |
| 2 | `POST` | `/rtsauth/register` | `rtsauth_register` | RTS SSO register (creates account and signs in) | DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py) |

### Endpoint details

#### 1. `POST` `/rtsauth/oauth`

- **Handler:** `rtsauth_oauth` (async)
- **Source:** `app/api/v1/endpoints/rtsauth2.py`:508
- **Defined path:** `/oauth`
- **Router:** object=`sso_auth` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py)
- **Tags:** `['--------------------------- RTS Auth ----------------------']`
- **Summary:** RTS SSO token endpoint (login or refresh)

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RtsOAuthRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `POST` `/rtsauth/register`

- **Handler:** `rtsauth_register` (async)
- **Source:** `app/api/v1/endpoints/rtsauth2.py`:738
- **Defined path:** `/register`
- **Router:** object=`sso_auth` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (duplicate; active: rtsauth.py)
- **Tags:** `['--------------------------- RTS Auth ----------------------']`
- **Summary:** RTS SSO register (creates account and signs in)
- **Status code:** `201`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `RtsRegisterRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## RTS Auth Passkeys (copy - not mounted)

- **Source files:** `app/api/v1/endpoints/rtsauth_passkey copy.py`
- **Endpoints:** 6
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) (6)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `POST` | `/rtsauth/passkey/login/options` | `passkey_login_options` | Passkey: start sign-in | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| 2 | `POST` | `/rtsauth/passkey/login/verify` | `passkey_login_verify` | Passkey: finish sign-in (same response as POST /rtsauth/oauth) | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| 3 | `POST` | `/rtsauth/passkey/register/options` | `passkey_register_options` | Passkey: start adding a passkey | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| 4 | `POST` | `/rtsauth/passkey/register/verify` | `passkey_register_verify` | Passkey: finish adding a passkey | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| 5 | `GET` | `/rtsauth/passkeys` | `passkey_list` | Passkey: list my passkeys | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |
| 6 | `DELETE` | `/rtsauth/passkeys/{passkey_id}` | `passkey_delete` | Passkey: remove one of my passkeys | DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py) |

### Endpoint details

#### 1. `POST` `/rtsauth/passkey/login/options`

- **Handler:** `passkey_login_options` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey copy.py`:361
- **Defined path:** `/passkey/login/options`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py)
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: start sign-in

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 2. `POST` `/rtsauth/passkey/login/verify`

- **Handler:** `passkey_login_verify` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey copy.py`:376
- **Defined path:** `/passkey/login/verify`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py)
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: finish sign-in (same response as POST /rtsauth/oauth)

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PasskeyLoginVerifyRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 3. `POST` `/rtsauth/passkey/register/options`

- **Handler:** `passkey_register_options` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey copy.py`:246
- **Defined path:** `/passkey/register/options`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py)
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: start adding a passkey

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `request` | `Request` | `` | `request` |  |
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 4. `POST` `/rtsauth/passkey/register/verify`

- **Handler:** `passkey_register_verify` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey copy.py`:291
- **Defined path:** `/passkey/register/verify`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py)
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: finish adding a passkey
- **Status code:** `201`

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `payload` | `PasskeyRegisterVerifyRequest` | `` | `` |  |
| `request` | `Request` | `` | `request` |  |
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 5. `GET` `/rtsauth/passkeys`

- **Handler:** `passkey_list` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey copy.py`:460
- **Defined path:** `/passkeys`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py)
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: list my passkeys

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

#### 6. `DELETE` `/rtsauth/passkeys/{passkey_id}`

- **Handler:** `passkey_delete` (async)
- **Source:** `app/api/v1/endpoints/rtsauth_passkey copy.py`:483
- **Defined path:** `/passkeys/{passkey_id}`
- **Router:** object=`passkey_router` prefix=`/rtsauth` resolved_base=`/rtsauth`
- **Mount/status:** DEFINED, NOT MOUNTED (copy; active: rtsauth_passkey.py)
- **Tags:** `['--------------------------- RTS Auth · Passkeys ----------------------']`
- **Summary:** Passkey: remove one of my passkeys

**Parameters (signature, best-effort):**

| Name | Annotation | Default | Source/marker | Meta |
|---|---|---|---|---|
| `passkey_id` | `int` | `` | `path` |  |
| `request` | `Request` | `` | `request` |  |
| `user_id` | `int` | `Depends(get_current_user_id)` | `dependency` | {'arg': 'get_current_user_id'} |
| `db` | `aiomysql.Connection` | `Depends(get_db)` | `dependency` | {'arg': 'get_db'} |

---

## Tests (non-production routes)

- **Source files:** `tests/test_language.py`
- **Endpoints:** 2
- **Mount/status:** mounted in main.py (app route) (2)

### Endpoint index

| # | Methods | Full path | Handler | Summary | Status |
|---:|---|---|---|---|---|
| 1 | `GET` | `/missing` | `missing` |  | mounted in main.py (app route) |
| 2 | `GET` | `/msg` | `msg` |  | mounted in main.py (app route) |

### Endpoint details

#### 1. `GET` `/missing`

- **Handler:** `missing` (sync)
- **Source:** `tests/test_language.py`:66
- **Defined path:** `/missing`
- **Router:** object=`app` prefix=`` resolved_base=``
- **Mount/status:** mounted in main.py (app route)

**Parameters:** none declared in signature (or not detected).

#### 2. `GET` `/msg`

- **Handler:** `msg` (sync)
- **Source:** `tests/test_language.py`:62
- **Defined path:** `/msg`
- **Router:** object=`app` prefix=`` resolved_base=``
- **Mount/status:** mounted in main.py (app route)

**Parameters:** none declared in signature (or not detected).

---

## Common Patterns

- **Headers/auth (typical):** `Authorization: Bearer <token>`; some flows also use `X-Requested-With: XMLHttpRequest`, tenant routing header `rty_database` / `db_name` / `database`, and/or HttpOnly auth cookies depending on endpoint/client.
- **Response casing:** predominantly PascalCase in project APIs (with some legacy/flat snake_case responses in specific auth/chat-demo flows).
- **Error envelope:** many endpoints use translated app error envelope (e.g. `Code`, `Message`, `Details`, `Errors`, `RequestId`); FastAPI validation/errors may also appear as `{"detail": ...}` depending on handler/path.
- **Rules (RULES_SYSTEM intent):** Create/Update/Get/Assign typically POST with payload; Delete commonly GET with query/payload identifiers; datatable lists commonly POST with `Pages/Records/Search/OrderBy/OrderDir` and per-item/collection total conventions where implemented (module-specific).
- **WebSockets:** dashboard/chat/notifications/chat-monitor use WS endpoints listed above (token/origin checks are endpoint-specific).

---

## Update Notes (delta vs previous API_URL_DOC)

### Post-scan implementation additions (asset categories)

- Implemented the five endpoints requested in `API_URL_DOC_NEW_REQUIRED.md`; they were **not** part of the original static scan:
  - `POST /api/v1/file_explorer/categories/list`
  - `POST /api/v1/file_explorer/categories/create`
  - `POST /api/v1/file_explorer/categories/update`
  - `GET /api/v1/file_explorer/categories/delete`
  - `POST /api/v1/file_explorer/categories/reorder`
- Backed by the new `EXPLORER_CATEGORIES` table (`app/models/explorer.py`), created and seeded by `explorer_store.ensure_tables`.
- All five reuse the existing `file_explorer` router/prefix and `system.file_explorer.<action>` permission guards; no new router registration was needed.
- Summary counts and the File Explorer section above were updated to include these routes.

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
- **Forum**: 32 route definition(s) documented from source scan.
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
- Google Drive nested subroutes now include `/api/v1/google_drive/activity/*` and `/api/v1/google_drive/labels/*` (mounted via `cms_oauth.py`). CMD drive endpoints also exist at `/api/v1/cmd/activity/*` and `/api/v1/cmd/labels/*`.
- Media module now includes dashboard and datatable/action endpoints: `/api/v1/media/dashboard`, `/files/list`, `/files/delete`, `/folders/star`, plus legacy/action handlers.
- Forum now follows RULES_SYSTEM.md payload-only action routes: `POST /api/v1/posts|categories|tags|series|comments/create|list|get|update|assign`, `GET /api/v1/posts|categories|tags|series|comments/delete?Id|Ids=...`, plus `POST /api/v1/posts/reactions/create` and `/posts/bookmarks/create`. Path-parameter routes such as `/api/v1/tags/{tag_id}` were removed from the forum router.

### Newly discovered paths (not present in previous API_URL_DOC path set, best-effort compare)

- **Count:** 306 resolved paths newly present vs previous doc set (includes corrected mounts, nested routes, legacy-defined files, test routes, and the implemented asset-category endpoints).

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

<details><summary><code>/api/v1/file_explorer</code> (21)</summary>

- `/api/v1/file_explorer/categories/create`
- `/api/v1/file_explorer/categories/delete`
- `/api/v1/file_explorer/categories/list`
- `/api/v1/file_explorer/categories/reorder`
- `/api/v1/file_explorer/categories/update`
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

<details><summary><code>/api/v1/google_drive</code> (14)</summary>

- `/api/v1/google_drive/activity/audit/list`
- `/api/v1/google_drive/activity/history`
- `/api/v1/google_drive/activity/query`
- `/api/v1/google_drive/activity/summary`
- `/api/v1/google_drive/activity/sync`
- `/api/v1/google_drive/labels/apply`
- `/api/v1/google_drive/labels/assign`
- `/api/v1/google_drive/labels/create`
- `/api/v1/google_drive/labels/delete`
- `/api/v1/google_drive/labels/file`
- `/api/v1/google_drive/labels/get`
- `/api/v1/google_drive/labels/list`
- `/api/v1/google_drive/labels/remove`
- `/api/v1/google_drive/labels/update`

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

<details><summary><code>/api/v1/rbac</code> (13)</summary>

- `/api/v1/rbac/permissions/users/list`
- `/api/v1/rbac/roles/create`
- `/api/v1/rbac/roles/delete`
- `/api/v1/rbac/roles/get`
- `/api/v1/rbac/roles/list`
- `/api/v1/rbac/roles/read`
- `/api/v1/rbac/roles/save`
- `/api/v1/rbac/roles/update`
- `/api/v1/rbac/user_roles/assign`
- `/api/v1/rbac/users/permissions/get`
- `/api/v1/rbac/users/permissions/list`
- `/api/v1/rbac/users/roles/assign`
- `/api/v1/rbac/users/roles/get`

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