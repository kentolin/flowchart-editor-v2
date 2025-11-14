/**
 * Panels.js - All panel components (LeftPalette, RightInspector, LayersPanel, MiniMap)
 */

/**
 * LeftPalette - Shape selection palette
 */
export class LeftPalette {
  constructor(eventBus, stateManager, shapeRegistry) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.shapeRegistry = shapeRegistry;
    this.container = null;
    this.categories = new Map();
  }

  initialize(containerElement) {
    this.container = containerElement;
    this.render();
  }

  render() {
    this.container.innerHTML = "";
    this.container.className = "flowchart-left-palette";

    const header = document.createElement("div");
    header.className = "palette-header";
    header.textContent = "Shapes";
    this.container.appendChild(header);

    const search = document.createElement("input");
    search.type = "text";
    search.className = "palette-search";
    search.placeholder = "Search shapes...";
    search.addEventListener("input", (e) => this._filterShapes(e.target.value));
    this.container.appendChild(search);

    const content = document.createElement("div");
    content.className = "palette-content";

    const categories = [
      {
        id: "basic",
        name: "Basic",
        shapes: ["rect", "circle", "diamond", "polygon", "star"],
      },
      {
        id: "flowchart",
        name: "Flowchart",
        shapes: [
          "process",
          "decision",
          "manual-input",
          "display",
          "preparation",
        ],
      },
      {
        id: "network",
        name: "Network",
        shapes: ["switch", "firewall", "cloud", "database", "workstation"],
      },
      {
        id: "uml",
        name: "UML",
        shapes: ["class", "interface", "actor", "component", "package"],
      },
      {
        id: "container",
        name: "Container",
        shapes: ["swimlane", "group", "frame"],
      },
      {
        id: "arrows",
        name: "Arrows",
        shapes: ["straight-arrow", "curved-arrow", "double-arrow"],
      },
    ];

    categories.forEach((category) => {
      const categoryEl = this._createCategory(category);
      content.appendChild(categoryEl);
      this.categories.set(category.id, categoryEl);
    });

    this.container.appendChild(content);
  }

  _createCategory(category) {
    const categoryEl = document.createElement("div");
    categoryEl.className = "palette-category";

    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = category.name;
    header.addEventListener("click", () => {
      categoryEl.classList.toggle("collapsed");
    });
    categoryEl.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "category-grid";

    category.shapes.forEach((shapeId) => {
      const item = this._createShapeItem(shapeId);
      grid.appendChild(item);
    });

    categoryEl.appendChild(grid);
    return categoryEl;
  }

  _createShapeItem(shapeId) {
    const item = document.createElement("div");
    item.className = "shape-item";
    item.dataset.shape = shapeId;
    item.title = shapeId;
    item.draggable = true;

    const preview = document.createElement("div");
    preview.className = "shape-preview";
    preview.textContent = shapeId[0].toUpperCase();
    item.appendChild(preview);

    const label = document.createElement("div");
    label.className = "shape-label";
    label.textContent = shapeId;
    item.appendChild(label);

    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("shape", shapeId);
      e.dataTransfer.effectAllowed = "copy";
    });

    item.addEventListener("click", () => {
      this.eventBus.emit("shape:selected", { shapeId });
    });

    return item;
  }

  _filterShapes(query) {
    const lowerQuery = query.toLowerCase();
    this.container.querySelectorAll(".shape-item").forEach((item) => {
      const shapeId = item.dataset.shape;
      const matches = shapeId.toLowerCase().includes(lowerQuery);
      item.style.display = matches ? "flex" : "none";
    });
  }

  destroy() {
    this.categories.clear();
    if (this.container) this.container.innerHTML = "";
  }
}

/**
 * RightInspector - Property inspector panel
 */
export class RightInspector {
  constructor(eventBus, stateManager, nodeManager, edgeManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.container = null;
    this.selectedItems = [];
  }

  initialize(containerElement) {
    this.container = containerElement;
    this.render();
    this._setupEventListeners();
  }

  render() {
    this.container.innerHTML = "";
    this.container.className = "flowchart-right-inspector";

    const header = document.createElement("div");
    header.className = "inspector-header";
    header.textContent = "Properties";
    this.container.appendChild(header);

    const content = document.createElement("div");
    content.className = "inspector-content";
    this.container.appendChild(content);

    this._showEmptyState();
  }

