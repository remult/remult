import { useState, useEffect } from "react";
import { remult } from "remult";
import Tile, { type TileStatus } from "../Tile";
import { createAuthClient } from "better-auth/react";
import type { JSX } from "react";

const authClient = createAuthClient({
  // you can pass client configuration here
});

export default function Auth() {
  const [status, setStatus] = useState<TileStatus>("Loading");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    remult
      .initUser()
      .then(() => setStatus("Success"))
      .catch((e) => {
        setStatus("Error");
        if (e.message.includes("the server configuration")) {
          setMessageError(
            "Make sure to set the AUTH_SECRET in the .env file. Read more at auth.js docs. Please check the server terminal console for more information.",
          );
        }
      });
  }, []);

  const handleSignUp = async () => {
    const res = await authClient.signUp.email({
      name,
      email,
      password,
    });
    setMessageError(res.error?.message ?? "");
    await remult.initUser();
    window.location.reload();
  };

  const handleSignIn = async () => {
    await authClient.signIn.email({ email, password });
    await remult.initUser();
    window.location.reload();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    remult.user = undefined;
    window.location.reload();
  };

  let content: JSX.Element | string = <></>;

  if (status === "Loading") {
    content = <p>Checking your authentication status</p>;
  } else if (status === "Error") {
    content = <p>{messageError}</p>;
  } else if (remult.authenticated()) {
    const roles = remult.user?.roles ?? [];
    content = (
      <>
        <p>
          You are authenticated as <strong>{remult.user?.name}</strong>
          <br />
          <i>Roles:</i> {roles.length > 0 ? roles.join(", ") : "-"}
        </p>
        <div className="button-row">
          <button className="button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </>
    );
  } else {
    content = (
      <>
        <p>You are currently not authenticated</p>
        {messageError && (
          <>
            <div className="message error">
              <p>{messageError}</p>
            </div>
          </>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <div className="button-row">
          <button className="button" onClick={handleSignUp}>
            Sign Up
          </button>
          <button className="button" onClick={handleSignIn}>
            Sign In
          </button>
        </div>
        <div className="button-row">
          <a className="button" target="_blank" href="https://better-auth.com">
            Better-Auth Docs
          </a>
        </div>
      </>
    );
  }

  return (
    <Tile
      title="Auth"
      status={status}
      subtitle=""
      className="auth"
      width="half"
    >
      {content}
    </Tile>
  );
}
