import { auth } from "../../../modules/auth/server/auth"; // import your auth config

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