  _setupEventListeners() {
    this.eventBus.on("selection:changed", ({ nodes, edges }) => {
      this.selectedItems = [...nodes, ...edges];
      this.updateProperties();
    });

    this.eventBus.on("node:updated", ({ nodeId }) => {
      if (this.selectedItems.includes(nodeId)) {
        this.updateProperties();
      }
    });
  }

  updateProperties() {
    const content = this.container.querySelector(".inspector-content");
    if (!content) return;

    content.innerHTML = "";

    if (this.selectedItems.length === 0) {
      this._showEmptyState();
      return;
    }

    if (this.selectedItems.length === 1) {
      this._showSingleItemProperties(this.selectedItems[0]);
    } else {
      this._showMultipleItemsProperties();
    }
  }

  _showEmptyState() {
    const content = this.container.querySelector(".inspector-content");
    content.innerHTML =
      '<div class="inspector-empty">Select an item to view properties</div>';
  }

  _showSingleItemProperties(itemId) {
    const node = this.nodeManager.getNode(itemId);
    if (!node) return;

    const content = this.container.querySelector(".inspector-content");

    const sections = [
      {
        title: "Position",
        properties: [
          { label: "X", key: "x", type: "number", value: node.x },
          { label: "Y", key: "y", type: "number", value: node.y },
        ],
      },
      {
        title: "Size",
        properties: [
          { label: "Width", key: "width", type: "number", value: node.width },
          {
            label: "Height",
            key: "height",
            type: "number",
            value: node.height,
          },
        ],
      },
      {
        title: "Appearance",
        properties: [
          {
            label: "Fill",
            key: "style.fill",
            type: "color",
            value: node.style?.fill || "#ffffff",
          },
          {
            label: "Stroke",
            key: "style.stroke",
            type: "color",
            value: node.style?.stroke || "#000000",
          },
          {
            label: "Stroke Width",
            key: "style.strokeWidth",
            type: "number",
            value: node.style?.strokeWidth || 2,
          },
        ],
      },
      {
        title: "Text",
        properties: [
          {
            label: "Label",
            key: "label",
            type: "text",
            value: node.label || "",
          },
        ],
      },
    ];

    sections.forEach((section) => {
      const sectionEl = this._createPropertySection(section, itemId);
      content.appendChild(sectionEl);
    });
  }

  _showMultipleItemsProperties() {
    const content = this.container.querySelector(".inspector-content");
    content.innerHTML = `<div class="inspector-multiple">${this.selectedItems.length} items selected</div>`;
  }

  _createPropertySection(section, itemId) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "property-section";

    const header = document.createElement("div");
    header.className = "section-header";
    header.textContent = section.title;
    sectionEl.appendChild(header);

    section.properties.forEach((prop) => {
      const row = document.createElement("div");
      row.className = "property-row";

      const label = document.createElement("label");
      label.textContent = prop.label;
      row.appendChild(label);

      const input = this._createPropertyInput(prop, itemId);
      row.appendChild(input);

      sectionEl.appendChild(row);
    });

    return sectionEl;
  }

  _createPropertyInput(prop, itemId) {
    let input;

    if (prop.type === "number") {
      input = document.createElement("input");
      input.type = "number";
      input.value = prop.value;
      input.addEventListener("change", () => {
        this._updateProperty(itemId, prop.key, parseFloat(input.value));
      });
    } else if (prop.type === "color") {
      input = document.createElement("input");
      input.type = "color";
      input.value = prop.value;
      input.addEventListener("change", () => {
        this._updateProperty(itemId, prop.key, input.value);
      });
    } else if (prop.type === "text") {
      input = document.createElement("input");
      input.type = "text";
      input.value = prop.value;
      input.addEventListener("change", () => {
        this._updateProperty(itemId, prop.key, input.value);
      });
    }

    return input;
  }

  _updateProperty(itemId, key, value) {
    const keys = key.split(".");
    if (keys.length === 1) {
      this.nodeManager.updateNodeProperty(itemId, key, value);
    } else {
      const node = this.nodeManager.getNode(itemId);
      if (node) {
        let target = node;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) target[keys[i]] = {};
          target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
        this.eventBus.emit("node:updated", { nodeId: itemId });
      }
    }
  }

  destroy() {
    this.selectedItems = [];
    if (this.container) this.container.innerHTML = "";
  }
}

