/**
 * NodeController.js - Node Interaction & Command Coordination
 *
 * Coordinates interaction between NodeManager, NodeView, and user input.
 * Handles user interactions with nodes (clicking, dragging, resizing).
 *
 * @module core/controllers/NodeController
 * @version 1.0.0
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

/**
 * NodeController Class
 *
 * Coordinates node interactions and operations.
 */
class NodeController {
  /**
   * Initialize the node controller
   *
   * @param {NodeManager} nodeManager - Node manager
   * @param {NodeView} nodeView - Node view renderer
   * @param {Editor} editor - Main editor instance
   * @param {StateManager} stateManager - State manager
   * @param {EventBus} eventBus - Event emitter
   */
  constructor(nodeManager, nodeView, editor, stateManager, eventBus) {
    // Initialize debug logger
    this.log = new DebugLogger("NodeController", "#00BCD4");
    this.log.enter("constructor");

    // Validate dependencies with correct method names
    if (!nodeManager || typeof nodeManager.createNode !== "function") {
      this.log.error("constructor", "Invalid NodeManager instance");
      throw new Error(
        "NodeController: Constructor requires valid NodeManager instance"
      );
    }

    if (!nodeView || typeof nodeView.render !== "function") {
      this.log.error("constructor", "Invalid NodeView instance");
      throw new Error(
        "NodeController: Constructor requires valid NodeView instance"
      );
    }

    if (!editor || typeof editor.getSVG !== "function") {
      this.log.error("constructor", "Invalid Editor instance");
      throw new Error(
        "NodeController: Constructor requires valid Editor instance"
      );
    }

    if (!stateManager || typeof stateManager.getEditorState !== "function") {
      this.log.error("constructor", "Invalid StateManager instance");
      throw new Error(
        "NodeController: Constructor requires valid StateManager instance"
      );
    }

    if (!eventBus || typeof eventBus.emit !== "function") {
      this.log.error("constructor", "Invalid EventBus instance");
      throw new Error("NodeController: Constructor requires valid EventBus");
    }

    this.log.info("constructor", "All dependencies validated");

    // Store dependencies
    this.nodeManager = nodeManager;
    this.nodeView = nodeView;
    this.editor = editor;
    this.stateManager = stateManager;
    this.eventBus = eventBus;

    // Interaction state
    this.dragState = {
      isDragging: false,
      nodeId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      originalX: 0,
      originalY: 0,
    };

    this.resizeState = {
      isResizing: false,
      nodeId: null,
      handlePosition: null,
      originalWidth: 0,
      originalHeight: 0,
      originalX: 0,
      originalY: 0,
    };

    // Node creation state
    this.creationMode = null; // null, or shape type being created
    this.creationStart = null;

    // Configuration
    this.config = {
      dragThreshold: 5, // pixels before drag starts
      snapToGrid: false,
      gridSize: 20,
      minNodeWidth: 30,
      minNodeHeight: 30,
      multiSelectModifier: "ctrl", // ctrl or shift
      deleteKey: "Delete",
      duplicateKey: "Ctrl+D",
      escapeAction: "deselect", // deselect or cancel
    };

    this.log.info("constructor", "Configuration initialized");

    // Command history for undo/redo
    this.commandHistory = [];
    this.commandIndex = -1;

    // Set up event listeners
    this._setupEventListeners();

    this.log.info("constructor", "✓ NodeController initialized");
    this.log.exit("constructor");
  }

