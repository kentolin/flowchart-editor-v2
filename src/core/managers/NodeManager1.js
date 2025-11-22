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
import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class NodeManager {
  constructor(editor, shapeRegistry, eventBus) {
    // Initialize debug logger
    this.log = new DebugLogger("NodeManager", "#4CAF50");
    this.log.enter("constructor");

    this.editor = editor;
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;

    // Note: StateManager is accessed via editor if needed
    this.stateManager = null; // Will be set if needed

    // Node storage
    this.nodes = new Map(); // nodeId -> NodeModel

    // ID generation
    this.nextNodeId = 1;

    // Node tracking
    this.nodesByType = new Map(); // type -> Set of node IDs

    this._setupEventListeners();

    this.log.info("constructor", "✓ NodeManager initialized");
    this.log.exit("constructor");
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    this.log.enter("_setupEventListeners");

    // Listen for state changes that might affect nodes
    this.eventBus.on("theme:changed", ({ theme }) => {
      this.log.info("_setupEventListeners", `Theme changed to: ${theme}`);
      this._applyThemeToNodes(theme);
    });

    this.log.info("_setupEventListeners", "✓ Event listeners registered");
    this.log.exit("_setupEventListeners");
  }

  /**
   * Create a new node
   * @param {Object} data - Node data
   * @returns {string} - Created node ID
   */
  createNode(data) {
    this.log.enter("createNode", { type: data.type, x: data.x, y: data.y });

    try {
      // Generate ID if not provided
      const nodeId = data.id || this._generateNodeId();

      this.log.info("createNode", `Generated node ID: ${nodeId}`);

      // Validate node type exists in registry
      if (!this.shapeRegistry.hasShape(data.type)) {
        this.log.error("createNode", `Unknown shape type: ${data.type}`);
        throw new Error(`Unknown shape type: ${data.type}`);
      }

      this.log.info("createNode", `Shape type '${data.type}' validated`);

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
      this.log.info("createNode", `Created NodeModel instance`);

      // Store node
      this.nodes.set(nodeId, node);
      this.log.info(
        "createNode",
        `Stored node in map (total: ${this.nodes.size})`
      );

      // Track by type
      if (!this.nodesByType.has(data.type)) {
        this.nodesByType.set(data.type, new Set());
        this.log.info("createNode", `Created new type set for '${data.type}'`);
      }
      this.nodesByType.get(data.type).add(nodeId);

      // Update state
      this._updateState();

      // Emit events
      this.eventBus.emit("node:created", {
        nodeId,
        node: node.toJSON(),
        type: data.type,
      });

      this.log.info("createNode", `✓ Node '${nodeId}' created successfully`);
      this.log.exit("createNode");

      return nodeId;
    } catch (error) {
      this.log.error("createNode", "Failed to create node:", error);
      this.eventBus.emit("node:error", { operation: "create", error });
      this.log.exit("createNode");
      throw error;
    }
  }

  /**
   * Create multiple nodes at once
   * @param {Array} nodesData - Array of node data objects
   * @returns {Array} - Array of created node IDs
   */
  createNodes(nodesData) {
    this.log.enter("createNodes", { count: nodesData.length });

    const nodeIds = nodesData.map((data) => this.createNode(data));

    this.log.info("createNodes", `✓ Created ${nodeIds.length} nodes`);
    this.log.exit("createNodes");

    return nodeIds;
  }

  /**
   * Get a node by ID
   * @param {string} nodeId - Node identifier
   * @returns {NodeModel|null}
   */
  getNode(nodeId) {
    this.log.enter("getNode", { nodeId });

    const node = this.nodes.get(nodeId) || null;

    if (node) {
      this.log.info("getNode", `Found node '${nodeId}'`);
    } else {
      this.log.warn("getNode", `Node '${nodeId}' not found`);
    }

    this.log.exit("getNode");
    return node;
  }

  /**
   * Get multiple nodes by IDs
   * @param {Array} nodeIds - Array of node IDs
   * @returns {Array}
   */
  getNodes(nodeIds) {
    this.log.enter("getNodes", { count: nodeIds.length });

    const nodes = nodeIds.map((id) => this.getNode(id)).filter(Boolean);

    this.log.info(
      "getNodes",
      `Retrieved ${nodes.length}/${nodeIds.length} nodes`
    );
    this.log.exit("getNodes");

    return nodes;
  }

  /**
   * Get all nodes
   * @returns {Array}
   */
  getAllNodes() {
    this.log.enter("getAllNodes");

    const nodes = Array.from(this.nodes.values());

    this.log.info("getAllNodes", `Returning ${nodes.length} nodes`);
    this.log.exit("getAllNodes");

    return nodes;
  }

  /**
   * Get nodes by type
   * @param {string} type - Node type
   * @returns {Array}
   */
  getNodesByType(type) {
    this.log.enter("getNodesByType", { type });

    const nodeIds = this.nodesByType.get(type);
    if (!nodeIds) {
      this.log.info("getNodesByType", `No nodes of type '${type}'`);
      this.log.exit("getNodesByType");
      return [];
    }

    const nodes = Array.from(nodeIds)
      .map((id) => this.getNode(id))
      .filter(Boolean);

    this.log.info(
      "getNodesByType",
      `Found ${nodes.length} nodes of type '${type}'`
    );
    this.log.exit("getNodesByType");

    return nodes;
  }

  /**
   * Check if node exists
   * @param {string} nodeId - Node identifier
   * @returns {boolean}
   */
  hasNode(nodeId) {
    const exists = this.nodes.has(nodeId);
    this.log.info("hasNode", `Node '${nodeId}' exists: ${exists}`);
    return exists;
  }

  /**
   * Update node properties
   * @param {string} nodeId - Node identifier
   * @param {Object} updates - Properties to update
   */
  updateNode(nodeId, updates) {
    this.log.enter("updateNode", { nodeId, updates });

    const node = this.getNode(nodeId);
    if (!node) {
      this.log.warn("updateNode", `Node ${nodeId} not found`);
      this.log.exit("updateNode");
      return false;
    }

    try {
      // Store old values for undo
      const oldValues = {};
      Object.keys(updates).forEach((key) => {
        oldValues[key] = node[key];
      });

      this.log.info(
        "updateNode",
        `Updating properties: ${Object.keys(updates).join(", ")}`
      );

      // Apply updates
      Object.assign(node, updates);

      // Update type tracking if type changed
      if (updates.type && updates.type !== oldValues.type) {
        this.log.info(
          "updateNode",
          `Type changed from '${oldValues.type}' to '${updates.type}'`
        );
        this._updateNodeTypeTracking(nodeId, oldValues.type, updates.type);
      }

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("node:updated", {
        nodeId,
        updates,
        oldValues,
        node: node.toJSON(),
      });

      this.log.info("updateNode", `✓ Node '${nodeId}' updated`);
      this.log.exit("updateNode");

      return true;
    } catch (error) {
      this.log.error("updateNode", "Failed to update node:", error);
      this.eventBus.emit("node:error", { operation: "update", nodeId, error });
      this.log.exit("updateNode");
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
    this.log.enter("updateNodeProperty", { nodeId, property, value });

    const result = this.updateNode(nodeId, { [property]: value });

    this.log.exit("updateNodeProperty");
    return result;
  }

  /**
   * Update node position
   * @param {string} nodeId - Node identifier
   * @param {Object} position - {x, y}
   */
  updateNodePosition(nodeId, position) {
    this.log.enter("updateNodePosition", { nodeId, position });

    const node = this.getNode(nodeId);
    if (!node) {
      this.log.warn("updateNodePosition", `Node '${nodeId}' not found`);
      this.log.exit("updateNodePosition");
      return false;
    }

    const oldPosition = { x: node.x, y: node.y };

    node.x = position.x;
    node.y = position.y;

    this.eventBus.emit("node:moved", {
      nodeId,
      position,
      oldPosition,
    });

    this.log.info(
      "updateNodePosition",
      `✓ Moved node from (${oldPosition.x}, ${oldPosition.y}) to (${position.x}, ${position.y})`
    );
    this.log.exit("updateNodePosition");

    return true;
  }

  /**
   * Update node size
   * @param {string} nodeId - Node identifier
   * @param {Object} size - {width, height}
   */
  updateNodeSize(nodeId, size) {
    this.log.enter("updateNodeSize", { nodeId, size });

    const node = this.getNode(nodeId);
    if (!node) {
      this.log.warn("updateNodeSize", `Node '${nodeId}' not found`);
      this.log.exit("updateNodeSize");
      return false;
    }

    const oldSize = { width: node.width, height: node.height };

    node.width = size.width;
    node.height = size.height;

    this.eventBus.emit("node:resized", {
      nodeId,
      size,
      oldSize,
    });

    this.log.info(
      "updateNodeSize",
      `✓ Resized from ${oldSize.width}x${oldSize.height} to ${size.width}x${size.height}`
    );
    this.log.exit("updateNodeSize");

    return true;
  }

  /**
   * Delete a node
   * @param {string} nodeId - Node identifier
   * @returns {boolean}
   */
  deleteNode(nodeId) {
    this.log.enter("deleteNode", { nodeId });

    const node = this.getNode(nodeId);
    if (!node) {
      this.log.warn("deleteNode", `Node ${nodeId} not found`);
      this.log.exit("deleteNode");
      return false;
    }

    try {
      // Store node data for undo
      const nodeData = node.toJSON();

      // Remove from type tracking
      const typeSet = this.nodesByType.get(node.type);
      if (typeSet) {
        typeSet.delete(nodeId);
        this.log.info(
          "deleteNode",
          `Removed from type '${node.type}' tracking`
        );
      }

      // Remove node
      this.nodes.delete(nodeId);
      this.log.info(
        "deleteNode",
        `Removed from nodes map (remaining: ${this.nodes.size})`
      );

      // Update state
      this._updateState();

      // Emit event
      this.eventBus.emit("node:deleted", {
        nodeId,
        nodeData,
      });

      this.log.info("deleteNode", `✓ Node '${nodeId}' deleted`);
      this.log.exit("deleteNode");

      return true;
    } catch (error) {
      this.log.error("deleteNode", "Failed to delete node:", error);
      this.eventBus.emit("node:error", { operation: "delete", nodeId, error });
      this.log.exit("deleteNode");
      return false;
    }
  }

  /**
   * Delete multiple nodes
   * @param {Array} nodeIds - Array of node IDs
   * @returns {Array} - Successfully deleted node IDs
   */
  deleteNodes(nodeIds) {
    this.log.enter("deleteNodes", { count: nodeIds.length });

    const deleted = [];

    nodeIds.forEach((nodeId) => {
      if (this.deleteNode(nodeId)) {
        deleted.push(nodeId);
      }
    });

    this.log.info(
      "deleteNodes",
      `✓ Deleted ${deleted.length}/${nodeIds.length} nodes`
    );
    this.log.exit("deleteNodes");

    return deleted;
  }

  /**
   * Clear all nodes
   */
  clearAll() {
    this.log.enter("clearAll");

    const nodeIds = Array.from(this.nodes.keys());
    const count = nodeIds.length;

    nodeIds.forEach((nodeId) => {
      this.deleteNode(nodeId);
    });

    this.nodes.clear();
    this.nodesByType.clear();
    this.nextNodeId = 1;

    this._updateState();

    this.eventBus.emit("nodes:cleared");

    this.log.info("clearAll", `✓ Cleared ${count} nodes`);
    this.log.exit("clearAll");
  }

  /**
   * Clone a node
   * @param {string} nodeId - Node to clone
   * @param {Object} offset - Position offset {x, y}
   * @returns {string} - Cloned node ID
   */
  cloneNode(nodeId, offset = { x: 20, y: 20 }) {
    this.log.enter("cloneNode", { nodeId, offset });

    const node = this.getNode(nodeId);
    if (!node) {
      this.log.warn("cloneNode", `Node '${nodeId}' not found`);
      this.log.exit("cloneNode");
      return null;
    }

    const nodeData = node.toJSON();

    // Create new node with offset
    const newNodeId = this.createNode({
      ...nodeData,
      id: undefined, // Generate new ID
      x: nodeData.x + offset.x,
      y: nodeData.y + offset.y,
      label: nodeData.label ? `${nodeData.label} (copy)` : "",
    });

    this.log.info("cloneNode", `✓ Cloned '${nodeId}' to '${newNodeId}'`);
    this.log.exit("cloneNode");

    return newNodeId;
  }

  /**
   * Clone multiple nodes
   * @param {Array} nodeIds - Nodes to clone
   * @param {Object} offset - Position offset
   * @returns {Array} - Cloned node IDs
   */
  cloneNodes(nodeIds, offset) {
    this.log.enter("cloneNodes", { count: nodeIds.length, offset });

    const cloned = nodeIds
      .map((id) => this.cloneNode(id, offset))
      .filter(Boolean);

    this.log.info(
      "cloneNodes",
      `✓ Cloned ${cloned.length}/${nodeIds.length} nodes`
    );
    this.log.exit("cloneNodes");

    return cloned;
  }

  /**
   * Get node bounds (bounding box)
   * @param {string} nodeId - Node identifier
   * @returns {Object} - {x, y, width, height}
   */
  getNodeBounds(nodeId) {
    this.log.enter("getNodeBounds", { nodeId });

    const node = this.getNode(nodeId);
    if (!node) {
      this.log.warn("getNodeBounds", `Node '${nodeId}' not found`);
      this.log.exit("getNodeBounds");
      return null;
    }

    const bounds = {
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

    this.log.exit("getNodeBounds");
    return bounds;
  }

  /**
   * Get bounds for multiple nodes (combined bounding box)
   * @param {Array} nodeIds - Node identifiers
   * @returns {Object}
   */
  getNodesBounds(nodeIds) {
    this.log.enter("getNodesBounds", { count: nodeIds.length });

    const nodes = this.getNodes(nodeIds);
    if (nodes.length === 0) {
      this.log.warn("getNodesBounds", "No nodes found");
      this.log.exit("getNodesBounds");
      return null;
    }

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

    const bounds = {
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

    this.log.info(
      "getNodesBounds",
      `Combined bounds: ${bounds.width}x${bounds.height}`
    );
    this.log.exit("getNodesBounds");

    return bounds;
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

    const inside =
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom;

    this.log.info(
      "isPointInNode",
      `Point (${point.x}, ${point.y}) in node '${nodeId}': ${inside}`
    );

    return inside;
  }

  /**
   * Get nodes at point
   * @param {Object} point - {x, y}
   * @returns {Array} - Node IDs at point
   */
  getNodesAtPoint(point) {
    this.log.enter("getNodesAtPoint", { point });

    const nodeIds = this.getAllNodes()
      .filter((node) => this.isPointInNode(node.id, point))
      .map((node) => node.id);

    this.log.info("getNodesAtPoint", `Found ${nodeIds.length} nodes at point`);
    this.log.exit("getNodesAtPoint");

    return nodeIds;
  }

  /**
   * Get nodes in rectangle
   * @param {Object} rect - {x, y, width, height}
   * @returns {Array} - Node IDs in rectangle
   */
  getNodesInRect(rect) {
    this.log.enter("getNodesInRect", { rect });

    const nodeIds = this.getAllNodes()
      .filter((node) => {
        const bounds = this.getNodeBounds(node.id);
        return this._boundsIntersect(bounds, rect);
      })
      .map((node) => node.id);

    this.log.info(
      "getNodesInRect",
      `Found ${nodeIds.length} nodes in rectangle`
    );
    this.log.exit("getNodesInRect");

    return nodeIds;
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
    this.log.enter("getStats");

    const typeStats = {};

    this.nodesByType.forEach((nodeIds, type) => {
      typeStats[type] = nodeIds.size;
    });

    const stats = {
      totalNodes: this.nodes.size,
      byType: typeStats,
      nextId: this.nextNodeId,
    };

    this.log.info(
      "getStats",
      `Total nodes: ${stats.totalNodes}, Types: ${
        Object.keys(typeStats).length
      }`
    );
    this.log.exit("getStats");

    return stats;
  }

  /**
   * Find nodes by criteria
   * @param {Function} predicate - Filter function
   * @returns {Array}
   */
  findNodes(predicate) {
    this.log.enter("findNodes");

    const nodes = this.getAllNodes().filter(predicate);

    this.log.info("findNodes", `Found ${nodes.length} matching nodes`);
    this.log.exit("findNodes");

    return nodes;
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
    this.log.info("lockNode", `Locking node '${nodeId}'`);
    return this.updateNodeProperty(nodeId, "locked", true);
  }

  /**
   * Unlock a node
   * @param {string} nodeId - Node identifier
   */
  unlockNode(nodeId) {
    this.log.info("unlockNode", `Unlocking node '${nodeId}'`);
    return this.updateNodeProperty(nodeId, "locked", false);
  }

  /**
   * Show a node
   * @param {string} nodeId - Node identifier
   */
  showNode(nodeId) {
    this.log.info("showNode", `Showing node '${nodeId}'`);
    return this.updateNodeProperty(nodeId, "visible", true);
  }

  /**
   * Hide a node
   * @param {string} nodeId - Node identifier
   */
  hideNode(nodeId) {
    this.log.info("hideNode", `Hiding node '${nodeId}'`);
    return this.updateNodeProperty(nodeId, "visible", false);
  }

  /**
   * Generate unique node ID
   * @private
   */
  _generateNodeId() {
    const id = `node_${this.nextNodeId++}`;
    this.log.info("_generateNodeId", `Generated ID: ${id}`);
    return id;
  }

  /**
   * Update node type tracking
   * @private
   */
  _updateNodeTypeTracking(nodeId, oldType, newType) {
    this.log.enter("_updateNodeTypeTracking", { nodeId, oldType, newType });

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

    this.log.info(
      "_updateNodeTypeTracking",
      `✓ Moved node from type '${oldType}' to '${newType}'`
    );
    this.log.exit("_updateNodeTypeTracking");
  }

  /**
   * Apply theme to all nodes
   * @private
   */
  _applyThemeToNodes(theme) {
    this.log.enter("_applyThemeToNodes", { theme });

    this.getAllNodes().forEach((node) => {
      this.eventBus.emit("node:theme:changed", {
        nodeId: node.id,
        theme,
      });
    });

    this.log.info(
      "_applyThemeToNodes",
      `✓ Applied theme to ${this.nodes.size} nodes`
    );
    this.log.exit("_applyThemeToNodes");
  }

  /**
   * Update state manager
   * @private
   */
  _updateState() {
    if (!this.stateManager) return;

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
    this.log.enter("serialize");

    const data = this.getAllNodes().map((node) => node.toJSON());

    this.log.info("serialize", `Serialized ${data.length} nodes`);
    this.log.exit("serialize");

    return data;
  }

  /**
   * Deserialize and load nodes
   * @param {Array} nodesData - Serialized nodes
   */
  deserialize(nodesData) {
    this.log.enter("deserialize", { count: nodesData.length });

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

    this.log.info(
      "deserialize",
      `✓ Deserialized ${nodesData.length} nodes, next ID: ${this.nextNodeId}`
    );
    this.log.exit("deserialize");
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.log.enter("destroy");

    this.clearAll();
    this.eventBus.off("theme:changed");

    this.log.info("destroy", "✓ NodeManager destroyed");
    this.log.exit("destroy");
  }
}
