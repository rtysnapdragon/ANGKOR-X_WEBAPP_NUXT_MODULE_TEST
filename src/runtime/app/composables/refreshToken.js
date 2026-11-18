export const useRefreshToken = performRefreshToken;
import { useUserData,useToast } from "#imports";
let isRefreshing = false;

async function performRefreshToken(force) {
  // wait for other refresh
  if (isRefreshing) {
    await new Promise((r) => setTimeout(r, 1000));
    return useRefreshToken();
  }

  // Check expired
  try {
    const userData = useUserData().value;
    // not data
    if (!userData) return;

    if (!force) {
      const dif = rdate().diff(userData.created_at).seconds;
      const difSeconds = Math.round(dif + 300);
      const isExpired = difSeconds >= userData.expires_in;
      useToast().add({title:"isExpired in refreshToken -- ",isExpired})
      if (!isExpired) return;
    }

    isRefreshing = true;
    await useAuth(isRefreshing);
  } finally {
    isRefreshing = false;
  }
}



// let refreshPromise = null;

// export const useRefreshToken = async (force = false) => {
//   // Reuse an existing refresh operation
//   if (refreshPromise) {
//     return await refreshPromise;
//   }

//   const userData = useUserData().value;

//   if (!userData?.refresh_token) {
//     return false;
//   }

//   // Refresh 5 minutes before expiration
//   if (!force) {
//     const expiresAt = userData.expires
//       ? new Date(userData.expires).getTime()
//       : new Date(userData.created_at).getTime() +
//         Number(userData.expires_in) * 1000;

//     if (!Number.isFinite(expiresAt)) {
//       return false;
//     }

//     const remainingMs = expiresAt - Date.now();

//     if (remainingMs > 5 * 60 * 1000) {
//       return true; // Still valid; no refresh required
//     }
//   }

//   refreshPromise = (async () => {
//     try {
//       const result = await useAuth();

//       if (result?.error?.value || !result?.data?.value?.access_token) {
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error("Token refresh failed:", error);
//       return false;
//     }
//   })();

//   try {
//     return await refreshPromise;
//   } finally {
//     refreshPromise = null;
//   }
// };