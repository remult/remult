import { useState, useEffect } from "react";
import { type UserInfo, remult } from "remult";

export default function Auth() {
  const [user, setUser] = useState<UserInfo | undefined | "loading">("loading");
  useEffect(() => {
    remult.initUser().then(setUser);
  }, []);
  if (user === "loading") return <div>Auth: ⌛</div>;
  if (remult.authenticated())
    return (
      <div>
        Auth:✅ Hello {remult.user?.name} <a href="/auth/signout">Sign Out</a>
      </div>
    );
  return (
    <div>
      Auth:✅ Not authenticated, <a href="/auth/signin">Sign In</a>
    </div>
  );
}
