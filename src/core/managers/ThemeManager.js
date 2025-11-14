/**
 * ThemeManager.js - Manages visual themes and styling
 *
 * Responsibilities:
 * - Define and manage themes (light/dark/custom)
 * - Apply theme colors to nodes and edges
 * - Handle theme switching
 * - Persist theme preferences
 * - Support custom color palettes
 *
 * @module core/managers/ThemeManager
 */

export class ThemeManager {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;

    // Current theme
    this.currentTheme = "light";

    // Built-in themes
    this.themes = new Map();

    // Custom colors
    this.customColors = {};

    this._registerDefaultThemes();
    this._loadThemePreference();
  }

  /**
   * Register default themes
   * @private
   */
  _registerDefaultThemes() {
    // Light theme
    this.addTheme("light", {
      name: "Light",
      canvas: {
        background: "#ffffff",
        grid: "#e0e0e0",
        gridDot: "#cccccc",
      },
      node: {
        fill: "#ffffff",
        stroke: "#1976d2",
        strokeWidth: 2,
        text: "#333333",
        selectedStroke: "#ff6b00",
        hoverStroke: "#2196f3",
      },
      edge: {
        stroke: "#757575",
        strokeWidth: 2,
        arrow: "#757575",
        selectedStroke: "#ff6b00",
        hoverStroke: "#2196f3",
        label: "#333333",
      },
      selection: {
        box: "#2196f3",
        boxOpacity: 0.2,
        handles: "#2196f3",
      },
      guides: {
        color: "#00aaff",
        width: 1,
        opacity: 0.7,
      },
      panel: {
        background: "#f5f5f5",
        border: "#e0e0e0",
        text: "#333333",
      },
      toolbar: {
        background: "#fafafa",
        border: "#e0e0e0",
        buttonHover: "#e0e0e0",
        buttonActive: "#2196f3",
        text: "#333333",
      },
    });

    // Dark theme
    this.addTheme("dark", {
      name: "Dark",
      canvas: {
        background: "#1e1e1e",
        grid: "#2d2d2d",
        gridDot: "#3d3d3d",
      },
      node: {
        fill: "#2d2d2d",
        stroke: "#64b5f6",
        strokeWidth: 2,
        text: "#e0e0e0",
        selectedStroke: "#ff9800",
        hoverStroke: "#90caf9",
      },
      edge: {
        stroke: "#9e9e9e",
        strokeWidth: 2,
        arrow: "#9e9e9e",
        selectedStroke: "#ff9800",
        hoverStroke: "#90caf9",
        label: "#e0e0e0",
      },
      selection: {
        box: "#64b5f6",
        boxOpacity: 0.2,
        handles: "#64b5f6",
      },
      guides: {
        color: "#4fc3f7",
        width: 1,
        opacity: 0.7,
      },
      panel: {
        background: "#252525",
        border: "#3d3d3d",
        text: "#e0e0e0",
      },
      toolbar: {
        background: "#2d2d2d",
        border: "#3d3d3d",
        buttonHover: "#3d3d3d",
        buttonActive: "#64b5f6",
        text: "#e0e0e0",
      },
    });

    // High contrast theme
    this.addTheme("high-contrast", {
      name: "High Contrast",
      canvas: {
        background: "#000000",
        grid: "#333333",
        gridDot: "#555555",
      },
      node: {
        fill: "#000000",
        stroke: "#ffffff",
        strokeWidth: 3,
        text: "#ffffff",
        selectedStroke: "#ffff00",
        hoverStroke: "#00ffff",
      },
      edge: {
        stroke: "#ffffff",
        strokeWidth: 3,
        arrow: "#ffffff",
        selectedStroke: "#ffff00",
        hoverStroke: "#00ffff",
        label: "#ffffff",
      },
      selection: {
        box: "#ffffff",
        boxOpacity: 0.3,
        handles: "#ffffff",
      },
      guides: {
        color: "#00ffff",
        width: 2,
        opacity: 1,
      },
      panel: {
        background: "#000000",
        border: "#ffffff",
        text: "#ffffff",
      },
      toolbar: {
        background: "#1a1a1a",
        border: "#ffffff",
        buttonHover: "#333333",
        buttonActive: "#ffffff",
        text: "#ffffff",
      },
    });
  }

  /**
   * Load theme preference from storage
   * @private
   */
  _loadThemePreference() {
    try {
      const saved = localStorage.getItem("flowchart-editor-theme");
      if (saved && this.themes.has(saved)) {
        this.setTheme(saved, false);
      }
    } catch (error) {
      // localStorage not available
    }
  }

  /**
   * Add a custom theme
   * @param {string} id - Theme identifier
   * @param {Object} theme - Theme definition
   */
  addTheme(id, theme) {
    this.themes.set(id, theme);

    this.eventBus.emit("theme:added", { id, theme });
  }

  /**
   * Remove a theme
   * @param {string} id - Theme identifier
   */
  removeTheme(id) {
    if (id === "light" || id === "dark" || id === "high-contrast") {
      console.warn("Cannot remove built-in themes");
      return;
    }

    this.themes.delete(id);

    // Switch to light if current theme was removed
    if (this.currentTheme === id) {
      this.setTheme("light");
    }

    this.eventBus.emit("theme:removed", { id });
  }

  /**
   * Set active theme
   * @param {string} themeId - Theme to activate
   * @param {boolean} persist - Save preference
   */
  setTheme(themeId, persist = true) {
    if (!this.themes.has(themeId)) {
      console.warn(`Theme '${themeId}' not found`);
      return;
    }

    this.currentTheme = themeId;
    const theme = this.themes.get(themeId);

    // Update state
    this.stateManager.setState("theme.current", themeId);
    this.stateManager.setState("theme.colors", theme);

    // Persist preference
    if (persist) {
      try {
        localStorage.setItem("flowchart-editor-theme", themeId);
      } catch (error) {
        // localStorage not available
      }
    }

    // Apply theme to DOM
    this._applyThemeToDOM(theme);

    // Emit event
    this.eventBus.emit("theme:changed", { themeId, theme });
  }

  /**
   * Apply theme colors to DOM
   * @private
   */
  _applyThemeToDOM(theme) {
    const root = document.documentElement;

    // Canvas colors
    root.style.setProperty("--canvas-bg", theme.canvas.background);
    root.style.setProperty("--canvas-grid", theme.canvas.grid);
    root.style.setProperty("--canvas-grid-dot", theme.canvas.gridDot);

    // Node colors
    root.style.setProperty("--node-fill", theme.node.fill);
    root.style.setProperty("--node-stroke", theme.node.stroke);
    root.style.setProperty("--node-text", theme.node.text);
    root.style.setProperty("--node-selected", theme.node.selectedStroke);
    root.style.setProperty("--node-hover", theme.node.hoverStroke);

    // Edge colors
    root.style.setProperty("--edge-stroke", theme.edge.stroke);
    root.style.setProperty("--edge-arrow", theme.edge.arrow);
    root.style.setProperty("--edge-selected", theme.edge.selectedStroke);
    root.style.setProperty("--edge-hover", theme.edge.hoverStroke);
    root.style.setProperty("--edge-label", theme.edge.label);

    // Panel colors
    root.style.setProperty("--panel-bg", theme.panel.background);
    root.style.setProperty("--panel-border", theme.panel.border);
    root.style.setProperty("--panel-text", theme.panel.text);

    // Toolbar colors
    root.style.setProperty("--toolbar-bg", theme.toolbar.background);
    root.style.setProperty("--toolbar-border", theme.toolbar.border);
    root.style.setProperty("--toolbar-text", theme.toolbar.text);
  }

  /**
   * Get current theme
   * @returns {Object}
   */
  getCurrentTheme() {
    return {
      id: this.currentTheme,
      ...this.themes.get(this.currentTheme),
    };
  }

  /**
   * Get theme by ID
   * @param {string} id - Theme identifier
   * @returns {Object}
   */
  getTheme(id) {
    return this.themes.get(id);
  }

  /**
   * Get all available themes
   * @returns {Array}
   */
  getAllThemes() {
    return Array.from(this.themes.entries()).map(([id, theme]) => ({
      id,
      name: theme.name,
    }));
  }

  /**
   * Get color from current theme
   * @param {string} path - Dot notation path (e.g., 'node.fill')
   * @returns {string}
   */
  getColor(path) {
    const theme = this.themes.get(this.currentTheme);
    const parts = path.split(".");

    let value = theme;
    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  /**
   * Set custom color override
   * @param {string} path - Dot notation path
   * @param {string} color - Color value
   */
  setCustomColor(path, color) {
    this.customColors[path] = color;

    // Apply immediately if it's a DOM property
    const cssVar = this._pathToCSSVar(path);
    if (cssVar) {
      document.documentElement.style.setProperty(cssVar, color);
    }

    this.eventBus.emit("theme:color:changed", { path, color });
  }

  /**
   * Clear custom color overrides
   */
  clearCustomColors() {
    this.customColors = {};

    // Re-apply current theme
    const theme = this.themes.get(this.currentTheme);
    this._applyThemeToDOM(theme);

    this.eventBus.emit("theme:colors:cleared");
  }

  /**
   * Convert path to CSS variable name
   * @private
   */
  _pathToCSSVar(path) {
    const mapping = {
      "canvas.background": "--canvas-bg",
      "node.fill": "--node-fill",
      "node.stroke": "--node-stroke",
      "node.text": "--node-text",
      "edge.stroke": "--edge-stroke",
      "panel.background": "--panel-bg",
      "toolbar.background": "--toolbar-bg",
    };

    return mapping[path];
  }

  /**
   * Detect system dark mode preference
   * @returns {boolean}
   */
  prefersDarkMode() {
    if (window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  }

  /**
   * Auto-switch theme based on system preference
   */
  autoSwitchTheme() {
    const prefersDark = this.prefersDarkMode();
    this.setTheme(prefersDark ? "dark" : "light");
  }

  /**
   * Export theme
   * @param {string} themeId - Theme to export
   * @returns {Object}
   */
  exportTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) return null;

    return {
      id: themeId,
      version: "1.0",
      ...theme,
    };
  }

  /**
   * Import theme
   * @param {Object} themeData - Theme data
   */
  importTheme(themeData) {
    if (!themeData.id || !themeData.name) {
      console.error("Invalid theme data");
      return;
    }

    this.addTheme(themeData.id, themeData);
  }

  /**
   * Serialize theme settings
   * @returns {Object}
   */
  serialize() {
    return {
      currentTheme: this.currentTheme,
      customColors: this.customColors,
      customThemes: Array.from(this.themes.entries())
        .filter(([id]) => !["light", "dark", "high-contrast"].includes(id))
        .map(([id, theme]) => ({ id, ...theme })),
    };
  }

  /**
   * Restore theme settings
   * @param {Object} data - Serialized theme data
   */
  deserialize(data) {
    // Restore custom themes
    if (data.customThemes) {
      data.customThemes.forEach((theme) => {
        this.addTheme(theme.id, theme);
      });
    }

    // Restore custom colors
    if (data.customColors) {
      Object.entries(data.customColors).forEach(([path, color]) => {
        this.setCustomColor(path, color);
      });
    }

    // Restore current theme
    if (data.currentTheme) {
      this.setTheme(data.currentTheme);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearCustomColors();
  }
}
