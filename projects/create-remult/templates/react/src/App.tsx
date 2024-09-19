import reactLogo from "./assets/react.svg";
import remultLogo from "/remult.svg";
import "./App.css";

function App() {
  return (
    <>
      <div>
        <a href="https://remult.dev" target="_blank">
          <img src={remultLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>remult + react + express</h1>
      <h2>Welcome to project-name-to-be-replaced!</h2>
      <div className="card">
        <p>
          The frontend started 👍, now, to start the backend, open a second
          terminal and do and do:
        </p>
        <pre>npm run dev-node</pre>
        <p>
          You can already visit{" "}
          <a target="_blank" href="/api/admin">
            Admin 🌈
          </a>{" "}
          to make sure remult is initiated well.
        </p>
        <p>Now, let's add entities, go back to your terminal dans do:</p>
        <pre>npx remult-kit</pre>
        <br />
        <br />
        <br />
        <br />
        When everything is working, come and say hi
        <a href="https://github.com/remult/remult">GitHub Repo</a> 👋
      </div>
      <p className="read-the-docs">Click logos to learn more</p>
    </>
  );
}

export default App;
