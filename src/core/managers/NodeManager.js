/**
 * NodeManager.js - Node Management and Operations
 *
 * Manages the creation, deletion, and manipulation of nodes.
 * Coordinates NodeModel, NodeView, and NodeController for each node.
 *
 * DEPENDENCIES: Editor, ShapeRegistry, EventBus, StateManager
 *
 * IMPORTANT: Uses StateManager (not EditorState directly)
 *
 * @module core/managers/NodeManager
 * @version 3.0.0 - Uses Complete StateManager
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";
import { NodeModel } from "../models/NodeModel.js";
import { NodeView } from "../views/NodeView.js";
import { NodeController } from "../controllers/NodeController.js";

export class NodeManager {
  /**
   * Create NodeManager
   *
   * @param {Editor} editor - Editor instance for rendering
   * @param {ShapeRegistry} shapeRegistry - Shape registry
   * @param {EventBus} eventBus - Event bus
   * @param {StateManager} stateManager - State manager (NOT EditorState!)
   */
  constructor(editor, shapeRegistry, eventBus, stateManager) {
    this.log = new DebugLogger("NodeManager", "#4CAF50");
    this.log.enable(); // Enable logging
    this.log.enter("constructor");

    // Validate dependencies
    if (!editor) {
      this.log.error("constructor", "Editor is required");
      throw new Error("NodeManager: Editor is required");
    }
    if (!shapeRegistry) {
      this.log.error("constructor", "ShapeRegistry is required");
      throw new Error("NodeManager: ShapeRegistry is required");
    }
    if (!eventBus) {
      this.log.error("constructor", "EventBus is required");
      throw new Error("NodeManager: EventBus is required");
    }
    if (!stateManager) {
      this.log.error("constructor", "StateManager is required");
      throw new Error("NodeManager: StateManager is required");
    }

    this.editor = editor;
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;
    this.stateManager = stateManager; // ← StateManager (complete layer)

    this.log.info("constructor", "Dependencies validated");

    // Storage maps for MVC components
    this.nodes = new Map(); // nodeId -> NodeModel
    this.views = new Map(); // nodeId -> NodeView
    this.controllers = new Map(); // nodeId -> NodeController

    // Node ID counter
    this.nextNodeId = 1;

    this.log.info("constructor", "✓ NodeManager initialized");
    this.log.exit("constructor");
  }

  /**
   * Create a new node
   *
   * @param {string} type - Shape type
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Additional options
   * @returns {NodeModel} Created node model
   */
  createNode(type, x, y, options = {}) {
    this.log.enter("createNode", { type, x, y, options });

    try {
      // 1. Get shape definition from registry
      this.log.info(
        "createNode",
        `Looking up shape type '${type}' in registry...`
      );
      const shapeDefinition = this.shapeRegistry.getDefinition(type);

      if (!shapeDefinition) {
        this.log.error(
          "createNode",
          `Shape type '${type}' not found in registry`
        );

        // Show available shapes for debugging
        const allDefs = this.shapeRegistry.getAllDefinitions();
        this.log.info("createNode", `Available shapes (${allDefs.length}):`);
        allDefs.forEach((def) => {
          this.log.info(
            "createNode",
            `  - ${def.type}: ${def.name || "unnamed"}`
          );
        });

        throw new Error(
          `Shape type '${type}' not registered. Available shapes: ${allDefs
            .map((d) => d.type)
            .join(", ")}`
        );
      }

      this.log.info(
        "createNode",
        `✓ Found ShapeDefinition: ${shapeDefinition.name}`
      );

      // 2. Verify shape class is loaded
      if (!shapeDefinition.isClassLoaded()) {
        this.log.error(
          "createNode",
          `Shape class not loaded for type '${type}'`
        );
        throw new Error(
          `Shape class not loaded for type '${type}'. Call ShapeLoader to load shapes first.`
        );
      }

      this.log.info("createNode", "✓ Shape class is loaded");

      // 3. Get default configuration from ShapeDefinition
      const defaultConfig = shapeDefinition.getDefaultConfig();
      this.log.info(
        "createNode",
        "Default config from ShapeDefinition:",
        defaultConfig
      );

      // 4. Generate node ID
      const nodeId = options.id || `node_${this.nextNodeId++}`;
      this.log.info("createNode", `Generated node ID: ${nodeId}`);

      // 5. Create node data object by merging defaults with options
      const nodeData = {
        id: nodeId,
        type: type,
        x: x,
        y: y,
        width: options.width || defaultConfig.width,
        height: options.height || defaultConfig.height,
        label: options.label || defaultConfig.name || type,

        // Style
        style: {
          ...defaultConfig.style,
          ...options.style,
        },

        // Ports configuration
        ports:
          options.ports ||
          defaultConfig.ports ||
          shapeDefinition.getDefaultPorts(),
        portsEnabled:
          options.portsEnabled !== undefined
            ? options.portsEnabled
            : defaultConfig.portsEnabled,

        // Handles configuration
        handles: options.handles || defaultConfig.handles,
        handlesEnabled:
          options.handlesEnabled !== undefined
            ? options.handlesEnabled
            : defaultConfig.handlesEnabled,

        // Constraints and features
        constraints: {
          ...defaultConfig.constraints,
          ...options.constraints,
        },
        features: {
          ...defaultConfig.features,
          ...options.features,
        },

        // Transform
        rotation: options.rotation || 0,
        zIndex: options.zIndex || 0,

        // State
        locked: options.locked || false,
        visible: options.visible !== false,

        // Custom data
        data: options.data || {},
      };

      this.log.info("createNode", "Node data prepared:", {
        id: nodeData.id,
        type: nodeData.type,
        position: { x: nodeData.x, y: nodeData.y },
        size: { width: nodeData.width, height: nodeData.height },
      });

      // 6. Create NodeModel
      this.log.info("createNode", "Creating NodeModel...");
      const nodeModel = new NodeModel(nodeData);
      this.log.info("createNode", `✓ NodeModel created: ${nodeModel.id}`);

      // 7. Create NodeView (passes ShapeDefinition)
      this.log.info("createNode", "Creating NodeView...");
      const nodeView = new NodeView(nodeModel, shapeDefinition);
      this.log.info("createNode", "✓ NodeView created");

      // 8. Create NodeController
      this.log.info("createNode", "Creating NodeController...");
      const nodeController = new NodeController(
        nodeModel,
        nodeView,
        this.eventBus
      );
      this.log.info("createNode", "✓ NodeController created");

      // 9. Store in local maps
      this.nodes.set(nodeModel.id, nodeModel);
      this.views.set(nodeModel.id, nodeView);
      this.controllers.set(nodeModel.id, nodeController);
      this.log.info(
        "createNode",
        `✓ Stored in maps (total nodes: ${this.nodes.size})`
      );

      // 10. Add to state via StateManager
      this.log.info("createNode", "Adding to StateManager...");

      // Prepare state data
      const stateData = {
        id: nodeModel.id,
        type: nodeModel.type,
        x: nodeModel.x,
        y: nodeModel.y,
        width: nodeModel.width,
        height: nodeModel.height,
        label: nodeModel.label,
        style: { ...nodeModel.style },
        ports: nodeModel.ports ? [...nodeModel.ports] : [],
        portsEnabled: nodeModel.portsEnabled,
        handles: nodeModel.handles ? [...nodeModel.handles] : [],
        handlesEnabled: nodeModel.handlesEnabled,
        rotation: nodeModel.rotation,
        zIndex: nodeModel.zIndex,
        locked: nodeModel.locked,
        visible: nodeModel.visible,
        data: { ...nodeModel.data },
      };

      // Add via StateManager (not EditorState!)
      this.stateManager.addNode(nodeModel.id, stateData);
      this.log.info("createNode", "✓ Added to state via StateManager");

      // 11. Render to canvas
      this.log.info("createNode", "Rendering to canvas...");
      const nodeGroup = nodeView.element;

      if (!nodeGroup) {
        this.log.error(
          "createNode",
          "NodeView.element returned null/undefined"
        );
        throw new Error("NodeView failed to create SVG element");
      }

      this.editor.addNodeElement(nodeModel.id, nodeGroup);
      this.log.info("createNode", "✓ Rendered to canvas");

      // 12. Emit event
      this.eventBus.emit("node:created", {
        id: nodeModel.id,
        type: nodeModel.type,
        x: nodeModel.x,
        y: nodeModel.y,
      });

      this.log.info(
        "createNode",
        `✅ Node created successfully: ${nodeModel.id} (${type})`
      );
      this.log.exit("createNode");

      return nodeModel;
    } catch (error) {
      this.log.error("createNode", "❌ Failed to create node");
      this.log.error("createNode", `Error: ${error.message}`);
      this.log.error("createNode", `Stack: ${error.stack}`);

      throw new Error(
        `NodeManager.createNode failed for type '${type}': ${error.message}`
      );
    }
  }

  /**
   * Get node by ID
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * Get node view by ID
   */
  getNodeView(nodeId) {
    return this.views.get(nodeId);
  }

  /**
   * Get node controller by ID
   */
  getNodeController(nodeId) {
    return this.controllers.get(nodeId);
  }

  /**
   * Check if node exists
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Update node properties
   */
  updateNode(nodeId, updates) {
    this.log.enter("updateNode", { nodeId, updates });

    const nodeModel = this.nodes.get(nodeId);
    if (!nodeModel) {
      this.log.warn("updateNode", `Node '${nodeId}' not found`);
      this.log.exit("updateNode");
      return;
    }

    const nodeView = this.views.get(nodeId);

    // Update model
    Object.assign(nodeModel, updates);
    this.log.info("updateNode", `✓ Model updated`);

    // Update state via StateManager
    this.stateManager.updateNode(nodeId, updates);
    this.log.info("updateNode", `✓ State updated via StateManager`);

    // Re-render
    if (nodeView) {
      nodeView.update();
      this.log.info("updateNode", `✓ View re-rendered`);
    }

    // Emit event
    this.eventBus.emit("node:updated", { id: nodeId, updates });

    this.log.info("updateNode", `✅ Node updated: ${nodeId}`);
    this.log.exit("updateNode");
  }

  /**
   * Remove node
   */
  removeNode(nodeId) {
    this.log.enter("removeNode", { nodeId });

    if (!this.nodes.has(nodeId)) {
      this.log.warn("removeNode", `Node '${nodeId}' not found`);
      this.log.exit("removeNode");
      return;
    }

    // Get controller and destroy it
    const nodeController = this.controllers.get(nodeId);
    if (nodeController && typeof nodeController.destroy === "function") {
      nodeController.destroy();
      this.log.info("removeNode", "✓ Controller destroyed");
    }

    // Remove from maps
    this.nodes.delete(nodeId);
    this.views.delete(nodeId);
    this.controllers.delete(nodeId);
    this.log.info("removeNode", "✓ Removed from maps");

    // Remove from state via StateManager
    this.stateManager.removeNode(nodeId);
    this.log.info("removeNode", "✓ Removed from state via StateManager");

    // Remove from canvas
    this.editor.removeNodeElement(nodeId);
    this.log.info("removeNode", "✓ Removed from canvas");

    // Emit event
    this.eventBus.emit("node:deleted", { id: nodeId });

    this.log.info("removeNode", `✅ Node removed: ${nodeId}`);
    this.log.exit("removeNode");
  }

  /**
   * Remove multiple nodes
   */
  removeNodes(nodeIds) {
    this.log.enter("removeNodes", { count: nodeIds.length });
    nodeIds.forEach((nodeId) => this.removeNode(nodeId));
    this.log.info("removeNodes", `✅ Removed ${nodeIds.length} nodes`);
    this.log.exit("removeNodes");
  }

  /**
   * Get node at position
   */
  getNodeAt(x, y) {
    const nodes = Array.from(this.nodes.values()).sort(
      (a, b) => (b.zIndex || 0) - (a.zIndex || 0)
    );

    for (const node of nodes) {
      if (
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        return node;
      }
    }

    return null;
  }

  /**
   * Get nodes in area
   */
  getNodesInArea(x, y, width, height) {
    const nodesInArea = [];

    for (const node of this.nodes.values()) {
      if (
        node.x < x + width &&
        node.x + node.width > x &&
        node.y < y + height &&
        node.y + node.height > y
      ) {
        nodesInArea.push(node);
      }
    }

    return nodesInArea;
  }

  /**
   * Get node bounds
   */
  getNodeBounds(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    return {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      centerX: node.x + node.width / 2,
      centerY: node.y + node.height / 2,
    };
  }

  /**
   * Duplicate node
   */
  duplicateNode(nodeId, offsetX = 20, offsetY = 20) {
    this.log.enter("duplicateNode", { nodeId, offsetX, offsetY });

    const original = this.nodes.get(nodeId);
    if (!original) {
      this.log.warn("duplicateNode", `Node '${nodeId}' not found`);
      this.log.exit("duplicateNode");
      return null;
    }

    const duplicate = this.createNode(
      original.type,
      original.x + offsetX,
      original.y + offsetY,
      {
        width: original.width,
        height: original.height,
        label: `${original.label} (copy)`,
        style: { ...original.style },
        rotation: original.rotation,
        data: { ...original.data },
      }
    );

    this.log.info(
      "duplicateNode",
      `✅ Node duplicated: ${nodeId} → ${duplicate.id}`
    );
    this.log.exit("duplicateNode");

    return duplicate;
  }

  /**
   * Clear all nodes
   */
  clear() {
    this.log.enter("clear");
    const nodeIds = Array.from(this.nodes.keys());
    this.removeNodes(nodeIds);
    this.log.info("clear", "✅ All nodes cleared");
    this.log.exit("clear");
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      total: this.nodes.size,
      byType: this._getNodesByType(),
      visible: Array.from(this.nodes.values()).filter((n) => n.visible).length,
      locked: Array.from(this.nodes.values()).filter((n) => n.locked).length,
    };
  }

  /**
   * Get nodes grouped by type (private)
   */
  _getNodesByType() {
    const byType = {};
    for (const node of this.nodes.values()) {
      byType[node.type] = (byType[node.type] || 0) + 1;
    }
    return byType;
  }

  /**
   * Print debug info
   */
  printDebugInfo() {
    const stats = this.getStats();
    console.log("========== NodeManager Debug Info ==========");
    console.log(`Total nodes: ${stats.total}`);
    console.log(`Visible: ${stats.visible}, Locked: ${stats.locked}`);
    console.log("By type:");
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log("=".repeat(44));
  }
}
