import { Hono } from "hono";
import type { UserInfo } from "remult";

const validUsers: UserInfo[] = [
  { id: "1", name: "Jane", roles: ["admin"] },
  { id: "2", name: "Steve" },
];

const auth = new Hono();

auth.post("/api/signIn", async (c: any) => {
  const { username } = await c.req.json();
  const session = c.get("session");
  const user = validUsers.find((user) => user.name === username);
  if (user) {
    session.set("user", user);
    return c.json(user);
  } else {
    return c.json(user, 404);
  }
});

auth.post("/api/signOut", async (c: any) => {
  const session = c.get("session");
  session.set("user", null);
  return c.json("signed out", 404);
});

auth.get("/api/currentUser", async (c: any) => {
  const session = c.get("session");
  return c.json(session.get("user"));
});

export default auth;
