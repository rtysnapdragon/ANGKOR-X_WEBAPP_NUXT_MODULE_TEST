// import { ref } from "vue";
// const secretKey = "rtuserdata";
// const key = "rty_user_data";

// export const useUserData = (val) => {
//   console.log("Val in useUserDAta in Module --------------- ", val)
//   try {
//     if (isNotEmpty(val) && typeof val == "object") {
//       const data = encryptAES(JSON.stringify(val), secretKey);

//       useCookie(key, {
//         // maxAge: val.expires_in,
//       }).value = data;

//       return ref(val);
//     } else {
//       const data = useCookie(key).value;

//       if (isNotEmpty(data)) {
//         return ref(JSON.parse(decryptAES(data, secretKey)));
//       } else {
//         throw "Error";
//       }
//     }
//   } catch (e) {
//     return ref(null);
//   }
// };


import { ref } from 'vue'

const SECRET_KEY = 'rtuserdata'

const COOKIE_NAMES = {
  user: 'rty_user_data',
  access: 'rty_access_token',
  refresh: 'rty_refresh_token',
}

const getCookieOptions = (maxAge) => ({
  path: '/',
  sameSite: 'lax',
  secure: import.meta.client
    ? window.location.protocol === 'https:'
    : process.env.NODE_ENV === 'production',
  ...(maxAge > 0 ? { maxAge } : {}),
})

export const useUserData = (val) => {
  // const userCookie = useCookie(COOKIE_NAMES.user)
  // const accessCookie = useCookie(COOKIE_NAMES.access)
  // const refreshCookie = useCookie(COOKIE_NAMES.refresh)
  const userCookie = useCookie(COOKIE_NAMES.user, {
    path: '/',
    sameSite: 'lax',
    secure: import.meta.client
      ? window.location.protocol === 'https:'
      : process.env.NODE_ENV === 'production',
  })

  const accessCookie = useCookie(COOKIE_NAMES.access, {
    path: '/',
    sameSite: 'lax',
    secure: import.meta.client
      ? window.location.protocol === 'https:'
      : process.env.NODE_ENV === 'production',
    maxAge: Number(val?.expires_in) || 3600,
  })

  const refreshCookie = useCookie(COOKIE_NAMES.refresh, {
    path: '/',
    sameSite: 'lax',
    secure: import.meta.client
      ? window.location.protocol === 'https:'
      : process.env.NODE_ENV === 'production',
    maxAge: Number(val?.refresh_lifetime) || 604800,
  })

  try {
    // SET authentication data
    if (val && typeof val === 'object') {
      const accessLifetime = Number(val.expires_in) || 3600
      const refreshLifetime = Number(val.refresh_lifetime) || 604800

      const userData = {
        ...val,
        created_at: val.created_at || new Date().toISOString(),
      }

      // 1. Store encrypted complete user data
      userCookie.value = encryptAES(
        JSON.stringify(userData),
        SECRET_KEY
      )

      // 2. Store access token separately
      accessCookie.value = userData.access_token || null

      // 3. Store refresh token separately
      refreshCookie.value = userData.refresh_token || null

      return ref(userData)
    }

    // GET authentication data
    if (userCookie.value) {
      const decrypted = decryptAES(userCookie.value, SECRET_KEY)
      return ref(JSON.parse(decrypted))
    }

    return ref(null)
  } catch (error) {
    console.error('[useUserData] Cookie operation failed:', error)
    return ref(null)
  }
}

/**
 * Get individual authentication tokens.
 */
export const getAuthTokens = () => ({
  accessToken: useCookie(COOKIE_NAMES.access).value,
  refreshToken: useCookie(COOKIE_NAMES.refresh).value,
})

/**
 * Clear authentication cookies.
 */
export const clearUserData = () => {
  useCookie(COOKIE_NAMES.user).value = null
  useCookie(COOKIE_NAMES.access).value = null
  useCookie(COOKIE_NAMES.refresh).value = null
}
