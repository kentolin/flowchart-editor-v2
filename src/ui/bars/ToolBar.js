/**
 * ToolBar.js - Main toolbar with editing tools
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class ToolBar {
  constructor(eventBus, stateManager) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = null;
    this.tools = new Map();
    this.activeTool = "select";

    // Store handlers for cleanup
    this._keyboardHandler = null;
    this._selectionHandler = null;

    this.log.exit("constructor");
  }

  /**
   * Initialize and render toolbar
   * @param {HTMLElement} containerElement - The container to render into
   */
  initialize(containerElement) {
    this.log.enter("initialize");

    if (!containerElement) {
      this.log.error("Container element is required");
      return;
    }

    this.container = containerElement;
    this.render();
    this._setupEventListeners();

    this.log.exit("initialize");
  }

  /**
   * Render toolbar into the container
   */
  render() {
    this.log.enter("render");

    if (!this.container) {
      this.log.error("Container not initialized. Call initialize() first.");
      return;
    }

    // Clear existing content
    this.container.innerHTML = "";
    this.container.className = "tool-bar";

    // LEFT: Panel toggle buttons
    const leftGroup = document.createElement("div");
    leftGroup.className = "tool-group tool-group-left";
    leftGroup.dataset.group = "panels";

    const leftSlideBtn = this._createToolButton({
      id: "left-slide",
      label: "Toggle Left Panel",
      shortcut: "",
    });
    leftGroup.appendChild(leftSlideBtn);

    this.container.appendChild(leftGroup);

    // CENTER: Main tool groups
    const centerContainer = document.createElement("div");
    centerContainer.className = "tool-group-center";

    const toolGroups = [
      {
        name: "selection",
        tools: [
          { id: "select", label: "Select", shortcut: "V" },
          { id: "pan-tool", label: "Pan", shortcut: "H" },
        ],
      },
      {
        name: "history",
        tools: [
          { id: "undo", label: "Undo", shortcut: "Ctrl+Z" },
          { id: "redo", label: "Redo", shortcut: "Ctrl+Y" },
        ],
      },
      {
        name: "shapes",
        tools: [
          { id: "rectangle", label: "Rectangle", shortcut: "R" },
          { id: "circle", label: "Circle", shortcut: "C" },
          { id: "diamond", label: "Diamond", shortcut: "D" },
        ],
      },
      {
        name: "connection",
        tools: [{ id: "connector", label: "Connector", shortcut: "L" }],
      },
      {
        name: "text",
        tools: [{ id: "text", label: "Text", shortcut: "T" }],
      },
      {
        name: "zoom",
        tools: [
          { id: "zoom-in", label: "Zoom In", shortcut: "Ctrl++" },
          { id: "zoom-out", label: "Zoom Out", shortcut: "Ctrl+-" },
        ],
      },
      {
        name: "actions",
        tools: [{ id: "delete", label: "Delete", shortcut: "Del" }],
      },
    ];

    // Build toolbar groups
    this.log.stage(`Building ${toolGroups.length} toolbar groups`);
    toolGroups.forEach((group) => {
      const groupEl = document.createElement("div");
      groupEl.className = "tool-group";
      groupEl.dataset.group = group.name;

      this.log.stage(
        `Creating group: ${group.name} with ${group.tools.length} tools`
      );
      group.tools.forEach((tool) => {
        const btn = this._createToolButton(tool);
        groupEl.appendChild(btn);
      });

      centerContainer.appendChild(groupEl);
    });

    this.container.appendChild(centerContainer);

    // RIGHT: Panel toggle button
    const rightGroup = document.createElement("div");
    rightGroup.className = "tool-group tool-group-right";
    rightGroup.dataset.group = "panels-right";

    const rightSlideBtn = this._createToolButton({
      id: "right-slide",
      label: "Toggle Right Panel",
      shortcut: "",
    });
    rightGroup.appendChild(rightSlideBtn);

    this.container.appendChild(rightGroup);

    this.log.exit("render", `Created toolbar with ${this.tools.size} tools`);
  }

  /**
   * Create a tool button
   * @private
   * @param {Object} tool - Tool configuration
   * @returns {HTMLElement} Button element
   */
  _createToolButton(tool) {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.dataset.tool = tool.id;
    btn.title = `${tool.label} (${tool.shortcut})`;
    btn.setAttribute("aria-label", tool.label);

    // Set active state
    if (tool.id === this.activeTool) {
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.setAttribute("aria-pressed", "false");
    }

    // Create icon span
    const icon = document.createElement("span");
    icon.className = "tool-icon";
    icon.textContent = tool.icon;
    icon.setAttribute("aria-hidden", "true");
    btn.appendChild(icon);

    // Create label span
    const label = document.createElement("span");
    label.className = "tool-label";
    label.textContent = tool.label;
    btn.appendChild(label);

    // Add click handler
    btn.addEventListener("click", () => this.setActiveTool(tool.id));

    // Store reference
    this.tools.set(tool.id, btn);

    return btn;
  }

  /**
   * Set active tool
   * @param {string} toolId - Tool identifier
   */
  setActiveTool(toolId) {
    this.log.enter("setActiveTool", toolId);

    // Validate tool exists
    if (!this.tools.has(toolId)) {
      this.log.error(`Tool not found: ${toolId}`);
      return;
    }

    // Skip if already active
    if (this.activeTool === toolId) {
      this.log.exit("setActiveTool", "Tool already active");
      return;
    }

    // Deactivate current tool
    const currentBtn = this.tools.get(this.activeTool);
    if (currentBtn) {
      currentBtn.classList.remove("active");
      currentBtn.setAttribute("aria-pressed", "false");
    }

    // Activate new tool
    this.activeTool = toolId;
    const newBtn = this.tools.get(toolId);
    if (newBtn) {
      newBtn.classList.add("active");
      newBtn.setAttribute("aria-pressed", "true");
    }

    // Update state manager
    //this.stateManager.setState("activeTool", toolId);

    // Emit event
    this.eventBus.emit("tool:changed", { tool: toolId });

    this.log.exit("setActiveTool", `Active tool changed to: ${toolId}`);
  }

  /**
   * Get active tool
   * @returns {string} Active tool ID
   */
  getActiveTool() {
    return this.activeTool;
  }

  /**
   * Enable or disable a tool
   * @param {string} toolId - Tool identifier
   * @param {boolean} enabled - Enable state
   */
  setToolEnabled(toolId, enabled) {
    this.log.stage(`Setting tool ${toolId} enabled: ${enabled}`);

    const btn = this.tools.get(toolId);
    if (btn) {
      btn.disabled = !enabled;
      btn.classList.toggle("disabled", !enabled);
      btn.setAttribute("aria-disabled", String(!enabled));
    } else {
      this.log.error(`Tool not found: ${toolId}`);
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    this.log.enter("_setupEventListeners");

    // Keyboard shortcuts handler
    this._keyboardHandler = (e) => {
      // Ignore if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Ignore if typing in input fields
      const target = e.target;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

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
        this.log.stage(
          `Keyboard shortcut activated: ${key} -> ${shortcuts[key]}`
        );
      }
    };

    document.addEventListener("keydown", this._keyboardHandler);

    // Selection change handler
    this._selectionHandler = ({ nodes = [], edges = [] }) => {
      const hasSelection = nodes.length > 0 || edges.length > 0;
      this.setToolEnabled("delete", hasSelection);
      this.log.stage(
        `Selection changed: ${nodes.length} nodes, ${edges.length} edges`
      );
    };

    this.eventBus.on("selection:changed", this._selectionHandler);

    this.log.exit("_setupEventListeners", "Event listeners attached");
  }

  /**
   * Create a tool button with SVG icon
   * @private
   * @param {Object} tool - Tool configuration
   * @returns {HTMLElement} Button element
   */
  _createToolButton(tool) {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.dataset.tool = tool.id;
    btn.title = `${tool.label} (${tool.shortcut})`; // Tooltip on hover
    btn.setAttribute("aria-label", tool.label);

    // Set active state
    if (tool.id === this.activeTool) {
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.setAttribute("aria-pressed", "false");
    }

    // Create SVG icon
    const iconSvg = this._createIcon(tool.id);
    btn.appendChild(iconSvg);

    // Add click handler
    btn.addEventListener("click", () => this.setActiveTool(tool.id));

    // Store reference
    this.tools.set(tool.id, btn);

    return btn;
  }

  /**
   * Create SVG icon element
   * @private
   * @param {string} iconId - Icon identifier
   * @returns {SVGElement} SVG element
   */
  _createIcon(iconId) {
    const ICON_SPRITE_PATH = "assets/icons/icons.svg?v=" + Date.now();
    const INDIVIDUAL_ICON_PATH = `assets/icons/individual/${iconId}.svg`;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "tool-icon");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    // Try to use icon from sprite first
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "xlink:href",
      `${ICON_SPRITE_PATH}#${iconId}`
    );
    svg.appendChild(use);

    // Fallback: Try individual SVG after a short delay (sprite might not be loaded yet)
    setTimeout(() => {
      // Check if the icon rendered (has bounding box)
      const bbox = svg.getBBox();
      if (bbox.width === 0 && bbox.height === 0) {
        this.log.stage(`Sprite icon not found, trying individual: ${iconId}`);
        this._loadIndividualIcon(svg, INDIVIDUAL_ICON_PATH);
      }
    }, 100);

    return svg;
  }

  /**
   * Load individual SVG icon into the given SVG element
   * @private
   * @param {SVGElement} svgElement - The SVG element to load into
   * @param {string} iconPath - Path to the individual SVG icon
   */
  _loadIndividualIcon(svgElement, iconPath) {
    fetch(iconPath)
      .then((response) => {
        if (!response.ok) throw new Error("Icon not found");
        return response.text();
      })
      .then((svgText) => {
        // Parse the SVG text and extract inner content
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const loadedSvg = doc.querySelector("svg");

        if (loadedSvg) {
          // Clear existing content
          svgElement.innerHTML = "";

          // Copy viewBox if present
          if (loadedSvg.hasAttribute("viewBox")) {
            svgElement.setAttribute(
              "viewBox",
              loadedSvg.getAttribute("viewBox")
            );
          }

          // Copy inner content
          svgElement.innerHTML = loadedSvg.innerHTML;

          // REMOVE inline stroke attributes to allow CSS control
          svgElement.querySelectorAll("[stroke]").forEach((el) => {
            if (el.getAttribute("stroke") !== "none") {
              el.removeAttribute("stroke");
            }
          });

          this.log.stage(`Loaded individual icon: ${iconPath}`);
        }
      })
      .catch((err) => {
        this.log.error(`Failed to load icon: ${iconPath}`, err);
        // Show placeholder text if both sprite and individual icon fail
        svgElement.innerHTML = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="currentColor">?</text>`;
      });
  }
}
