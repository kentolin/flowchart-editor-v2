/**
 * NodeManager.js - Manages all node operations
 *
 * Responsibilities:
 * - Create, read, update, delete nodes
 * - Track all nodes in the graph
 * - Handle node positioning and transformations
 * - Manage node properties and metadata
 * - Coordinate with ShapeRegistry for node rendering
 * - Emit node lifecycle events
 *
 * @module core/managers/NodeManager
 */

import { NodeModel } from "../models/NodeModel.js";

export class NodeManager {
  constructor(eventBus, stateManager, shapeRegistry) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.shapeRegistry = shapeRegistry;

    // Node storage
    this.nodes = new Map(); // nodeId -> NodeModel

    // ID generation
    this.nextNodeId = 1;

    // Node tracking
    this.nodesByType = new Map(); // type -> Set of node IDs

    this._setupEventListeners();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for state changes that might affect nodes
    this.eventBus.on("theme:changed", ({ theme }) => {
      this._applyThemeToNodes(theme);
    });
  }

  /**
   * Create a new node
   * @param {Object} data - Node data
   * @returns {string} - Created node ID
   */
  createNode(data) {
    try {
      // Generate ID if not provided
      const nodeId = data.id || this._generateNodeId();

      // Validate node type exists in registry
      if (!this.shapeRegistry.hasShape(data.type)) {
        throw new Error(`Unknown shape type: ${data.type}`);
      }

      // Create node model
      const nodeData = {
        id: nodeId,
        type: data.type || "rect",
        x: data.x || 0,
        y: data.y || 0,
        width: data.width || 120,
        height: data.height || 80,
        label: data.label || "",
        style: data.style || {},
        data: data.data || {},
        ports: data.ports || [],
        locked: data.locked || false,
        visible: data.visible !== false,
        rotation: data.rotation || 0,
        zIndex: data.zIndex || 0,
      };

      const node = new NodeModel(nodeData);

      // Store node
      this.nodes.set(nodeId, node);

      // Track by type
      if (!this.nodesByType.has(data.type)) {
        this.nodesByType.set(data.type, new Set());
      }
      this.nodesByType.get(data.type).add(nodeId);

      // Update state
      this._updateState();

      // Emit events
      this.eventBus.emit("node:created", {
        nodeId,
        node: node.serialize(),
        type: data.type,
      });

      return nodeId;
    } catch (error) {
      console.error("Error creating node:", error);
      this.eventBus.emit("node:error", { operation: "create", error });
      throw error;
    }
  }

  /**
   * Create multiple nodes at once
   * @param {Array} nodesData - Array of node data objects
   * @returns {Array} - Array of created node IDs
   */
  createNodes(nodesData) {
    return nodesData.map((data) => this.createNode(data));
  }

  /**
   * Get a node by ID
   * @param {string} nodeId - Node identifier
   * @returns {NodeModel|null}
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Get multiple nodes by IDs
   * @param {Array} nodeIds - Array of node IDs
   * @returns {Array}
   */
  getNodes(nodeIds) {
    return nodeIds.map((id) => this.getNode(id)).filter(Boolean);
  }

  /**
   * Get all nodes
   * @returns {Array}
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by type
   * @param {string} type - Node type
   * @returns {Array}
   */
  getNodesByType(type) {
    const nodeIds = this.nodesByType.get(type);
    if (!nodeIds) return [];

    return Array.from(nodeIds)
      .map((id) => this.getNode(id))
      .filter(Boolean);
  }

  /**
   * Check if node exists
   * @param {string} nodeId - Node identifier
   * @returns {boolean}
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Update node properties
   * @param {string} nodeId - Node identifier
   * @param {Object} updates - Properties to update
   */
  updateNode(nodeId, updates) {
    const node = this.getNode(nodeId);
    if (!node) {
      console.warn(`Node ${nodeId} not found`);
      return false;
    }

    try {
      // Store old values for undo
      const oldValues = {};
      Object.keys(updates).forEach((key) => {
        oldValues[key] = node[key];
      });

      // Apply updates
      Object.assign(node, updates);

      // Update type tracking if type changed
      if (updates.type && updates.type !== oldValues.type) {
        this._updateNodeTypeTracking(nodeId, oldValues.type, updates.type);
      }

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("node:updated", {
        nodeId,
        updates,
        oldValues,
        node: node.serialize(),
      });

      return true;
    } catch (error) {
      console.error("Error updating node:", error);
      this.eventBus.emit("node:error", { operation: "update", nodeId, error });
      return false;
    }
  }

  /**
   * Update a single node property
   * @param {string} nodeId - Node identifier
   * @param {string} property - Property name
   * @param {*} value - New value
   */
  updateNodeProperty(nodeId, property, value) {
    return this.updateNode(nodeId, { [property]: value });
  }

  /**
   * Update node position
   * @param {string} nodeId - Node identifier
   * @param {Object} position - {x, y}
   */
  updateNodePosition(nodeId, position) {
    const node = this.getNode(nodeId);
    if (!node) return false;

    const oldPosition = { x: node.x, y: node.y };

    node.x = position.x;
    node.y = position.y;

    this.eventBus.emit("node:moved", {
      nodeId,
      position,
      oldPosition,
    });

    return true;
  }

  /**
   * Update node size
   * @param {string} nodeId - Node identifier
   * @param {Object} size - {width, height}
   */
  updateNodeSize(nodeId, size) {
    const node = this.getNode(nodeId);
    if (!node) return false;

    const oldSize = { width: node.width, height: node.height };

    node.width = size.width;
    node.height = size.height;

    this.eventBus.emit("node:resized", {
      nodeId,
      size,
      oldSize,
    });

    return true;
  }

  /**
   * Delete a node
   * @param {string} nodeId - Node identifier
   * @returns {boolean}
   */
  deleteNode(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) {
      console.warn(`Node ${nodeId} not found`);
      return false;
    }

    try {
      // Store node data for undo
      const nodeData = node.serialize();

      // Remove from type tracking
      const typeSet = this.nodesByType.get(node.type);
      if (typeSet) {
        typeSet.delete(nodeId);
      }

      // Remove node
      this.nodes.delete(nodeId);

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("node:deleted", {
        nodeId,
        nodeData,
      });

      return true;
    } catch (error) {
      console.error("Error deleting node:", error);
      this.eventBus.emit("node:error", { operation: "delete", nodeId, error });
      return false;
    }
  }

  /**
   * Delete multiple nodes
   * @param {Array} nodeIds - Array of node IDs
   * @returns {Array} - Successfully deleted node IDs
   */
  deleteNodes(nodeIds) {
    const deleted = [];

    nodeIds.forEach((nodeId) => {
      if (this.deleteNode(nodeId)) {
        deleted.push(nodeId);
      }
    });

    return deleted;
  }

  /**
   * Clear all nodes
   */
  clearAll() {
    const nodeIds = Array.from(this.nodes.keys());

    nodeIds.forEach((nodeId) => {
      this.deleteNode(nodeId);
    });

    this.nodes.clear();
    this.nodesByType.clear();
    this.nextNodeId = 1;

    this._updateState();

    this.eventBus.emit("nodes:cleared");
  }

  /**
   * Clone a node
   * @param {string} nodeId - Node to clone
   * @param {Object} offset - Position offset {x, y}
   * @returns {string} - Cloned node ID
   */
  cloneNode(nodeId, offset = { x: 20, y: 20 }) {
    const node = this.getNode(nodeId);
    if (!node) return null;

    const nodeData = node.serialize();

    // Create new node with offset
    return this.createNode({
      ...nodeData,
      id: undefined, // Generate new ID
      x: nodeData.x + offset.x,
      y: nodeData.y + offset.y,
      label: nodeData.label ? `${nodeData.label} (copy)` : "",
    });
  }

  /**
   * Clone multiple nodes
   * @param {Array} nodeIds - Nodes to clone
   * @param {Object} offset - Position offset
   * @returns {Array} - Cloned node IDs
   */
  cloneNodes(nodeIds, offset) {
    return nodeIds.map((id) => this.cloneNode(id, offset)).filter(Boolean);
  }

  /**
   * Get node bounds (bounding box)
   * @param {string} nodeId - Node identifier
   * @returns {Object} - {x, y, width, height}
   */
  getNodeBounds(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return null;

    return {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      left: node.x,
      right: node.x + node.width,
      top: node.y,
      bottom: node.y + node.height,
      centerX: node.x + node.width / 2,
      centerY: node.y + node.height / 2,
    };
  }

  /**
   * Get bounds for multiple nodes (combined bounding box)
   * @param {Array} nodeIds - Node identifiers
   * @returns {Object}
   */
  getNodesBounds(nodeIds) {
    const nodes = this.getNodes(nodeIds);
    if (nodes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  /**
   * Check if a point is inside a node
   * @param {string} nodeId - Node identifier
   * @param {Object} point - {x, y}
   * @returns {boolean}
   */
  isPointInNode(nodeId, point) {
    const bounds = this.getNodeBounds(nodeId);
    if (!bounds) return false;

    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    );
  }

  /**
   * Get nodes at point
   * @param {Object} point - {x, y}
   * @returns {Array} - Node IDs at point
   */
  getNodesAtPoint(point) {
    return this.getAllNodes()
      .filter((node) => this.isPointInNode(node.id, point))
      .map((node) => node.id);
  }

  /**
   * Get nodes in rectangle
   * @param {Object} rect - {x, y, width, height}
   * @returns {Array} - Node IDs in rectangle
   */
  getNodesInRect(rect) {
    return this.getAllNodes()
      .filter((node) => {
        const bounds = this.getNodeBounds(node.id);
        return this._boundsIntersect(bounds, rect);
      })
      .map((node) => node.id);
  }

  /**
   * Check if two bounds intersect
   * @private
   */
  _boundsIntersect(bounds1, bounds2) {
    return !(
      bounds1.right < bounds2.x ||
      bounds1.left > bounds2.x + bounds2.width ||
      bounds1.bottom < bounds2.y ||
      bounds1.top > bounds2.y + bounds2.height
    );
  }

  /**
   * Get node statistics
   * @returns {Object}
   */
  getStats() {
    const typeStats = {};

    this.nodesByType.forEach((nodeIds, type) => {
      typeStats[type] = nodeIds.size;
    });

    return {
      totalNodes: this.nodes.size,
      byType: typeStats,
      nextId: this.nextNodeId,
    };
  }

  /**
   * Find nodes by criteria
   * @param {Function} predicate - Filter function
   * @returns {Array}
   */
  findNodes(predicate) {
    return this.getAllNodes().filter(predicate);
  }

  /**
   * Get node count
   * @returns {number}
   */
  getNodeCount() {
    return this.nodes.size;
  }

  /**
   * Lock a node
   * @param {string} nodeId - Node identifier
   */
  lockNode(nodeId) {
    return this.updateNodeProperty(nodeId, "locked", true);
  }

  /**
   * Unlock a node
   * @param {string} nodeId - Node identifier
   */
  unlockNode(nodeId) {
    return this.updateNodeProperty(nodeId, "locked", false);
  }

  /**
   * Show a node
   * @param {string} nodeId - Node identifier
   */
  showNode(nodeId) {
    return this.updateNodeProperty(nodeId, "visible", true);
  }

  /**
   * Hide a node
   * @param {string} nodeId - Node identifier
   */
  hideNode(nodeId) {
    return this.updateNodeProperty(nodeId, "visible", false);
  }

  /**
   * Generate unique node ID
   * @private
   */
  _generateNodeId() {
    return `node_${this.nextNodeId++}`;
  }

  /**
   * Update node type tracking
   * @private
   */
  _updateNodeTypeTracking(nodeId, oldType, newType) {
    // Remove from old type
    const oldTypeSet = this.nodesByType.get(oldType);
    if (oldTypeSet) {
      oldTypeSet.delete(nodeId);
    }

    // Add to new type
    if (!this.nodesByType.has(newType)) {
      this.nodesByType.set(newType, new Set());
    }
    this.nodesByType.get(newType).add(nodeId);
  }

  /**
   * Apply theme to all nodes
   * @private
   */
  _applyThemeToNodes(theme) {
    this.getAllNodes().forEach((node) => {
      this.eventBus.emit("node:theme:changed", {
        nodeId: node.id,
        theme,
      });
    });
  }

  /**
   * Update state manager
   * @private
   */
  _updateState() {
    this.stateManager.setState("nodes", {
      count: this.nodes.size,
      byType: Object.fromEntries(
        Array.from(this.nodesByType.entries()).map(([type, ids]) => [
          type,
          ids.size,
        ])
      ),
    });
  }

  /**
   * Serialize all nodes
   * @returns {Array}
   */
  serialize() {
    return this.getAllNodes().map((node) => node.serialize());
  }

  /**
   * Deserialize and load nodes
   * @param {Array} nodesData - Serialized nodes
   */
  deserialize(nodesData) {
    // Clear existing nodes
    this.clearAll();

    // Create nodes from data
    nodesData.forEach((nodeData) => {
      this.createNode(nodeData);
    });

    // Update next ID to avoid conflicts
    const maxId = Math.max(
      ...nodesData
        .map((n) => n.id)
        .filter((id) => id.startsWith("node_"))
        .map((id) => parseInt(id.split("_")[1]))
        .filter((n) => !isNaN(n)),
      0
    );

    this.nextNodeId = maxId + 1;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearAll();
    this.eventBus.off("theme:changed");
  }
}