/**
 * LayersPanel - Layer management panel
 */
export class LayersPanel {
  constructor(eventBus, stateManager, layerManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.layerManager = layerManager;
    this.container = null;
  }

  initialize(containerElement) {
    this.container = containerElement;
    this.render();
    this._setupEventListeners();
  }

  render() {
    this.container.innerHTML = "";
    this.container.className = "flowchart-layers-panel";

    const header = document.createElement("div");
    header.className = "panel-header";

    const title = document.createElement("span");
    title.textContent = "Layers";
    header.appendChild(title);

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.className = "add-layer-btn";
    addBtn.addEventListener("click", () => this._addLayer());
    header.appendChild(addBtn);

    this.container.appendChild(header);

    const content = document.createElement("div");
    content.className = "layers-content";
    this.container.appendChild(content);

    this._renderLayers();
  }

  _setupEventListeners() {
    this.eventBus.on("layer:created", () => this._renderLayers());
    this.eventBus.on("layer:deleted", () => this._renderLayers());
    this.eventBus.on("layer:reordered", () => this._renderLayers());
  }

  _renderLayers() {
    const content = this.container.querySelector(".layers-content");
    if (!content) return;

    content.innerHTML = "";

    const layers = this.layerManager.getAllLayers();
    layers.forEach((layer) => {
      const layerEl = this._createLayerItem(layer);
      content.appendChild(layerEl);
    });
  }

  _createLayerItem(layer) {
    const item = document.createElement("div");
    item.className = "layer-item";
    item.dataset.layerId = layer.id;

    const visibility = document.createElement("button");
    visibility.className = "layer-visibility";
    visibility.textContent = layer.visible ? "👁" : "👁‍🗨";
    visibility.addEventListener("click", () => {
      this.layerManager.setLayerVisible(layer.id, !layer.visible);
    });
    item.appendChild(visibility);

    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = layer.name;
    item.appendChild(name);

    const count = document.createElement("span");
    count.className = "layer-count";
    count.textContent = `(${layer.nodeCount})`;
    item.appendChild(count);

    const lock = document.createElement("button");
    lock.className = "layer-lock";
    lock.textContent = layer.locked ? "🔒" : "🔓";
    lock.addEventListener("click", () => {
      this.layerManager.setLayerLocked(layer.id, !layer.locked);
    });
    item.appendChild(lock);

    return item;
  }

  _addLayer() {
    const name = prompt("Layer name:", "New Layer");
    if (name) {
      const id = `layer_${Date.now()}`;
      this.layerManager.createLayer(id, { name });
    }
  }

  destroy() {
    if (this.container) this.container.innerHTML = "";
  }
}

/**
 * MiniMap - Overview mini-map panel
 */
export class MiniMap {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
  }

  initialize(containerElement) {
    this.container = containerElement;
    this.render();
    this._setupEventListeners();
  }

  render() {
    this.container.innerHTML = "";
    this.container.className = "flowchart-minimap";

    const header = document.createElement("div");
    header.className = "minimap-header";
    header.textContent = "Mini Map";
    this.container.appendChild(header);

    this.canvas = document.createElement("canvas");
    this.canvas.width = 200;
    this.canvas.height = 150;
    this.canvas.className = "minimap-canvas";
    this.ctx = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    this.canvas.addEventListener("click", (e) => this._handleClick(e));
  }

  _setupEventListeners() {
    this.eventBus.on("node:created", () => this.update());
    this.eventBus.on("node:updated", () => this.update());
    this.eventBus.on("node:deleted", () => this.update());
    this.eventBus.on("viewport:changed", () => this.update());
  }

  update() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f5f5f5";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw simplified nodes
    this.ctx.fillStyle = "#2196f3";
    this.ctx.strokeStyle = "#1976d2";
    this.ctx.lineWidth = 1;

    // This would actually render scaled-down versions of nodes
    // For now, just draw placeholder rectangles
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 35;
      const y = 50;
      this.ctx.fillRect(x, y, 25, 15);
      this.ctx.strokeRect(x, y, 25, 15);
    }

    // Draw viewport rectangle
    this.ctx.strokeStyle = "#ff0000";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(10, 10, 100, 80);
  }

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.eventBus.emit("minimap:click", { x, y });
  }

  destroy() {
    this.canvas = null;
    this.ctx = null;
    if (this.container) this.container.innerHTML = "";
  }
}
