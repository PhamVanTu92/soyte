import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { PrimeReactProvider } from "primereact/api";
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <PrimeReactProvider
    value={{
      ripple: true,
      inputStyle: "outlined",
      pt: {
        dropdown: {
          input: { className: "text-xs text-gray-500 " },
          item: { className: "text-xs" },
          root: {
            className:
              "border border-gray-200 rounded-xl bg-gray-50 transition focus-within:border-primary-300",
          },
        },
        inputtext: {
          root: {
            className:
              "text-xs",
          },
        },
        calendar: {
          input: {
            className: "text-xs py-2 px-3 h-9 bg-gray-50",
          },
          dayLabel: {
            className: "text-xs",
          },
          timePicker: {
            className: "text-xs",
          },
          hourPicker: {
            className: "text-xs",
          },
          minutePicker: {
            className: "text-xs",
          },
          secondPicker: {
            className: "text-xs",
          },
          separator: {
            className: "text-xs",
          },
          panel: {
            className: "scale-90 origin-top text-xs",
          },
        },
      },
    }}
  >
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </PrimeReactProvider>,
);
