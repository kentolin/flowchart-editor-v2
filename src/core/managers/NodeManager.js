/**
 * NodeManager.js - Manages all nodes in the diagram
 *
 * Responsibilities:
 * - CRUD operations for nodes
 * - Create Model + View + Controller for each node
 * - Store references to all nodes
 * - Delegate to Editor for canvas operations
 * - Use ShapeRegistry to get shape definitions
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";
import { NodeModel } from "../models/NodeModel.js";
import { NodeView } from "../views/NodeView.js";
import { NodeController } from "../controllers/NodeController.js";

export class NodeManager {
  constructor(editor, shapeRegistry, eventBus, stateManager) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

    this.editor = editor;
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;
    this.stateManager = stateManager;

    // Store all nodes as Map<nodeId, {model, view, controller}>
    this.nodes = new Map();

    this.log.exit("constructor");
  }

  /**
   * Create a new node
   */
  createNode(type, x, y, options = {}) {
    this.log.enter("createNode", { type, x, y });

    // Get shape definition from registry
    const shapeDefinition = this.shapeRegistry.getDefinition(type);
    if (!shapeDefinition) {
      this.log.error(
        "createNode",
        `Shape definition not found for type: ${type}`
      );
      return null;
    }

    // Create node ID
    const nodeId = options.id || `node_${Date.now()}`;

    // Prepare node data
    const nodeData = {
      id: nodeId,
      type: type,
      x: x,
      y: y,
      width: options.width || shapeDefinition.defaultWidth || 120,
      height: options.height || shapeDefinition.defaultHeight || 60,
      label: options.label || type.charAt(0).toUpperCase() + type.slice(1),
      style: options.style || shapeDefinition.defaultStyle || {},
      metadata: options.metadata || {},
    };

    // Create MVC components
    const model = new NodeModel(nodeData);
    const view = new NodeView(model, shapeDefinition);
    const controller = new NodeController(model, view, this.eventBus);

    // Store in map
    this.nodes.set(nodeId, { model, view, controller });

    // Add to editor canvas
    this.editor.addNodeElement(nodeId, view.element);

    // Update state manager
    this.stateManager.addNode(nodeId, model.toJSON());

    this.log.info("createNode", `✓ Node created: ${nodeId}`);
    this.log.exit("createNode");

    // Emit event
    this.eventBus.emit("node:created", {
      nodeId: nodeId,
      nodeData: model.toJSON(),
    });

    return nodeId;
  }

  /**
   * Get node by ID
   */
  getNode(nodeId) {
    const node = this.nodes.get(nodeId);
    return node ? node.model : null;
  }

  /**
   * Update node
   */
  updateNode(nodeId, updates) {
    this.log.enter("updateNode", { nodeId, updates });

    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const { model, view } = node;

    if (updates.x !== undefined || updates.y !== undefined) {
      model.setPosition(
        updates.x !== undefined ? updates.x : model.x,
        updates.y !== undefined ? updates.y : model.y
      );
    }

    if (updates.width !== undefined || updates.height !== undefined) {
      model.setSize(
        updates.width !== undefined ? updates.width : model.width,
        updates.height !== undefined ? updates.height : model.height
      );
    }

    if (updates.label !== undefined) model.setLabel(updates.label);
    if (updates.style !== undefined) model.setStyle(updates.style);

    view.update();
    this.stateManager.updateNode(nodeId, model.toJSON());

    this.log.exit("updateNode");
    this.eventBus.emit("node:updated", { nodeId, nodeData: model.toJSON() });

    return true;
  }

  /**
   * Remove node
   */
  removeNode(nodeId) {
    this.log.enter("removeNode", { nodeId });

    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const { view, controller } = node;

    this.editor.removeNodeElement(nodeId);
    controller.destroy();
    view.destroy();
    this.nodes.delete(nodeId);
    this.stateManager.removeNode(nodeId);

    this.log.exit("removeNode");
    this.eventBus.emit("node:deleted", { nodeId });

    return true;
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    const allNodes = [];
    this.nodes.forEach(({ model }) => allNodes.push(model.toJSON()));
    return allNodes;
  }
}
