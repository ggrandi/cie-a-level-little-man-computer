import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./App";

// create the main rendering entrypoint for the app
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.querySelector("[data-reactroot]")
);
