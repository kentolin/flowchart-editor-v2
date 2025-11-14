/**
 * StatusBar.js - Bottom status bar with information display
 */

export class StatusBar {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = null;
    this.sections = new Map();
  }

  initialize(containerElement) {
    this.container = containerElement;
    this.render();
    this._setupEventListeners();
  }

  render() {
    this.container.innerHTML = "";
    this.container.className = "flowchart-statusbar";

    // Left section
    const leftSection = document.createElement("div");
    leftSection.className = "statusbar-section statusbar-left";

    const messageEl = document.createElement("span");
    messageEl.className = "statusbar-message";
    messageEl.textContent = "Ready";
    leftSection.appendChild(messageEl);
    this.sections.set("message", messageEl);

    this.container.appendChild(leftSection);

    // Center section
    const centerSection = document.createElement("div");
    centerSection.className = "statusbar-section statusbar-center";

    const selectionEl = document.createElement("span");
    selectionEl.className = "statusbar-selection";
    selectionEl.textContent = "No selection";
    centerSection.appendChild(selectionEl);
    this.sections.set("selection", selectionEl);

    this.container.appendChild(centerSection);

    // Right section
    const rightSection = document.createElement("div");
    rightSection.className = "statusbar-section statusbar-right";

    const statsEl = document.createElement("span");
    statsEl.className = "statusbar-stats";
    statsEl.textContent = "0 nodes, 0 edges";
    rightSection.appendChild(statsEl);
    this.sections.set("stats", statsEl);

    const zoomEl = document.createElement("span");
    zoomEl.className = "statusbar-zoom";
    zoomEl.textContent = "100%";
    rightSection.appendChild(zoomEl);
    this.sections.set("zoom", zoomEl);

    const positionEl = document.createElement("span");
    positionEl.className = "statusbar-position";
    positionEl.textContent = "x: 0, y: 0";
    rightSection.appendChild(positionEl);
    this.sections.set("position", positionEl);

    this.container.appendChild(rightSection);
  }

  _setupEventListeners() {
    // Update selection count
    this.eventBus.on("selection:changed", ({ nodes, edges }) => {
      this.updateSelection(nodes.length, edges.length);
    });

    // Update node/edge count
    this.eventBus.on("node:created", () => this._updateStats());
    this.eventBus.on("node:deleted", () => this._updateStats());
    this.eventBus.on("edge:created", () => this._updateStats());
    this.eventBus.on("edge:deleted", () => this._updateStats());

    // Update zoom level
    this.eventBus.on("viewport:zoom", ({ zoom }) => {
      this.updateZoom(zoom);
    });

    // Update cursor position
    this.eventBus.on("canvas:mousemove", ({ x, y }) => {
      this.updatePosition(x, y);
    });

    // Show messages
    this.eventBus.on("status:message", ({ message, type, duration }) => {
      this.showMessage(message, type, duration);
    });
  }

  _updateStats() {
    const state = this.stateManager.getState();
    const nodeCount = state.nodes?.count || 0;
    const edgeCount = state.edges?.count || 0;

    const statsEl = this.sections.get("stats");
    if (statsEl) {
      statsEl.textContent = `${nodeCount} nodes, ${edgeCount} edges`;
    }
  }

  updateSelection(nodeCount, edgeCount) {
    const selectionEl = this.sections.get("selection");
    if (!selectionEl) return;

    if (nodeCount === 0 && edgeCount === 0) {
      selectionEl.textContent = "No selection";
    } else {
      const parts = [];
      if (nodeCount > 0)
        parts.push(`${nodeCount} node${nodeCount > 1 ? "s" : ""}`);
      if (edgeCount > 0)
        parts.push(`${edgeCount} edge${edgeCount > 1 ? "s" : ""}`);
      selectionEl.textContent = parts.join(", ") + " selected";
    }
  }

  updateZoom(zoom) {
    const zoomEl = this.sections.get("zoom");
    if (zoomEl) {
      zoomEl.textContent = `${Math.round(zoom * 100)}%`;
    }
  }

  updatePosition(x, y) {
    const positionEl = this.sections.get("position");
    if (positionEl) {
      positionEl.textContent = `x: ${Math.round(x)}, y: ${Math.round(y)}`;
    }
  }

  showMessage(message, type = "info", duration = 3000) {
    const messageEl = this.sections.get("message");
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = "statusbar-message";

    if (type === "error") {
      messageEl.classList.add("error");
    } else if (type === "warning") {
      messageEl.classList.add("warning");
    } else if (type === "success") {
      messageEl.classList.add("success");
    }

    if (duration > 0) {
      setTimeout(() => {
        messageEl.textContent = "Ready";
        messageEl.className = "statusbar-message";
      }, duration);
    }
  }

  setSection(sectionName, content) {
    const section = this.sections.get(sectionName);
    if (section) {
      if (typeof content === "string") {
        section.textContent = content;
      } else {
        section.innerHTML = "";
        section.appendChild(content);
      }
    }
  }

  destroy() {
    this.sections.clear();
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}
