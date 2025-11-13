import { remult } from "remult";
import Tile, { type TileStatus } from "./Tile";
import { useState, useEffect } from "react";

export default function ServerStatus() {
  const [status, setStatus] = useState<TileStatus>("Loading");
  const [error, setError] = useState<JSX.Element | string>();
  useEffect(() => {
    remult
      .initUser()
      .then(() => setStatus("Success"))
      .catch(async (e) => {
        setStatus("Error");

        if (e.message?.includes("the server configuration")) {
          setError(
            <>
              Make sure to set the <code>BETTER_AUTH_SECRET</code> in the{" "}
              <code>.env</code> file. <br />
              Read more at{" "}
              <a href="https://www.better-auth.com/docs/reference/options#secret">
                better-auth docs
              </a>
              .
            </>,
          );
        } else
          setError(
            <>
              Please run <code>npm run dev-node</code> in a separate terminal.
            </>,
          );
      });
  }, []);

  const subtitle =
    status === "Success"
      ? "Up and running"
      : status === "Error"
        ? "There seems to be an issue"
        : status;

  return (
    <Tile title="Server Status" status={status} subtitle={subtitle}>
      {status === "Error" ? (
        <>
          <p>{error!}</p>
        </>
      ) : status === "Loading" ? (
        <p>Looking for the server...</p>
      ) : (
        <>
          <p>
            Everything sparkling! API is ready to be consumed. Find more
            information in the{" "}
            <a target="_blank" href="https://remult.dev/docs/rest-api">
              docs
            </a>
            .
          </p>
        </>
      )}
    </Tile>
  );
}
