
// import { watch } from "vue";

// const secretKey = "rtuserdata";

// const USER_KEY = "rty_user_data";
// const ACCESS_KEY = "rty_access_token";
// const REFRESH_KEY = "rty_refresh_token";

// export const useUserData = (val) => {
//   // Shared reactive state
//   const user = useState("rty_user_data_state", () => null);

//   // Cookies
//   const userCookie = useCookie(USER_KEY, {
//     path: "/",
//     sameSite: "lax",
//     default: () => null,
//   });

//   const accessCookie = useCookie(ACCESS_KEY, {
//     path: "/",
//     sameSite: "lax",
//     default: () => null,
//   });

//   const refreshCookie = useCookie(REFRESH_KEY, {
//     path: "/",
//     sameSite: "lax",
//     default: () => null,
//   });

//   // Save user data
//   const save = (data) => {
//     if (!data || typeof data !== "object") return;

//     user.value = data;

//     userCookie.value = encryptAES(
//       JSON.stringify(data),
//       secretKey
//     );

//     accessCookie.value = data.access_token ?? null;
//     refreshCookie.value = data.refresh_token ?? null;
//   };

//   // Clear all authentication data
//   const clear = () => {
//     user.value = null;

//     userCookie.value = null;
//     accessCookie.value = null;
//     refreshCookie.value = null;
//   };

//   // Initialize from cookies
//   if (val !== undefined) {
//     if (val && typeof val === "object") {
//       save(val);
//     } else {
//       clear();
//     }
//   } else if (user.value === null && userCookie.value) {
//     try {
//       user.value = JSON.parse(
//         decryptAES(userCookie.value, secretKey)
//       );
//     } catch (error) {
//       console.error("Failed to decrypt user cookie:", error);
//       clear();
//     }
//   }

//   return user;
// };



import { ref } from "vue";
const secretKey = "rtuserdata";
const key = "rty_user_data";

export const useUserData = (val) => {
  try {
    if (isNotEmpty(val) && typeof val == "object") {
      const data = encryptAES(JSON.stringify(val), secretKey);

      useCookie(key, {
        maxAge: val.expires_in,
      }).value = data;
      useCookie('rty_access_token').value = val.access_token
      useCookie('rty_refresh_token').value = val.refresh_token;
      return ref(val);
    } else {
      const data = useCookie(key).value;

      if (isNotEmpty(data)) {
        return ref(JSON.parse(decryptAES(data, secretKey)));
      } else {
        throw "Error";
      }
    }
  } catch (e) {
    return ref(null);
  }
};


// The most important issue is that Nuxt's useCookie() is designed to work with Nuxt's reactive state and SSR context. You should also make sure the encrypted value is serializable and that the cookie is not too large.

// Issue 2: Cookie size limitation
// Browsers generally limit individual cookies to approximately 4 KB.
// If val contains a large user profile, permissions, menus, or other data, the cookie may be rejected or truncated.


// The main limitation is approximately 4 KB per cookie (4,096 bytes), including the cookie name and attributes depending on browser implementation.