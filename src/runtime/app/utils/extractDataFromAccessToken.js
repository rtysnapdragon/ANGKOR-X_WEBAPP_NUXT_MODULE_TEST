import extractJwtToken from "./extractJwtToken";

export default (token) => {
  if (!token) {
    const userCatch = useUserData().value;

    if (!userCatch) return;

    const jwtPayload = extractJwtToken(userCatch.access_token);

    return jwtPayload.payload;
  }

  const jwtPayload = extractJwtToken(token);

  return jwtPayload.payload;
};
