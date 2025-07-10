import { hydrate, prerender as ssr } from "preact-iso";
import App from "./App";
import "./style.css";

if (typeof window !== "undefined") {
  const root = document.getElementById("app");
  hydrate(<App />, root);
}

export async function prerender() {
  return await ssr(<App />);
}