  /**
   * Set up event listeners
   *
   * @private
   */
  _setupEventListeners() {
    this.log.enter("_setupEventListeners");

    // Manager events
    this.eventBus.on("node:created", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: node:created (${e.nodeId})`
      );
      this._onNodeCreated(e);
    });

    this.eventBus.on("node:deleted", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: node:deleted (${e.nodeId})`
      );
      this._onNodeDeleted(e);
    });

    this.eventBus.on("node:selected", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: node:selected (${e.nodeId})`
      );
      this._onNodeSelected(e);
    });

    this.eventBus.on("node:deselected", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: node:deselected (${e.nodeId})`
      );
      this._onNodeDeselected(e);
    });

    this.log.info("_setupEventListeners", "✓ Event listeners registered");
    this.log.exit("_setupEventListeners");
  }

  /**
   * Select a node
   *
   * @param {string} nodeId - Node to select
   * @param {boolean} [append=false] - Add to selection?
   */
  selectNode(nodeId, append = false) {
    this.log.enter("selectNode", { nodeId, append });

    if (!this.nodeManager.hasNode(nodeId)) {
      this.log.warn("selectNode", `Node '${nodeId}' not found`);
      this.log.exit("selectNode");
      return;
    }

    // TODO: Implement selection via state manager
    this.log.info(
      "selectNode",
      `Selected node '${nodeId}' (append: ${append})`
    );

    this.eventBus.emit("controller:node-selected", {
      nodeId,
      append,
    });

    this.log.exit("selectNode");
  }

  /**
   * Deselect a node
   *
   * @param {string} nodeId - Node to deselect
   */
  deselectNode(nodeId) {
    this.log.enter("deselectNode", { nodeId });

    // TODO: Implement deselection via state manager
    this.log.info("deselectNode", `Deselected node '${nodeId}'`);

    this.eventBus.emit("controller:node-deselected", { nodeId });

    this.log.exit("deselectNode");
  }

  /**
   * Select all nodes
   */
  selectAll() {
    this.log.enter("selectAll");

    // TODO: Implement via state manager
    this.log.info("selectAll", "Selected all nodes");

    this.eventBus.emit("controller:select-all");

    this.log.exit("selectAll");
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.log.enter("clearSelection");

    // TODO: Implement via state manager
    this.log.info("clearSelection", "Cleared selection");

    this.eventBus.emit("controller:selection-cleared");

    this.log.exit("clearSelection");
  }

  /**
   * Delete selected nodes
   */
  deleteSelected() {
    this.log.enter("deleteSelected");

    // TODO: Get selected nodes from state manager
    const selected = []; // this.stateManager.getSelectedNodes();

    if (selected.length === 0) {
      this.log.info("deleteSelected", "No nodes selected");
      this.log.exit("deleteSelected");
      return;
    }

    const deletedNodes = [];

    for (const nodeId of selected) {
      const nodeData = this.nodeManager.getNode(nodeId);
      if (nodeData) {
        deletedNodes.push(nodeData.toJSON());
        this.nodeManager.deleteNode(nodeId);
      }
    }

    // Record command for undo
    this._recordCommand({
      type: "delete-nodes",
      nodes: deletedNodes,
    });

    this.log.info("deleteSelected", `✓ Deleted ${deletedNodes.length} nodes`);
    this.eventBus.emit("controller:nodes-deleted", {
      count: deletedNodes.length,
    });

    this.log.exit("deleteSelected");
  }

  /**
   * Duplicate selected nodes
   */
  duplicateSelected() {
    this.log.enter("duplicateSelected");

    // TODO: Get selected nodes from state manager
    const selected = []; // this.stateManager.getSelectedNodes();

    if (selected.length === 0) {
      this.log.info("duplicateSelected", "No nodes selected");
      this.log.exit("duplicateSelected");
      return;
    }

    const createdNodes = [];
    const offset = 30;

    for (const nodeId of selected) {
      const original = this.nodeManager.getNode(nodeId);

      if (!original) {
        continue;
      }

      // Clone node with offset position
      const newNodeId = this.nodeManager.cloneNode(nodeId, {
        x: offset,
        y: offset,
      });
      createdNodes.push(newNodeId);
    }

    // Record command for undo
    this._recordCommand({
      type: "duplicate-nodes",
      createdNodes,
      originalCount: selected.length,
    });

    this.log.info(
      "duplicateSelected",
      `✓ Duplicated ${createdNodes.length} nodes`
    );
    this.eventBus.emit("controller:nodes-duplicated", {
      count: createdNodes.length,
    });

    this.log.exit("duplicateSelected");
  }

  /**
   * Start node creation mode
   *
   * @param {string} shapeType - Shape type to create
   */
  startCreation(shapeType) {
    this.log.enter("startCreation", { shapeType });

    if (!shapeType || typeof shapeType !== "string") {
      this.log.error("startCreation", `Invalid shapeType: ${typeof shapeType}`);
      throw new Error(
        `NodeController.startCreation: shapeType must be string, got ${typeof shapeType}`
      );
    }

    this.creationMode = shapeType;

    this.log.info(
      "startCreation",
      `✓ Creation mode started for '${shapeType}'`
    );
    this.eventBus.emit("controller:creation-started", { shapeType });

    this.log.exit("startCreation");
  }

  /**
   * Cancel node creation mode
   */
  cancelCreation() {
    this.log.enter("cancelCreation");

    const previousMode = this.creationMode;
    this.creationMode = null;
    this.creationStart = null;

    this.log.info(
      "cancelCreation",
      `✓ Cancelled creation mode (was: ${previousMode})`
    );
    this.eventBus.emit("controller:creation-cancelled");

    this.log.exit("cancelCreation");
  }

  /**
   * Edit node properties
   *
   * @param {string} nodeId - Node to edit
   * @param {Object} updates - Properties to update
   */
  editNode(nodeId, updates) {
    this.log.enter("editNode", { nodeId, updates });

    if (!this.nodeManager.hasNode(nodeId)) {
      this.log.error("editNode", `Node '${nodeId}' not found`);
      throw new Error(`NodeController: Node '${nodeId}' not found`);
    }

    const oldNode = this.nodeManager.getNode(nodeId).toJSON();

    // Update node
    this.nodeManager.updateNode(nodeId, updates);

    // Record command for undo
    this._recordCommand({
      type: "edit-node",
      nodeId,
      from: oldNode,
      to: { ...oldNode, ...updates },
    });

    this.log.info("editNode", `✓ Edited node '${nodeId}'`);
    this.eventBus.emit("controller:node-edited", {
      nodeId,
      updates,
    });

    this.log.exit("editNode");
  }

  /**
   * Handle node created event
   *
   * @private
   */
  _onNodeCreated(e) {
    this.log.enter("_onNodeCreated", { nodeId: e.nodeId });

    // Auto-render the new node (if needed)
    // For now, just log
    this.log.info(
      "_onNodeCreated",
      `✓ Node '${e.nodeId}' created event handled`
    );

    this.eventBus.emit("controller:node-rendered", { nodeId: e.nodeId });

    this.log.exit("_onNodeCreated");
  }

  /**
   * Handle node deleted event
   *
   * @private
   */
  _onNodeDeleted(e) {
    this.log.enter("_onNodeDeleted", { nodeId: e.nodeId });

    // View cleanup handled by NodeManager
    this.log.info(
      "_onNodeDeleted",
      `✓ Node '${e.nodeId}' deleted event handled`
    );

    this.log.exit("_onNodeDeleted");
  }

  /**
   * Handle node selected event
   *
   * @private
   */
  _onNodeSelected(e) {
    this.log.enter("_onNodeSelected", { nodeId: e.nodeId });

    // Update node visual state (if needed)
    this.log.info(
      "_onNodeSelected",
      `✓ Node '${e.nodeId}' selected event handled`
    );

    this.log.exit("_onNodeSelected");
  }

  /**
   * Handle node deselected event
   *
   * @private
   */
  _onNodeDeselected(e) {
    this.log.enter("_onNodeDeselected", { nodeId: e.nodeId });

    // Update node visual state (if needed)
    this.log.info(
      "_onNodeDeselected",
      `✓ Node '${e.nodeId}' deselected event handled`
    );

    this.log.exit("_onNodeDeselected");
  }

  /**
   * Record command for undo/redo
   *
   * @private
   */
  _recordCommand(command) {
    this.log.enter("_recordCommand", { type: command.type });

    // Truncate any commands after current index (redo history)
    this.commandHistory = this.commandHistory.slice(0, this.commandIndex + 1);

    // Add new command
    this.commandHistory.push(command);
    this.commandIndex++;

    // Limit history size
    const maxHistory = 50;
    if (this.commandHistory.length > maxHistory) {
      this.commandHistory.shift();
      this.commandIndex--;
    }

    this.log.info(
      "_recordCommand",
      `✓ Recorded '${command.type}' command (history: ${this.commandHistory.length})`
    );
    this.eventBus.emit("controller:command-recorded", { command });

    this.log.exit("_recordCommand");
  }

  /**
   * Undo last command
   */
  undo() {
    this.log.enter("undo");

    if (this.commandIndex < 0) {
      this.log.warn("undo", "No commands to undo");
      this.log.exit("undo");
      return;
    }

    const command = this.commandHistory[this.commandIndex];
    this.log.info("undo", `Undoing command: ${command.type}`);

    this._executeUndo(command);
    this.commandIndex--;

    this.log.info("undo", `✓ Undone (index now: ${this.commandIndex})`);
    this.eventBus.emit("controller:undo", { command });

    this.log.exit("undo");
  }

  /**
   * Redo last undone command
   */
  redo() {
    this.log.enter("redo");

    if (this.commandIndex >= this.commandHistory.length - 1) {
      this.log.warn("redo", "No commands to redo");
      this.log.exit("redo");
      return;
    }

    this.commandIndex++;
    const command = this.commandHistory[this.commandIndex];
    this.log.info("redo", `Redoing command: ${command.type}`);

    this._executeRedo(command);

    this.log.info("redo", `✓ Redone (index now: ${this.commandIndex})`);
    this.eventBus.emit("controller:redo", { command });

    this.log.exit("redo");
  }

  /**
   * Execute undo
   *
   * @private
   */
  _executeUndo(command) {
    this.log.enter("_executeUndo", { type: command.type });

    switch (command.type) {
      case "move":
        this.nodeManager.updateNodePosition(command.nodeId, command.from);
        break;

      case "delete-nodes":
        for (const nodeData of command.nodes) {
          this.nodeManager.createNode(nodeData);
        }
        break;

      case "edit-node":
        this.nodeManager.updateNode(command.nodeId, command.from);
        break;

      default:
        this.log.warn("_executeUndo", `Unknown command type: ${command.type}`);
    }

    this.log.info("_executeUndo", "✓ Undo executed");
    this.log.exit("_executeUndo");
  }

  /**
   * Execute redo
   *
   * @private
   */
  _executeRedo(command) {
    this.log.enter("_executeRedo", { type: command.type });

    switch (command.type) {
      case "move":
        this.nodeManager.updateNodePosition(command.nodeId, command.to);
        break;

      case "delete-nodes":
        for (const nodeData of command.nodes) {
          this.nodeManager.deleteNode(nodeData.id);
        }
        break;

      case "edit-node":
        this.nodeManager.updateNode(command.nodeId, command.to);
        break;

      default:
        this.log.warn("_executeRedo", `Unknown command type: ${command.type}`);
    }

    this.log.info("_executeRedo", "✓ Redo executed");
    this.log.exit("_executeRedo");
  }

  /**
   * Check if can undo
   *
   * @returns {boolean} True if undo available
   */
  canUndo() {
    return this.commandIndex >= 0;
  }

  /**
   * Check if can redo
   *
   * @returns {boolean} True if redo available
   */
  canRedo() {
    return this.commandIndex < this.commandHistory.length - 1;
  }

  /**
   * Get debug info
   *
   * @returns {Object} Debug information
   */
  debugInfo() {
    return {
      isDragging: this.dragState.isDragging,
      draggedNodeId: this.dragState.nodeId,
      creationMode: this.creationMode,
      commandHistorySize: this.commandHistory.length,
      commandIndex: this.commandIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  /**
   * Print debug info
   */
  printDebugInfo() {
    this.log.enter("printDebugInfo");

    const info = this.debugInfo();
    console.log("========== NodeController Debug Info ==========");
    console.log(
      `Dragging: ${info.isDragging} (${info.draggedNodeId || "none"})`
    );
    console.log(`Creation Mode: ${info.creationMode || "none"}`);
    console.log(`Command History: ${info.commandHistorySize} commands`);
    console.log(`Current Index: ${info.commandIndex}`);
    console.log(`Can Undo: ${info.canUndo}`);
    console.log(`Can Redo: ${info.canRedo}`);
    console.log("=".repeat(47));

    this.log.info("printDebugInfo", "Debug info printed");
    this.log.exit("printDebugInfo");
  }
}

// Export for use in other modules
export { NodeController };
