import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { Person } from "./Person";
import { repo } from "remult";

import { ReactTable, useRemultReactTable } from "./ReactTable.tsx";

function App() {
  const table = useRemultReactTable(repo(Person), {
    columns: {
      build: ({ build }) =>
        build(["firstName", "lastName", "age", "visits", "progress", "status"]),
    },
  });

  return <ReactTable table={table} />;
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
