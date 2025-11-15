/**
 * Centralized Debug Logger
 * Provides consistent debug output across the application
 */

export class DebugLogger {
  /**
   * Create a logger instance for a specific class instance
   */
  static for(instance, options = {}) {
    const moduleName = instance?.constructor?.name || "UnknownModule";
    return new DebugLogger(moduleName, options);
  }

  /**
   * Create a logger instance for a specific module
   */
  static get(moduleName, options = {}) {
    return new DebugLogger(moduleName, options);
  }

  constructor(moduleName, options = {}) {
    this.moduleName = moduleName;
    this.enabled = options.enabled ?? this.isDebugMode();
    this.level = options.level || "info"; // 'info', 'warn', 'error', 'debug'
    this.color = options.color || this.getModuleColor(moduleName);
    this.timestamp = options.timestamp ?? true;
  }

  /**
   * Check if debug mode is enabled globally
   */
  isDebugMode() {
    return (
      localStorage.getItem("DEBUG_MODE") === "true" ||
      window.DEBUG_MODE === true ||
      new URLSearchParams(window.location.search).has("debug")
    );
  }

  /**
   * Get color for module name
   */
  getModuleColor(moduleName) {
    const colors = {
      Editor: "#2196F3",
      NodeManager: "#4CAF50",
      EdgeManager: "#FF9800",
      ShapeRegistry: "#9C27B0",
      EventBus: "#F44336",
      ServiceContainer: "#00BCD4",
      HistoryManager: "#795548",
      SelectionManager: "#E91E63",
      LayerManager: "#3F51B5",
      PluginManager: "#009688",
      ThemeManager: "#FFC107",
      ValidationManager: "#673AB7",
      ClipboardManager: "#8BC34A",
      ExportManager: "#FF5722",
      SnapManager: "#607D8B",
      MenuBar: "#CDDC39",
      ToolBar: "#03A9F4",
      StatusBar: "#9E9E9E",
      LeftPanel: "#00E676",
      RightPanel: "#FF6E40",
      ShapeLoader: "#FFD740",
      NodeController: "#69F0AE",
      EdgeController: "#FF4081",
    };
    return colors[moduleName] || "#9E9E9E";
  }

  /**
   * Get timestamp string
   */
  getTimestamp() {
    if (!this.timestamp) return "";
    const now = new Date();
    return `[${now.toLocaleTimeString()}.${String(
      now.getMilliseconds()
    ).padStart(3, "0")}]`;
  }

  /**
   * Format log message
   */
  format(level, message, data) {
    const timestamp = this.getTimestamp();
    const prefix = `${timestamp} [${this.moduleName}] [${level.toUpperCase()}]`;
    return { prefix, message, data };
  }

  /**
   * Log info message
   */
  info(message, data = null) {
    if (!this.enabled) return;
    const {
      prefix,
      message: msg,
      data: d,
    } = this.format("info", message, data);
    console.log(
      `%c${prefix}%c ${msg}`,
      `color: ${this.color}; font-weight: bold`,
      "color: inherit",
      d || ""
    );
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (!this.enabled || this.level === "error") return;
    const {
      prefix,
      message: msg,
      data: d,
    } = this.format("debug", message, data);
    console.debug(
      `%c${prefix}%c ${msg}`,
      `color: ${this.color}; font-weight: bold`,
      "color: #666",
      d || ""
    );
  }

  /**
   * Log warning message
   */
  warn(message, data = null) {
    if (!this.enabled) return;
    const {
      prefix,
      message: msg,
      data: d,
    } = this.format("warn", message, data);
    console.warn(
      `%c${prefix}%c ${msg}`,
      `color: ${this.color}; font-weight: bold`,
      "color: #FF9800",
      d || ""
    );
  }

  /**
   * Log error message
   */
  error(message, error = null) {
    if (!this.enabled) return;
    const { prefix, message: msg } = this.format("error", message, error);
    console.error(
      `%c${prefix}%c ${msg}`,
      `color: ${this.color}; font-weight: bold`,
      "color: #F44336",
      error || ""
    );
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }

  /**
   * Log stage/phase information
   */
  stage(stageName, data = null) {
    if (!this.enabled) return;
    console.log(
      `%c${this.getTimestamp()} [${this.moduleName}] ▶ STAGE: ${stageName}`,
      `color: ${this.color}; font-weight: bold; font-size: 12px; background: #000; padding: 2px 6px; border-radius: 3px`,
      data || ""
    );
  }

  /**
   * Log method entry
   */
  enter(methodName, params = null) {
    if (!this.enabled || this.level === "error") return;
    console.log(
      `%c${this.getTimestamp()} [${this.moduleName}]%c ↓ ${methodName}()`,
      `color: ${this.color}; font-weight: bold`,
      "color: #4CAF50",
      params || ""
    );
  }

  /**
   * Log method exit
   */
  exit(methodName, result = null) {
    if (!this.enabled || this.level === "error") return;
    console.log(
      `%c${this.getTimestamp()} [${this.moduleName}]%c ↑ ${methodName}()`,
      `color: ${this.color}; font-weight: bold`,
      "color: #2196F3",
      result !== null ? result : ""
    );
  }

  /**
   * Group logs together
   */
  group(label, collapsed = false) {
    if (!this.enabled) return;
    const method = collapsed ? console.groupCollapsed : console.group;
    method(
      `%c${this.moduleName}: ${label}`,
      `color: ${this.color}; font-weight: bold`
    );
  }

  /**
   * End group
   */
  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }

  /**
   * Log performance timing
   */
  time(label) {
    if (!this.enabled) return;
    console.time(`${this.moduleName}:${label}`);
  }

  /**
   * End performance timing
   */
  timeEnd(label) {
    if (!this.enabled) return;
    console.timeEnd(`${this.moduleName}:${label}`);
  }

  /**
   * Log table data
   */
  table(data, columns) {
    if (!this.enabled) return;
    console.log(
      `%c${this.moduleName}:`,
      `color: ${this.color}; font-weight: bold`
    );
    console.table(data, columns);
  }

  /**
   * Enable debug mode
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable debug mode
   */
  disable() {
    this.enabled = false;
  }
}

/**
 * Global debug control
 */
export const DebugControl = {
  enableGlobal() {
    localStorage.setItem("DEBUG_MODE", "true");
    window.DEBUG_MODE = true;
    console.log(
      "%c🐛 Debug Mode ENABLED",
      "color: #4CAF50; font-size: 16px; font-weight: bold"
    );
  },

  disableGlobal() {
    localStorage.removeItem("DEBUG_MODE");
    window.DEBUG_MODE = false;
    console.log(
      "%c🐛 Debug Mode DISABLED",
      "color: #F44336; font-size: 16px; font-weight: bold"
    );
  },

  isEnabled() {
    return (
      localStorage.getItem("DEBUG_MODE") === "true" ||
      window.DEBUG_MODE === true
    );
  },
};

// Export for browser console access
if (typeof window !== "undefined") {
  window.DebugControl = DebugControl;
}

export default DebugLogger;
