import extractJwtToken from "./extractJwtToken";
import { useUserData } from "~/composables/userData";

export default (token) => {
  console.log("==========================>extractDataFromAccessToken token => ", token)
  if (!token) {
    const userCatch = useUserData().value;

    if (!userCatch) return;

    const jwtPayload = extractJwtToken(userCatch.access_token);
    console.log("==========================>extractDataFromAccessToken jwtPayload => ", jwtPayload)

    return jwtPayload.payload;
  }

  const jwtPayload = extractJwtToken(token);
  console.log("==========================>extractDataFromAccessToken jwtPayload => ", jwtPayload)

  return jwtPayload.payload;
};
