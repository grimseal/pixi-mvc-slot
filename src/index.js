import "core-js/stable";
import "regenerator-runtime/runtime";
import App from "./App";

const app = new App();
app.init().then(() => console.log("application init"));