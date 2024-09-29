import { useState, useEffect } from "react";

export default function CheckServer() {
  const [status, setStatus] = useState<"⌛" | "✅" | "❌">("⌛");
  useEffect(() => {
    fetch("/api/me")
      .then((x) => x.json())
      .then((x) => setStatus(x !== undefined ? "✅" : "❌"))
      .catch(() => setStatus("❌"));
  }, []);
  return (
    <div>
      Api status:{" "}
      {status === "❌" ? (
        <>
          {status} Please run <code>npm run dev-node</code> in a separate
          terminal
        </>
      ) : (
        status
      )}
    </div>
  );
}
