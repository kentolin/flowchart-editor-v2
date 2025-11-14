/**
 * ToolBar.js - Main toolbar with editing tools
 */

export class ToolBar {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = null;
    this.tools = new Map();
    this.activeTool = "select";
  }

  /**
   * Initialize and render toolbar
   */
  initialize(containerElement) {
    this.container = containerElement;
    this.render();
    this._setupEventListeners();
  }

  /**
   * Render toolbar
   */
  render() {
    this.container.innerHTML = "";
    this.container.className = "flowchart-toolbar";

    const toolGroups = [
      {
        name: "selection",
        tools: [
          { id: "select", icon: "⬚", label: "Select", shortcut: "V" },
          { id: "pan", icon: "✋", label: "Pan", shortcut: "H" },
        ],
      },
      {
        name: "shapes",
        tools: [
          { id: "rect", icon: "▭", label: "Rectangle", shortcut: "R" },
          { id: "circle", icon: "◯", label: "Circle", shortcut: "C" },
          { id: "diamond", icon: "◇", label: "Diamond", shortcut: "D" },
        ],
      },
      {
        name: "connection",
        tools: [
          { id: "connector", icon: "→", label: "Connector", shortcut: "L" },
        ],
      },
      {
        name: "text",
        tools: [{ id: "text", icon: "T", label: "Text", shortcut: "T" }],
      },
      {
        name: "actions",
        tools: [{ id: "delete", icon: "🗑", label: "Delete", shortcut: "Del" }],
      },
    ];

    toolGroups.forEach((group) => {
      const groupEl = document.createElement("div");
      groupEl.className = "toolbar-group";

      group.tools.forEach((tool) => {
        const btn = this._createToolButton(tool);
        groupEl.appendChild(btn);
      });

      this.container.appendChild(groupEl);
    });
  }

  /**
   * Create a tool button
   */
  _createToolButton(tool) {
    const btn = document.createElement("button");
    btn.className = "toolbar-button";
    btn.dataset.tool = tool.id;
    btn.title = `${tool.label} (${tool.shortcut})`;

    if (tool.id === this.activeTool) {
      btn.classList.add("active");
    }

    const icon = document.createElement("span");
    icon.className = "toolbar-icon";
    icon.textContent = tool.icon;
    btn.appendChild(icon);

    const label = document.createElement("span");
    label.className = "toolbar-label";
    label.textContent = tool.label;
    btn.appendChild(label);

    btn.addEventListener("click", () => this.setActiveTool(tool.id));

    this.tools.set(tool.id, btn);
    return btn;
  }

  /**
   * Set active tool
   */
  setActiveTool(toolId) {
    // Deactivate current tool
    const currentBtn = this.tools.get(this.activeTool);
    if (currentBtn) {
      currentBtn.classList.remove("active");
    }

    // Activate new tool
    this.activeTool = toolId;
    const newBtn = this.tools.get(toolId);
    if (newBtn) {
      newBtn.classList.add("active");
    }

    // Update state
    this.stateManager.setState("activeTool", toolId);

    // Emit event
    this.eventBus.emit("tool:changed", { tool: toolId });
  }

  /**
   * Get active tool
   */
  getActiveTool() {
    return this.activeTool;
  }

  /**
   * Enable/disable a tool
   */
  setToolEnabled(toolId, enabled) {
    const btn = this.tools.get(toolId);
    if (btn) {
      btn.disabled = !enabled;
      btn.classList.toggle("disabled", !enabled);
    }
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Listen for keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toUpperCase();
      const shortcuts = {
        V: "select",
        H: "pan",
        R: "rect",
        C: "circle",
        D: "diamond",
        L: "connector",
        T: "text",
      };

      if (shortcuts[key]) {
        e.preventDefault();
        this.setActiveTool(shortcuts[key]);
      }
    });

    // Listen for selection changes to enable/disable delete
    this.eventBus.on("selection:changed", ({ nodes, edges }) => {
      const hasSelection = nodes.length > 0 || edges.length > 0;
      this.setToolEnabled("delete", hasSelection);
    });
  }

  /**
   * Add custom tool
   */
  addTool(tool) {
    const groupEl = this.container.querySelector(".toolbar-group:last-child");
    if (groupEl) {
      const btn = this._createToolButton(tool);
      groupEl.appendChild(btn);
    }
  }

  /**
   * Remove tool
   */
  removeTool(toolId) {
    const btn = this.tools.get(toolId);
    if (btn) {
      btn.remove();
      this.tools.delete(toolId);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.tools.clear();
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}
