import { useState, useEffect } from "react";
import { remult } from "remult";
import Tile, { type TileStatus } from "../Tile";
import type { JSX } from "react";

export default function Auth() {
  const [status, setStatus] = useState<TileStatus>("Loading");
  const [error, setError] = useState<JSX.Element | string>();
  useEffect(() => {
    remult
      .initUser()
      .then(() => setStatus("Success"))
      .catch((e) => {
        setStatus("Error");
        if (e.message.includes("the server configuration")) {
          setError(
            <>
              Make sure to set the <code>AUTH_SECRET</code> in the{" "}
              <code>.env</code> file. <br />
              Read more at{" "}
              <a href="https://errors.authjs.dev#missingsecret">auth.js docs</a>
              .
              <br />
              Please check the server terminal console for more information.
            </>,
          );
        }
      });
  }, []);

  let content: JSX.Element | string = <></>;

  let tileSubtitle = "";
  if (status === "Loading") {
    tileSubtitle = "Checking your authentication status";
  } else if (status === "Error") {
    content = <p>{error}</p>;
    tileSubtitle = "There seems to be an issue";
  } else if (remult.authenticated()) {
    content = (
      <>
        <p>
          You are authenticated as <strong>{remult.user?.name}</strong>
        </p>
        <div className="button-row">
          <a className="button" href="/auth/signout">
            Sign Out
          </a>
        </div>
      </>
    );
  } else {
    content = (
      <>
        <p>You are currently not authenticated</p>
        <div className="button-row">
          <a className="button" href="/auth/signin">
            Sign In
          </a>
          <a className="button" target="_blank" href="https://authjs.dev">
            Auth.js Docs
          </a>
        </div>
      </>
    );
  }

  return (
    <Tile
      title="Auth"
      status={status}
      subtitle={tileSubtitle}
      className="auth"
      width="half"
    >
      {content}
    </Tile>
  );
}
