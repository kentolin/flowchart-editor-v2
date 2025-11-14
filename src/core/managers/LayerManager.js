/**
 * LayerManager.js - Manages node layers and z-ordering
 *
 * Responsibilities:
 * - Organize nodes into layers
 * - Handle z-index/stacking order
 * - Bring to front / send to back operations
 * - Layer visibility and locking
 * - Layer groups and organization
 *
 * @module core/managers/LayerManager
 */

export class LayerManager {
  constructor(eventBus, stateManager, nodeManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.nodeManager = nodeManager;

    // Layers
    this.layers = new Map();
    this.layerOrder = []; // Array of layer IDs in render order

    // Default layer
    this.defaultLayerId = "default";

    // Z-index tracking
    this.zIndexMap = new Map(); // nodeId -> zIndex
    this.nextZIndex = 0;

    this._initializeDefaultLayer();
    this._setupEventListeners();
  }

  /**
   * Initialize default layer
   * @private
   */
  _initializeDefaultLayer() {
    this.createLayer(this.defaultLayerId, {
      name: "Default Layer",
      visible: true,
      locked: false,
      opacity: 1.0,
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    this.eventBus.on("node:created", ({ nodeId }) => {
      // Assign new node to default layer with next z-index
      this.addNodeToLayer(nodeId, this.defaultLayerId);
    });

    this.eventBus.on("node:deleted", ({ nodeId }) => {
      this.removeNodeFromAllLayers(nodeId);
    });
  }

  /**
   * Create a new layer
   * @param {string} layerId - Layer identifier
   * @param {Object} options - Layer options
   */
  createLayer(layerId, options = {}) {
    if (this.layers.has(layerId)) {
      console.warn(`Layer '${layerId}' already exists`);
      return false;
    }

    const layer = {
      id: layerId,
      name: options.name || layerId,
      visible: options.visible !== false,
      locked: options.locked || false,
      opacity: options.opacity || 1.0,
      nodes: new Set(),
      color: options.color || null, // Optional layer color
      description: options.description || "",
    };

    this.layers.set(layerId, layer);
    this.layerOrder.push(layerId);

    this.eventBus.emit("layer:created", { layerId, layer });
    this._updateState();

    return true;
  }

  /**
   * Delete a layer
   * @param {string} layerId - Layer to delete
   * @param {boolean} moveToDefault - Move nodes to default layer
   */
  deleteLayer(layerId, moveToDefault = true) {
    if (layerId === this.defaultLayerId) {
      console.warn("Cannot delete default layer");
      return false;
    }

    const layer = this.layers.get(layerId);
    if (!layer) {
      return false;
    }

    // Handle nodes in this layer
    if (moveToDefault) {
      layer.nodes.forEach((nodeId) => {
        this.addNodeToLayer(nodeId, this.defaultLayerId);
      });
    }

    // Remove from order
    const index = this.layerOrder.indexOf(layerId);
    if (index > -1) {
      this.layerOrder.splice(index, 1);
    }

    this.layers.delete(layerId);

    this.eventBus.emit("layer:deleted", { layerId });
    this._updateState();

    return true;
  }

  /**
   * Add node to layer
   * @param {string} nodeId - Node to add
   * @param {string} layerId - Target layer
   */
  addNodeToLayer(nodeId, layerId) {
    const layer = this.layers.get(layerId);
    if (!layer) {
      console.warn(`Layer '${layerId}' not found`);
      return false;
    }

    // Remove from other layers first
    this.removeNodeFromAllLayers(nodeId);

    // Add to layer
    layer.nodes.add(nodeId);

    // Assign z-index if not already assigned
    if (!this.zIndexMap.has(nodeId)) {
      this.zIndexMap.set(nodeId, this.nextZIndex++);
    }

    this.eventBus.emit("layer:node:added", { nodeId, layerId });

    return true;
  }

  /**
   * Remove node from specific layer
   * @param {string} nodeId - Node to remove
   * @param {string} layerId - Layer to remove from
   */
  removeNodeFromLayer(nodeId, layerId) {
    const layer = this.layers.get(layerId);
    if (!layer) {
      return false;
    }

    layer.nodes.delete(nodeId);

    this.eventBus.emit("layer:node:removed", { nodeId, layerId });

    return true;
  }

  /**
   * Remove node from all layers
   * @param {string} nodeId - Node to remove
   */
  removeNodeFromAllLayers(nodeId) {
    for (const [layerId, layer] of this.layers) {
      if (layer.nodes.has(nodeId)) {
        layer.nodes.delete(nodeId);
        this.eventBus.emit("layer:node:removed", { nodeId, layerId });
      }
    }

    this.zIndexMap.delete(nodeId);
  }

  /**
   * Get layer containing a node
   * @param {string} nodeId - Node to find
   * @returns {string|null} - Layer ID or null
   */
  getNodeLayer(nodeId) {
    for (const [layerId, layer] of this.layers) {
      if (layer.nodes.has(nodeId)) {
        return layerId;
      }
    }
    return null;
  }

  /**
   * Get all nodes in a layer
   * @param {string} layerId - Layer ID
   * @returns {Array}
   */
  getNodesInLayer(layerId) {
    const layer = this.layers.get(layerId);
    return layer ? Array.from(layer.nodes) : [];
  }

  /**
   * Set layer visibility
   * @param {string} layerId - Layer ID
   * @param {boolean} visible - Visibility state
   */
  setLayerVisible(layerId, visible) {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.visible = visible;

    // Update all nodes in layer
    layer.nodes.forEach((nodeId) => {
      this.eventBus.emit("node:visibility:changed", { nodeId, visible });
    });

    this.eventBus.emit("layer:visibility:changed", { layerId, visible });
    this._updateState();

    return true;
  }

  /**
   * Set layer locked state
   * @param {string} layerId - Layer ID
   * @param {boolean} locked - Locked state
   */
  setLayerLocked(layerId, locked) {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.locked = locked;

    // Update all nodes in layer
    layer.nodes.forEach((nodeId) => {
      this.eventBus.emit("node:locked:changed", { nodeId, locked });
    });

    this.eventBus.emit("layer:locked:changed", { layerId, locked });
    this._updateState();

    return true;
  }

  /**
   * Set layer opacity
   * @param {string} layerId - Layer ID
   * @param {number} opacity - Opacity (0-1)
   */
  setLayerOpacity(layerId, opacity) {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.opacity = Math.max(0, Math.min(1, opacity));

    // Update all nodes in layer
    layer.nodes.forEach((nodeId) => {
      this.eventBus.emit("node:opacity:changed", {
        nodeId,
        opacity: layer.opacity,
      });
    });

    this.eventBus.emit("layer:opacity:changed", {
      layerId,
      opacity: layer.opacity,
    });
    this._updateState();

    return true;
  }

  /**
   * Rename a layer
   * @param {string} layerId - Layer ID
   * @param {string} newName - New name
   */
  renameLayer(layerId, newName) {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.name = newName;

    this.eventBus.emit("layer:renamed", { layerId, name: newName });
    this._updateState();

    return true;
  }

  /**
   * Reorder layers
   * @param {Array} newOrder - New order of layer IDs
   */
  reorderLayers(newOrder) {
    // Validate that all layer IDs are present
    if (newOrder.length !== this.layerOrder.length) {
      console.error("Invalid layer order");
      return false;
    }

    this.layerOrder = [...newOrder];

    this.eventBus.emit("layer:reordered", { order: this.layerOrder });
    this._updateState();

    return true;
  }

  /**
   * Move layer up in order
   * @param {string} layerId - Layer to move
   */
  moveLayerUp(layerId) {
    const index = this.layerOrder.indexOf(layerId);
    if (index > 0) {
      const newOrder = [...this.layerOrder];
      [newOrder[index], newOrder[index - 1]] = [
        newOrder[index - 1],
        newOrder[index],
      ];
      this.reorderLayers(newOrder);
      return true;
    }
    return false;
  }

  /**
   * Move layer down in order
   * @param {string} layerId - Layer to move
   */
  moveLayerDown(layerId) {
    const index = this.layerOrder.indexOf(layerId);
    if (index < this.layerOrder.length - 1) {
      const newOrder = [...this.layerOrder];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      this.reorderLayers(newOrder);
      return true;
    }
    return false;
  }

  /**
   * Get node z-index
   * @param {string} nodeId - Node ID
   * @returns {number}
   */
  getNodeZIndex(nodeId) {
    return this.zIndexMap.get(nodeId) || 0;
  }

  /**
   * Set node z-index
   * @param {string} nodeId - Node ID
   * @param {number} zIndex - Z-index value
   */
  setNodeZIndex(nodeId, zIndex) {
    this.zIndexMap.set(nodeId, zIndex);
    this.eventBus.emit("node:zindex:changed", { nodeId, zIndex });
  }

  /**
   * Bring node to front
   * @param {string} nodeId - Node to bring to front
   */
  bringToFront(nodeId) {
    const maxZ = Math.max(...Array.from(this.zIndexMap.values()), 0);
    this.setNodeZIndex(nodeId, maxZ + 1);
    this.nextZIndex = Math.max(this.nextZIndex, maxZ + 2);
  }

  /**
   * Send node to back
   * @param {string} nodeId - Node to send to back
   */
  sendToBack(nodeId) {
    const minZ = Math.min(...Array.from(this.zIndexMap.values()), 0);
    this.setNodeZIndex(nodeId, minZ - 1);
  }

  /**
   * Bring node forward one level
   * @param {string} nodeId - Node to move forward
   */
  bringForward(nodeId) {
    const currentZ = this.getNodeZIndex(nodeId);
    this.setNodeZIndex(nodeId, currentZ + 1);
  }

  /**
   * Send node backward one level
   * @param {string} nodeId - Node to move backward
   */
  sendBackward(nodeId) {
    const currentZ = this.getNodeZIndex(nodeId);
    this.setNodeZIndex(nodeId, currentZ - 1);
  }

  /**
   * Get all layers
   * @returns {Array}
   */
  getAllLayers() {
    return this.layerOrder.map((id) => {
      const layer = this.layers.get(id);
      return {
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        locked: layer.locked,
        opacity: layer.opacity,
        nodeCount: layer.nodes.size,
        color: layer.color,
        description: layer.description,
      };
    });
  }

  /**
   * Get layer by ID
   * @param {string} layerId - Layer ID
   * @returns {Object|null}
   */
  getLayer(layerId) {
    const layer = this.layers.get(layerId);
    if (!layer) return null;

    return {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,
      nodes: Array.from(layer.nodes),
      color: layer.color,
      description: layer.description,
    };
  }

  /**
   * Check if layer is visible
   * @param {string} layerId - Layer ID
   * @returns {boolean}
   */
  isLayerVisible(layerId) {
    const layer = this.layers.get(layerId);
    return layer ? layer.visible : false;
  }

  /**
   * Check if layer is locked
   * @param {string} layerId - Layer ID
   * @returns {boolean}
   */
  isLayerLocked(layerId) {
    const layer = this.layers.get(layerId);
    return layer ? layer.locked : false;
  }

  /**
   * Get sorted nodes by z-index
   * @returns {Array} - Node IDs sorted by z-index
   */
  getNodesByZIndex() {
    return Array.from(this.zIndexMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([nodeId]) => nodeId);
  }

  /**
   * Update state manager
   * @private
   */
  _updateState() {
    this.stateManager.setState("layers", {
      order: this.layerOrder,
      layers: this.getAllLayers(),
    });
  }

  /**
   * Serialize layer data
   * @returns {Object}
   */
  serialize() {
    return {
      layers: Array.from(this.layers.entries()).map(([id, layer]) => ({
        id,
        name: layer.name,
        visible: layer.visible,
        locked: layer.locked,
        opacity: layer.opacity,
        nodes: Array.from(layer.nodes),
        color: layer.color,
        description: layer.description,
      })),
      layerOrder: this.layerOrder,
      zIndexMap: Array.from(this.zIndexMap.entries()),
    };
  }

  /**
   * Restore layer data
   * @param {Object} data - Serialized layer data
   */
  deserialize(data) {
    // Clear existing layers except default
    for (const [layerId] of this.layers) {
      if (layerId !== this.defaultLayerId) {
        this.deleteLayer(layerId, false);
      }
    }

    // Restore layers
    if (data.layers) {
      data.layers.forEach((layerData) => {
        if (layerData.id === this.defaultLayerId) {
          // Update default layer
          const layer = this.layers.get(this.defaultLayerId);
          Object.assign(layer, layerData);
          layer.nodes = new Set(layerData.nodes);
        } else {
          // Create new layer
          this.createLayer(layerData.id, layerData);
          const layer = this.layers.get(layerData.id);
          layer.nodes = new Set(layerData.nodes);
        }
      });
    }

    // Restore layer order
    if (data.layerOrder) {
      this.layerOrder = [...data.layerOrder];
    }

    // Restore z-index map
    if (data.zIndexMap) {
      this.zIndexMap = new Map(data.zIndexMap);
      this.nextZIndex = Math.max(...Array.from(this.zIndexMap.values()), 0) + 1;
    }

    this._updateState();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.layers.clear();
    this.layerOrder = [];
    this.zIndexMap.clear();

    this.eventBus.off("node:created");
    this.eventBus.off("node:deleted");
  }
}
