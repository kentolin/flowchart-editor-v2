/**
 * EdgeController.js - Edge Interaction & Command Coordination
 *
 * Coordinates interaction between EdgeManager, EdgeView, and user input.
 * Handles user interactions with edges (clicking, creating, deleting).
 *
 * @module core/controllers/EdgeController
 * @version 1.0.0
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

/**
 * EdgeController Class
 *
 * Coordinates edge interactions and operations.
 */
class EdgeController {
  /**
   * Initialize the edge controller
   *
   * @param {EdgeManager} edgeManager - Edge manager
   * @param {EdgeView} edgeView - Edge view renderer
   * @param {NodeManager} nodeManager - Node manager for validation
   * @param {Editor} editor - Main editor instance
   * @param {StateManager} stateManager - State manager
   * @param {EventBus} eventBus - Event emitter
   */
  constructor(
    edgeManager,
    edgeView,
    nodeManager,
    editor,
    stateManager,
    eventBus
  ) {
    // Initialize debug logger
    this.log = new DebugLogger("EdgeController", "#E91E63");
    this.log.enter("constructor");

    // Validate dependencies with correct method names
    if (!edgeManager || typeof edgeManager.createEdge !== "function") {
      this.log.error("constructor", "Invalid EdgeManager instance");
      throw new Error(
        "EdgeController: Constructor requires valid EdgeManager instance"
      );
    }

    if (!edgeView || typeof edgeView.render !== "function") {
      this.log.error("constructor", "Invalid EdgeView instance");
      throw new Error(
        "EdgeController: Constructor requires valid EdgeView instance"
      );
    }

    if (!nodeManager || typeof nodeManager.getNode !== "function") {
      this.log.error("constructor", "Invalid NodeManager instance");
      throw new Error(
        "EdgeController: Constructor requires valid NodeManager instance"
      );
    }

    if (!editor || typeof editor.getSVG !== "function") {
      this.log.error("constructor", "Invalid Editor instance");
      throw new Error(
        "EdgeController: Constructor requires valid Editor instance"
      );
    }

    if (!stateManager || typeof stateManager.getEditorState !== "function") {
      this.log.error("constructor", "Invalid StateManager instance");
      throw new Error(
        "EdgeController: Constructor requires valid StateManager instance"
      );
    }

    if (!eventBus || typeof eventBus.emit !== "function") {
      this.log.error("constructor", "Invalid EventBus instance");
      throw new Error("EdgeController: Constructor requires valid EventBus");
    }

    this.log.info("constructor", "All dependencies validated");

    // Store dependencies
    this.edgeManager = edgeManager;
    this.edgeView = edgeView;
    this.nodeManager = nodeManager;
    this.editor = editor;
    this.stateManager = stateManager;
    this.eventBus = eventBus;

    // Edge drawing state
    this.drawingState = {
      isDrawing: false,
      sourceNodeId: null,
      sourceNode: null,
      targetX: 0,
      targetY: 0,
      previewElement: null,
    };

    // Selection state
    this.selectedEdgeIds = new Set();

    // Command history for undo/redo
    this.commandHistory = [];
    this.commandIndex = -1;

    // Configuration
    this.config = {
      drawingColor: "#666666",
      drawingStrokeWidth: 2,
      drawingDasharray: "5,5",
      routingType: "straight",
      allowSelfLoops: false,
      deleteKey: "Delete",
      escapeAction: "deselect", // deselect or cancel-drawing
    };

    this.log.info("constructor", "Configuration initialized");

    // Set up event listeners
    this._setupEventListeners();

    this.log.info("constructor", "✓ EdgeController initialized");
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
    this.eventBus.on("edge:created", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: edge:created (${e.edgeId})`
      );
      this._onEdgeCreated(e);
    });

    this.eventBus.on("edge:deleted", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: edge:deleted (${e.edgeId})`
      );
      this._onEdgeDeleted(e);
    });

    this.eventBus.on("edge:selected", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: edge:selected (${e.edgeId})`
      );
      this._onEdgeSelected(e);
    });

    this.eventBus.on("edge:deselected", (e) => {
      this.log.info(
        "_setupEventListeners",
        `Event received: edge:deselected (${e.edgeId})`
      );
      this._onEdgeDeselected(e);
    });

    this.log.info("_setupEventListeners", "✓ Event listeners registered");
    this.log.exit("_setupEventListeners");
  }

  /**
   * Start edge drawing from a node
   *
   * @param {string} sourceNodeId - Source node ID
   * @param {Object} sourceNode - Source node data
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   */
  startDrawing(sourceNodeId, sourceNode, startX, startY) {
    this.log.enter("startDrawing", { sourceNodeId, startX, startY });

    this.drawingState.isDrawing = true;
    this.drawingState.sourceNodeId = sourceNodeId;
    this.drawingState.sourceNode = sourceNode;
    this.drawingState.targetX = startX;
    this.drawingState.targetY = startY;

    this.log.info(
      "startDrawing",
      `✓ Drawing started from node '${sourceNodeId}'`
    );
    this.eventBus.emit("controller:edge-drawing-started", {
      sourceNodeId,
    });

    this.log.exit("startDrawing");
  }

  /**
   * Finish edge drawing
   *
   * @param {string} targetNodeId - Target node ID
   */
  finishDrawing(targetNodeId) {
    this.log.enter("finishDrawing", { targetNodeId });

    const sourceNodeId = this.drawingState.sourceNodeId;
    const sourceNode = this.drawingState.sourceNode;
    const targetNode = this.nodeManager.getNode(targetNodeId);

    if (!targetNode) {
      this.log.warn("finishDrawing", `Target node '${targetNodeId}' not found`);
      this.cancelDrawing();
      this.log.exit("finishDrawing");
      return;
    }

    // Validate connection
    if (!this._isValidConnection(sourceNodeId, targetNodeId)) {
      this.log.warn(
        "finishDrawing",
        `Invalid connection: ${sourceNodeId} -> ${targetNodeId}`
      );
      this.cancelDrawing();
      this.log.exit("finishDrawing");
      return;
    }

    // Create edge
    const edgeId = this.edgeManager.createEdge({
      sourceId: sourceNodeId,
      targetId: targetNodeId,
      type: this.config.routingType,
    });

    // Record command for undo
    this._recordCommand({
      type: "create-edge",
      edgeId,
      sourceId: sourceNodeId,
      targetId: targetNodeId,
    });

    // Clean up drawing state
    this.drawingState.isDrawing = false;
    this.drawingState.sourceNodeId = null;
    this.drawingState.sourceNode = null;

    this.log.info(
      "finishDrawing",
      `✓ Edge '${edgeId}' created: ${sourceNodeId} -> ${targetNodeId}`
    );
    this.eventBus.emit("controller:edge-created", {
      edgeId,
      sourceId: sourceNodeId,
      targetId: targetNodeId,
    });

    this.log.exit("finishDrawing");
  }

  /**
   * Cancel edge drawing
   */
  cancelDrawing() {
    this.log.enter("cancelDrawing");

    const wasDrawing = this.drawingState.isDrawing;

    this.drawingState.isDrawing = false;
    this.drawingState.sourceNodeId = null;
    this.drawingState.sourceNode = null;

    if (wasDrawing) {
      this.log.info("cancelDrawing", "✓ Drawing cancelled");
      this.eventBus.emit("controller:edge-drawing-cancelled");
    } else {
      this.log.info("cancelDrawing", "No active drawing to cancel");
    }

    this.log.exit("cancelDrawing");
  }

  /**
   * Select an edge
   *
   * @param {string} edgeId - Edge to select
   * @param {boolean} [append=false] - Add to selection?
   */
  selectEdge(edgeId, append = false) {
    this.log.enter("selectEdge", { edgeId, append });

    if (!this.edgeManager.hasEdge(edgeId)) {
      this.log.warn("selectEdge", `Edge '${edgeId}' not found`);
      this.log.exit("selectEdge");
      return;
    }

    if (!append) {
      this.clearSelection();
    }

    this.selectedEdgeIds.add(edgeId);

    this.log.info(
      "selectEdge",
      `✓ Selected edge '${edgeId}' (total: ${this.selectedEdgeIds.size})`
    );
    this.eventBus.emit("controller:edge-selected", {
      edgeId,
      append,
    });

    this.log.exit("selectEdge");
  }

  /**
   * Deselect an edge
   *
   * @param {string} edgeId - Edge to deselect
   */
  deselectEdge(edgeId) {
    this.log.enter("deselectEdge", { edgeId });

    this.selectedEdgeIds.delete(edgeId);

    this.log.info(
      "deselectEdge",
      `✓ Deselected edge '${edgeId}' (remaining: ${this.selectedEdgeIds.size})`
    );
    this.eventBus.emit("controller:edge-deselected", { edgeId });

    this.log.exit("deselectEdge");
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.log.enter("clearSelection");

    const count = this.selectedEdgeIds.size;

    for (const edgeId of this.selectedEdgeIds) {
      // Don't emit individual deselect events
    }

    this.selectedEdgeIds.clear();

    this.log.info("clearSelection", `✓ Cleared selection (${count} edges)`);
    this.eventBus.emit("controller:selection-cleared");

    this.log.exit("clearSelection");
  }

  /**
   * Delete selected edges
   */
  deleteSelected() {
    this.log.enter("deleteSelected");

    const selected = Array.from(this.selectedEdgeIds);

    if (selected.length === 0) {
      this.log.info("deleteSelected", "No edges selected");
      this.log.exit("deleteSelected");
      return;
    }

    const deletedEdges = [];

    for (const edgeId of selected) {
      const edgeData = this.edgeManager.getEdge(edgeId);
      if (edgeData) {
        deletedEdges.push(edgeData.toJSON());
        this.edgeManager.deleteEdge(edgeId);
      }
    }

    // Record command for undo
    this._recordCommand({
      type: "delete-edges",
      edges: deletedEdges,
    });

    this.selectedEdgeIds.clear();

    this.log.info("deleteSelected", `✓ Deleted ${deletedEdges.length} edges`);
    this.eventBus.emit("controller:edges-deleted", {
      count: deletedEdges.length,
    });

    this.log.exit("deleteSelected");
  }

  /**
   * Edit edge properties
   *
   * @param {string} edgeId - Edge to edit
   * @param {Object} updates - Properties to update
   */
  editEdge(edgeId, updates) {
    this.log.enter("editEdge", { edgeId, updates });

    if (!this.edgeManager.hasEdge(edgeId)) {
      this.log.error("editEdge", `Edge '${edgeId}' not found`);
      throw new Error(`EdgeController: Edge '${edgeId}' not found`);
    }

    const oldEdge = this.edgeManager.getEdge(edgeId).toJSON();

    // Update edge
    this.edgeManager.updateEdge(edgeId, updates);

    // Record command for undo
    this._recordCommand({
      type: "edit-edge",
      edgeId,
      from: oldEdge,
      to: { ...oldEdge, ...updates },
    });

    this.log.info("editEdge", `✓ Edited edge '${edgeId}'`);
    this.eventBus.emit("controller:edge-edited", {
      edgeId,
      updates,
    });

    this.log.exit("editEdge");
  }

  /**
   * Check if connection is valid
   *
   * @private
   */
  _isValidConnection(sourceNodeId, targetNodeId) {
    this.log.enter("_isValidConnection", { sourceNodeId, targetNodeId });

    // Can't connect to non-existent nodes
    if (
      !this.nodeManager.hasNode(sourceNodeId) ||
      !this.nodeManager.hasNode(targetNodeId)
    ) {
      this.log.warn("_isValidConnection", "Source or target node not found");
      this.log.exit("_isValidConnection");
      return false;
    }

    // Check self-loops
    if (!this.config.allowSelfLoops && sourceNodeId === targetNodeId) {
      this.log.warn("_isValidConnection", "Self-loops not allowed");
      this.log.exit("_isValidConnection");
      return false;
    }

    this.log.info("_isValidConnection", "✓ Connection is valid");
    this.log.exit("_isValidConnection");
    return true;
  }

  /**
   * Handle edge created event
   *
   * @private
   */
  _onEdgeCreated(e) {
    this.log.enter("_onEdgeCreated", { edgeId: e.edgeId });

    // Auto-render the new edge (if needed)
    // For now, just log
    this.log.info(
      "_onEdgeCreated",
      `✓ Edge '${e.edgeId}' created event handled`
    );

    this.eventBus.emit("controller:edge-rendered", { edgeId: e.edgeId });

    this.log.exit("_onEdgeCreated");
  }

  /**
   * Handle edge deleted event
   *
   * @private
   */
  _onEdgeDeleted(e) {
    this.log.enter("_onEdgeDeleted", { edgeId: e.edgeId });

    this.selectedEdgeIds.delete(e.edgeId);

    this.log.info(
      "_onEdgeDeleted",
      `✓ Edge '${e.edgeId}' deleted event handled`
    );

    this.log.exit("_onEdgeDeleted");
  }

  /**
   * Handle edge selected event
   *
   * @private
   */
  _onEdgeSelected(e) {
    this.log.enter("_onEdgeSelected", { edgeId: e.edgeId });

    // Update edge visual state (if needed)
    this.log.info(
      "_onEdgeSelected",
      `✓ Edge '${e.edgeId}' selected event handled`
    );

    this.log.exit("_onEdgeSelected");
  }

  /**
   * Handle edge deselected event
   *
   * @private
   */
  _onEdgeDeselected(e) {
    this.log.enter("_onEdgeDeselected", { edgeId: e.edgeId });

    // Update edge visual state (if needed)
    this.log.info(
      "_onEdgeDeselected",
      `✓ Edge '${e.edgeId}' deselected event handled`
    );

    this.log.exit("_onEdgeDeselected");
  }

  /**
   * Record command for undo/redo
   *
   * @private
   */
  _recordCommand(command) {
    this.log.enter("_recordCommand", { type: command.type });

    // Truncate any commands after current index
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
      case "create-edge":
        this.edgeManager.deleteEdge(command.edgeId);
        break;

      case "delete-edges":
        for (const edgeData of command.edges) {
          this.edgeManager.createEdge(edgeData);
        }
        break;

      case "edit-edge":
        this.edgeManager.updateEdge(command.edgeId, command.from);
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
      case "create-edge":
        this.edgeManager.createEdge({
          id: command.edgeId,
          sourceId: command.sourceId,
          targetId: command.targetId,
        });
        break;

      case "delete-edges":
        for (const edgeData of command.edges) {
          this.edgeManager.deleteEdge(edgeData.id);
        }
        break;

      case "edit-edge":
        this.edgeManager.updateEdge(command.edgeId, command.to);
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
      isDrawing: this.drawingState.isDrawing,
      sourceNodeId: this.drawingState.sourceNodeId,
      selectedEdgesCount: this.selectedEdgeIds.size,
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
    console.log("========== EdgeController Debug Info ==========");
    console.log(
      `Drawing: ${info.isDrawing} (from ${info.sourceNodeId || "none"})`
    );
    console.log(`Selected Edges: ${info.selectedEdgesCount}`);
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
export { EdgeController };
