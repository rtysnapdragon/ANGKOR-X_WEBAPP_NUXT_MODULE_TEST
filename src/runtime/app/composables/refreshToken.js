export const useRefreshToken = performRefreshToken;

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
      const dif = ocdate().diff(userData.created_at).seconds;
      const difSeconds = Math.round(dif + 300);
      const isExpired = difSeconds >= userData.expires_in;
      if (!isExpired) return;
    }

    isRefreshing = true;
    await useAuth();
  } finally {
    isRefreshing = false;
  }
}
