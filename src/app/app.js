import { DebugLogger, DebugControl } from "../utils/debug/DebugLogger.js";

class FlowchartApp {
  constructor(options = {}) {
    this.options = {
      theme: "light",
      debug: false,
      ...options,
    };

    if (this.options.debug) {
      DebugControl.enableGlobal();
    } else {
      DebugControl.disableGlobal();
    }
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");
    this.log.exit("constructor");
  }

  async initialize() {
    this.log.enter("initialize");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.log.exit("initialize");
  }
}

if (typeof window !== "undefined") {
  const startApp = async () => {
    const loader = document.getElementById("loading-overlay");
    let app = null;

    try {
      if (loader) {
        loader.style.display = "flex";
      }

      app = new FlowchartApp({ debug: true });
      await app.initialize();

      window.flowchartApp = app;
    } catch (error) {
      if (app && app.log)
        app.log.error("Error initializing FlowchartApp:", error);
      else console.error("Error initializing FlowchartApp:", error);
    } finally {
      if (loader) {
        loader.classList.add("hide");
        setTimeout(() => {
          loader.style.display = "none";
        }, 500);
      }
    }
  };
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
}

export default FlowchartApp;
