// helpers/api.js — Central API helper using useHttp composable

const api = {
  database:'api/v1/databases',
  databases:{
      list:'api/v1/database/list',
      create:'api/v1/database/create',
      update:'api/v1/database/update',
      delete:'api/v1/database/delete',
    },
  
  // ── LOCALIZATION (address catalogue) ──
  // POST-only CRUD: body `Action` = list | get | create | update | sync.
  // DELETE rides a GET: `?Action=delete&Id=..|Code=..` (superuser only).
  address: 'api/v1/address/countries',
  // Address CRUD for Provinces, Districts, Communes, Villages
  addressProvinces: (payload) => useHttp('/api/v1/address/provinces', { method: 'POST', data: payload }),
  addressDistricts: (payload) => useHttp('/api/v1/address/districts', { method: 'POST', data: payload }),
  addressCommunes: (payload) => useHttp('/api/v1/address/communes', { method: 'POST', data: payload }),
  addressVillages: (payload) => useHttp('/api/v1/address/villages', { method: 'POST', data: payload }),
  // Hierarchical localization endpoints with query param support
  localization: {
    countries: {
      list: 'api/v1/address/countries',
      // New: Get single country by Code (e.g., Cambodia only)
      getByCode: (code) => useHttp('/api/v1/address/countries', { 
        method: 'POST', 
        data: { Action: 'get', Code: code } 
      }),
      // New: Get Cambodia specifically
      getCambodia: () => useHttp('/api/v1/address/countries', { 
        method: 'POST', 
        data: { Action: 'get', Code: 'KH' } 
      }),
      count: 'api/v1/address/countries/count',
    },
    provinces: {
      list: 'api/v1/address/provinces',
      count: (countryId) => useHttp(`/api/v1/address/provinces/count?CountryId=${countryId}`, { method: 'GET' }),
    },
    districts: {
      list: 'api/v1/address/districts',
      count: (provinceId) => useHttp(`/api/v1/address/districts/count?ProvinceId=${provinceId}`, { method: 'GET' }),
    },
    communes: {
      list: 'api/v1/address/communes',
      count: (districtId) => useHttp(`/api/v1/address/communes/count?DistrictId=${districtId}`, { method: 'GET' }),
    },
    villages: {
      list: 'api/v1/address/villages',
      count: (communeId) => useHttp(`/api/v1/address/villages/count?CommuneId=${communeId}`, { method: 'GET' }),
    },
  },
  permissions: "/api/v1/userpermission/list",
  // ── RTS AUTH ──
  // Session endpoint used by the WEBAPP_NUXT_MODULE `composables/auth.js`
  // contract: POST { Username, Password, RememberMe, RefreshToken }.
  rtsauth: "api/v1/rtsauth/oauth",
  // ── AUTH ──
  auth: {
    login: (credentials) => useHttp('/auth/login', { method: 'POST', body: credentials }),
    register: (data) => useHttp('/auth/register', { method: 'POST', body: data }),
    logout: () => useHttp('/auth/logout', { method: 'POST' }),
    me: () => useHttp('/auth/me'),
    refreshToken: () => useHttp('/auth/refresh', { method: 'POST' }),
    forgotPassword: (email) => useHttp('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (data) => useHttp('/auth/reset-password', { method: 'POST', body: data }),
    googleAuth: (token) => useHttp('/auth/google', { method: 'POST', body: { token } }),
    facebookAuth: (token) => useHttp('/auth/facebook', { method: 'POST', body: { token } }),
  },

  oauth2: {
    status: 'api/v1/google-drive/status',
    list: 'api/v1/google-drive/list',
    // Uploads recorded in the DB (CMS_DRIVE_FILES), readable without Drive.
    files: 'api/v1/google-drive/files',
    upload: 'api/v1/google-drive/upload',
    disconnect: 'api/v1/google-drive/disconnect',
    // Full-page redirect handshake (fallback when the embedded widget is off).
    connect: 'api/v1/google-drive/connect',
    // Embedded Google Identity Services popup: the browser already holds a
    // one-shot code and posts it straight back. X-Requested-With is the header
    // Google's popup mode uses for CSRF protection, and the backend checks it.
    authorize:'api/v1/google-drive/connect'
    // authorize: (payload) => useHttp('api/v1/google-drive/connect', {
    //   method: 'POST',
    //   body: { Action: 'authorize', ...payload },
    //   headers: { 'X-Requested-With': 'XMLHttpRequest', },
    //   headers: { 'X-Requested-With': 'XmlHttpRequest', },
    // }),
  },


  // ── MEDIA (file explorer) ──
  // Legacy Action-based media library. The explorer UI now talks to
  // `fileExplorer` below; these stay for older callers.
  media: {
    files: 'api/v1/media/files',
    folders: 'api/v1/media/folders',
    upload: 'api/v1/media/files/upload',
    types: 'api/v1/media/types',
  },

  // ── FILE EXPLORER (multi-provider: google / supabase / telegram) ──
  // REST contract from RAMAGALLERY_FASTAPI `endpoints/file_explorer.py`:
  //   GET    /providers                       provider configuration status
  //   GET    /folders                         list folders (Root / ParentId / Search)
  //   POST   /folders                         create folder
  //   GET    /folders/{folderId}              folder detail
  //   PATCH  /folders/{folderId}              rename / move (ParentId=0 -> root)
  //   DELETE /folders/{folderId}              delete folder
  //   GET    /files                           list files (FolderId / Root / Provider /
  //                                           Search / IncludeDeleted, paged)
  //   POST   /files/upload                    multipart upload (Provider required)
  //   GET    /files/{fileId}                  file detail
  //   PATCH  /files/{fileId}                  rename / move (FolderId=0 -> root) / IsPublic
  //   DELETE /files/{fileId}?Purge=true       soft-delete; purge removes the provider object
  //   POST   /files/{fileId}/restore          restore a soft-deleted file
  //   GET    /files/{fileId}/download         stream bytes back from the provider
  // Plain strings + {placeholders}: callers interpolate and hand the finished
  // URL to `useHttp` (same convention as `cms` above).
  fileExplorer: {
    providers: 'api/v1/file_explorer/providers',
    // folders: 'api/v1/file_explorer/folders',
    folder: 'api/v1/file_explorer/folders/{folderId}',
    files: 'api/v1/file_explorer/files',
    file: 'api/v1/file_explorer/files/{fileId}',
    upload: 'api/v1/file_explorer/files/upload',
    restore: 'api/v1/file_explorer/files/{fileId}/restore',
    download: 'api/v1/file_explorer/files/download',

    folders:{
      list:'api/v1/file_explorer/folders',
      delete:'/api/v1/file_explorer/folders/{folder_id}', // GET
    }
  },

  // - /api/v1/notification/get (POST) - List notifications                                                                                          Create notification API endpoints       
  //    - /api/v1/notification/countunread (GET) - Get unread count                                                                                     in FastAPI backend                      
  //    - /api/v1/notification/markallasread (POST) - Mark all as read                                                                                                                          
  //    - /api/v1/notification/markasread (POST) - Mark single as read                                                                                  Context                                 
  //    - /api/v1/notification/createtoken (POST) - Create push token                                                                                   73,523 tokens                           
  //    - /api/v1/notification/delete (GET with Id query param) - Delete single                                                                         7% used                                 
  //    - /api/v1/notification/deleteall (GET) - Delete all                                                                                             $0.00 spent                             
  //    - /api/v1/notification/markasreadbytype (POST with TypeCode query) - Mark by type                                                                                                       
  //    - /api/v1/notification/countunreadbyappmodes (GET) - Count by app modes               
                                                                                                                
    //  - PascalCase response fields via schemas ✓                                                                                                                                              
    //  - App modes: WebApp/Web/Push grouping ✓                                                                                                             OpenCode includes free models       
    //  - Delete uses GET with query params ✓                                                                                                               so you can start immediately.       
    //  - List uses POST with payload ✓                                                                                                                                                         
                                       


  // ── NOTIFICATIONS ──
  notification: {
    // POST /api/v1/notification/get — list with payload
    get: 'api/v1/notification/get', // by user
    list: 'api/v1/notifications/list',
    
    // GET /api/v1/notification/countunread — unread count
    getUnread: 'api/v1/notification/countunread',
    
    // GET /api/v1/notification/countunreadbyappmodes — grouped counts
    countUnreadByAppModes: '/api/v1/notification/countunreadbyappmodes',
    
    // POST /api/v1/notification/markallasread
    markAllAsRead: '/api/v1/notifications/markallasread',
    
    // POST /api/v1/notification/markasread — single
    markAsRead: '/api/v1/notifications/markasread',
    
    // POST /api/v1/notification/createtoken — push token
    createToken: '/api/v1/notification/createtoken',
    createNotificationToken: '/api/v1/notification/createtoken',
    
    // GET /api/v1/notification/delete?Id=... — delete single (per RULES_SYSTEM.md)
    delete: '/api/v1/notification/clear',
    
    // GET /api/v1/notification/deleteall — delete all
    deleteAll: '/api/v1/notification/clearall',
    
    // POST /api/v1/notification/markasreadbytype — mark by type
    markAsReadByType: '/api/v1/notification/markasreadbytype', 
  },

    //   notification: {
    //   list: "/api/v1/notification/get",
    //   getUnread: "/api/v1/notification/countunread",
    //   markAllRead: "/api/v1/notification/markallasread",
    //   markRead: "/api/v1/notification/markasread",
    //   createToken: "/api/v1/notification/createtoken",
    //   delete: "/api/v1/notification/delete",
    //   deleteAll: "/api/v1/notification/deleteall",
    //   markAsReadByType: "api/notification/markasreadbytype",
    //   countUnreadByAppModes: "api/notification/countunreadbyappmodes",
    // },

  // ── USER ──
  user: {
    getProfile: () => useHttp('/user/profile'),
    updateProfile: (data) => useHttp('/user/profile', { method: 'PUT', body: data }),
    updatePassword: (data) => useHttp('/user/password', { method: 'PUT', body: data }),
    uploadAvatar: (formData) => useHttp('/user/avatar', { method: 'POST', body: formData }),
    updateSettings: (data) => useHttp('/user/settings', { method: 'PUT', body: data }),

    list:'api/v1/users/list',
    detail:'/api/v1/users/detail',
    update: '/api/v1/users/update',
    delete: '/api/v1/users/delete',
    changePassword:'/api/v1/users/changePassword',
  },

  // ── USER PROFILE ──
  // Consumed by `app/stores/userProfile.js` through `helper().api`. Plain
  // strings only: the store passes them straight to `useHttp`, which supplies
  // the auth headers. `userInfo` / `userUpdate` / the change* endpoints are
  // POST, the signature endpoints are GET.
  userInfo: '/api/v1/user/profile/info',
  userUpdate: '/api/v1/user/profile/update',
  userInfoChangePhone: '/api/v1/user/profile/changePhone',
  userChangeEmail: '/api/v1/user/profile/changeEmail',
  userChangePassword: '/api/v1/user/profile/changePassword',
  userAvatar: '/api/v1/user/profile/avatar',
  // Addresses (1:N) bound to the Cambodian catalogue — POST only.
  userAddress: '/api/v1/user/profile/address',
  userAddressSave: '/api/v1/user/profile/address/save',
  userAddressDelete: '/api/v1/user/profile/address/delete',
  userAddressSetDefault: '/api/v1/user/profile/address/setDefault',
  profile: {
    signature: {
      list: '/api/v1/employee/get_signature',
      add: '/api/v1/employee/add_file_signature',
      upload: '/api/v1/employee/upload_signature',
      delete: '/api/v1/employee/delete_signature',
    },
  },
  employee: {
    // `userProfile.getEmployeeDetail` interpolates `?EmployeeId={id}` onto this.
    detail: '/api/v1/employee/detail',
  },

  permission: {
    list: 'api/v1/permission/list',
    get: 'api/v1/permission/get',
    create: 'api/v1/permission/create',
    update: 'api/v1/permission/update',
    delete: 'api/v1/permission/delete',
  },

  // ── CMS MANAGEMENT ──
  // Plain strings only. Callers interpolate the `{placeholders}` and hand the
  // finished URL to `useHttp` themselves.
  cms: {
    meta: 'api/v1/cms-mgmt/meta',
    // {resource} -> pages | menus | menu_items | banners | announcements | ...
    resource: 'api/v1/cms-mgmt/{resource}',
    revisions: 'api/v1/cms-mgmt/revisions/all',
    recordRevisions: 'api/v1/cms-mgmt/revisions/record/{resource}/{recordId}',
    revisionDiff: 'api/v1/cms-mgmt/revisions/{revisionId}/diff',
    restoreRevision: 'api/v1/cms-mgmt/revisions/{revisionId}/restore',
    translations: 'api/v1/cms-mgmt/translations/{resource}/{recordId}',
    themes: 'api/v1/cms-mgmt/themes/list',
    theme: 'api/v1/cms-mgmt/themes/detail',
    webConfig: 'api/v1/cms-mgmt/web-config',
    auditLogs: 'api/v1/cms-mgmt/audit-logs',
  },

  // ── DASHBOARD ──
  dashboard: {
    summary: 'api/v1/dashboard/summary',
    users: (params) => useHttp('api/v1/dashboard/users', { params }),
    activity: (params) => useHttp('api/v1/dashboard/activity', { params }),
    activityList: 'api/v1/dashboard/activity',
    ws: 'ws/dashboard',
  },

  // ── RBAC ──
  // FORUM (posts, categories, tags, series, comments)
  // REST contract from RAMAGALLERY_FASTAPI `endpoints/{posts,comments}.py`.
  // Lists: posts/categories/tags/series are `POST .../list` with
  // `{ page, page_size }`; comments are `GET /comments?PostId=..&page=..`.
  // Mutations: `POST` to create, `PATCH /{id}` to update (posts / categories /
  // comments only), `DELETE /{id}` to remove. Every `{id}` is interpolated by
  // the caller and handed to `useHttp` as a finished URL.
  forum: {
    posts: 'api/v1/posts',
    postsList: 'api/v1/posts/list',
    post: 'api/v1/posts/{id}',
    categories: 'api/v1/categories',
    categoriesList: 'api/v1/categories/list',
    category: 'api/v1/categories/{id}',
    tags: 'api/v1/tags',
    tagsList: 'api/v1/tags/list',
    tag: 'api/v1/tags/{id}',
    series: 'api/v1/series',
    seriesList: 'api/v1/series/list',
    seriesItem: 'api/v1/series/{id}',
    comments: 'api/v1/comments',
    comment: 'api/v1/comments/{id}',
  },

  rbac: {
    me: 'api/v1/rbac/me',
    manifest: 'api/v1/rbac/manifest',
    databases: 'api/v1/rbac/databases',
    syncState: 'api/v1/rbac/sync-state',
    roles: {
      list:'api/v1/rbac/roles/list'
    },
    assignRole: 'api/v1/rbac/roles/assign',
    setRolePermissions: 'api/v1/rbac/roles/permissions',
    permissions: 'api/v1/rbac/permissions/list',
    permissionMatrix: 'api/v1/rbac/permissions/matrix',
    roleUsers: 'api/v1/rbac/permissions/users',
    sync: 'api/v1/rbac/sync',
  },

  // ── MESSAGING ──
  messaging: {
    conversations: 'api/v1/messaging/conversation',
    conversationsList: 'api/v1/messaging/conversations',
    send: 'api/v1/messaging/send',
    markRead: 'api/v1/messaging/mark-read',
    notifications: 'api/v1/messaging/notifications/list',
    markNotificationRead: 'api/v1/messaging/notifications/mark-read',
    markAllNotificationsRead: 'api/v1/messaging/notifications/read-all',
    monitor: {
      topConversations: 'api/v1/messaging/monitor/top-conversations',
      activeUsers: 'api/v1/messaging/monitor/active-users',
    },
  },

  // ── CHAT ──
  // New chat endpoints using MongoDB for content + MySQL for metadata
  // POST: Create, Update, Get, Assign
  // GET: Delete with URL query params (Id)
  chat: {
    send: 'api/v1/chat/send',
    get: 'api/v1/chat/get',
    update: 'api/v1/chat/update',
    assign: 'api/v1/chat/assign',
    delete: '/api/v1/chat/delete',
    // ── CHAT MONITOR (alias endpoints) ──
    chatMonitor: {
      topConversations: 'api/v1/chat/chat_monitor/top_conversations',
      activeUsers: 'api/v1/chat/chat_monitor/active_users',
    },
    conversationsList: 'api/v1/chat/conversations',
    markRead: 'api/v1/chat/mark_read',
  },


  // ── MEMBERSHIPS ──
  memberships: {
    plans: 'api/v1/memberships/plans',
    plan: 'api/v1/memberships/plans/{plan_id}',
    planList: 'api/v1/plans/list',
    planUpdate: 'api/v1/memberships/plans/update/{plan_id}',
    planDelete: 'api/v1/memberships/plans/delete/{plan_id}',
    planCreate: 'api/v1/memberships/plans/create',
    subscriptions: 'api/v1/memberships/subscriptions',
    subscriptionList: 'api/v1/subscriptions/subscriptions/list',
    // subscriptionList: 'api/v1/subscriptions/plans/list',
    // subscriptionList: 'api/v1/memberships/subscriptions/list',
    subscription: 'api/v1/memberships/subscriptions/{subscription_id}',
    subscriptionUpdate: 'api/v1/memberships/subscriptions/update/{subscription_id}',
    join: 'api/v1/memberships/join',
    payments: 'api/v1/memberships/payments',
    payment: 'api/v1/memberships/payments/{payment_id}',
    paymentComplete: 'api/v1/memberships/payments/{payment_id}/complete',
    paymentUpdate: 'api/v1/memberships/payments/update/{payment_id}',
  },
}

export default api