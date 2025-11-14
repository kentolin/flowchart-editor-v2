/**
 * EdgeController.js - Edge Interaction & Command Coordination
 *
 * Coordinates interaction between EdgeManager, EdgeView, and user input.
 * Handles user interactions with edges (clicking, creating, deleting) and
 * orchestrates the corresponding operations.
 *
 * DEPENDENCIES: EdgeManager, EdgeView, NodeManager, EditorView, StateManager, EventBus
 *
 * @module core/controllers/EdgeController
 * @version 1.0.0
 *
 * Purpose:
 * - Handle user interactions with edges
 * - Coordinate edge creation (connection drawing)
 * - Manage edge selection, deletion, and modification
 * - Provide visual feedback during edge drawing
 * - Handle connection validation
 * - Support keyboard shortcuts and commands
 * - Undo/redo integration
 *
 * Responsibilities:
 * - Listen for mouse/keyboard events on edges
 * - Handle edge drawing from source to target node
 * - Translate user actions into manager operations
 * - Update views based on model changes
 * - Manage connection validation
 * - Provide visual feedback during drawing
 * - Emit user-triggered events
 * - Support keyboard shortcuts
 * - Validate valid connections
 *
 * Architecture:
 * - Event listeners for edge interactions
 * - State machine for edge drawing
 * - Connection validation logic
 * - Command pattern for undo/redo
 * - Visual preview during drawing
 *
 * @example
 * const controller = new EdgeController(
 *   edgeManager,
 *   edgeView,
 *   nodeManager,
 *   editor,
 *   stateManager,
 *   eventBus
 * );
 *
 * // User clicks on node port and drags to another node to create edge
 * // User clicks on edge to select it
 * // User presses Delete to delete selected edges
 */

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
   * @param {EditorView} editor - Main editor instance
   * @param {StateManager} stateManager - State manager
   * @param {EventBus} eventBus - Event emitter
   *
   * @throws {Error} If any dependency is invalid
   *
   * @example
   * const controller = new EdgeController(
   *   edgeManager,
   *   edgeView,
   *   nodeManager,
   *   editor,
   *   stateManager,
   *   eventBus
   * );
   */
  constructor(
    edgeManager,
    edgeView,
    nodeManager,
    editor,
    stateManager,
    eventBus
  ) {
    // Validate dependencies
    if (!edgeManager || typeof edgeManager.create !== "function") {
      throw new Error(
        "EdgeController: Constructor requires valid EdgeManager instance"
      );
    }

    if (!edgeView || typeof edgeView.render !== "function") {
      throw new Error(
        "EdgeController: Constructor requires valid EdgeView instance"
      );
    }

    if (!nodeManager || typeof nodeManager.get !== "function") {
      throw new Error(
        "EdgeController: Constructor requires valid NodeManager instance"
      );
    }

    if (!editor || typeof editor.getLayer !== "function") {
      throw new Error(
        "EdgeController: Constructor requires valid EditorView instance"
      );
    }

    if (!stateManager || typeof stateManager.getEdge !== "function") {
      throw new Error(
        "EdgeController: Constructor requires valid StateManager instance"
      );
    }

    if (!eventBus || typeof eventBus.emit !== "function") {
      throw new Error("EdgeController: Constructor requires valid EventBus");
    }

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
      routingType: "curved",
      allowSelfLoops: false,
      deleteKey: "Delete",
      escapeAction: "deselect", // deselect or cancel-drawing
    };

    // Set up event listeners
    this._setupEventListeners();
  }

  /**
   * Set up event listeners
   *
   * @private
   */
  _setupEventListeners() {
    // Canvas mouse events
    this.editor.on("canvas:mousedown", (e) => this._onCanvasMouseDown(e));
    this.editor.on("canvas:mousemove", (e) => this._onCanvasMouseMove(e));
    this.editor.on("canvas:mouseup", (e) => this._onCanvasMouseUp(e));
    this.editor.on("canvas:mouseleave", (e) => this._onCanvasMouseLeave(e));

    // Canvas keyboard events
    this.editor.on("canvas:keydown", (e) => this._onCanvasKeyDown(e));

    // Manager events
    this.eventBus.on("edge:created", (e) => this._onEdgeCreated(e));
    this.eventBus.on("edge:deleted", (e) => this._onEdgeDeleted(e));
    this.eventBus.on("edge:selected", (e) => this._onEdgeSelected(e));
    this.eventBus.on("edge:deselected", (e) => this._onEdgeDeselected(e));
  }

  /**
   * Handle canvas mouse down
   *
   * @private
   */
  _onCanvasMouseDown(e) {
    // Check if clicking on a node (to start edge drawing)
    const nodeId = this.nodeManager.getAtPoint(e.x, e.y);

    if (nodeId && e.button === 0) {
      // Left click on node - start edge drawing
      const node = this.nodeManager.get(nodeId);

      if (node) {
        this.startDrawing(nodeId, node, e.x, e.y);
      }

      return;
    }

    // Check if clicking on an edge
    // (Would need getBoundsAtPoint or similar method)
    // For now, skip this - edges are thin and hard to click

    // Click on canvas - clear selection
    this.clearSelection();
  }

  /**
   * Handle canvas mouse move
   *
   * @private
   */
  _onCanvasMouseMove(e) {
    if (!this.drawingState.isDrawing) {
      return;
    }

    // Update preview position
    this.drawingState.targetX = e.x;
    this.drawingState.targetY = e.y;

    // Update preview element if it exists
    if (this.drawingState.previewElement) {
      this._updatePreviewEdge(e.x, e.y);
    }

    // Check if hovering over valid target node
    const targetNodeId = this.nodeManager.getAtPoint(e.x, e.y);

    if (targetNodeId) {
      // Highlight valid target
      this._highlightValidTarget(targetNodeId);
    } else {
      // Clear highlight
      this._clearTargetHighlight();
    }

    this.eventBus.emit("controller:edge-drawing-move", {
      x: e.x,
      y: e.y,
    });
  }

  /**
   * Handle canvas mouse up
   *
   * @private
   */
  _onCanvasMouseUp(e) {
    if (!this.drawingState.isDrawing) {
      return;
    }

    // Check if released on a valid target node
    const targetNodeId = this.nodeManager.getAtPoint(e.x, e.y);

    if (
      targetNodeId &&
      this._isValidConnection(this.drawingState.sourceNodeId, targetNodeId)
    ) {
      // Create edge
      this.finishDrawing(targetNodeId);
    } else {
      // Cancel drawing
      this.cancelDrawing();
    }

    this.eventBus.emit("controller:edge-drawing-end", {
      completed: targetNodeId !== null,
    });
  }

  /**
   * Handle canvas mouse leave
   *
   * @private
   */
  _onCanvasMouseLeave(e) {
    // Cancel edge drawing if mouse leaves canvas
    if (this.drawingState.isDrawing) {
      this.cancelDrawing();
    }
  }

  /**
   * Handle keyboard down
   *
   * @private
   */
  _onCanvasKeyDown(e) {
    // Delete selected edges
    if (e.key === this.config.deleteKey) {
      e.event.preventDefault();
      this.deleteSelected();
      return;
    }

    // Escape - cancel drawing or clear selection
    if (e.key === "Escape") {
      if (this.drawingState.isDrawing) {
        if (this.config.escapeAction === "cancel-drawing") {
          this.cancelDrawing();
        }
      } else {
        this.clearSelection();
      }
      return;
    }
  }

  /**
   * Start edge drawing from a node
   *
   * @param {string} sourceNodeId - Source node ID
   * @param {Object} sourceNode - Source node data
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   *
   * @example
   * const node = nodeManager.get('node-1');
   * controller.startDrawing('node-1', node, 100, 100);
   */
  startDrawing(sourceNodeId, sourceNode, startX, startY) {
    this.drawingState.isDrawing = true;
    this.drawingState.sourceNodeId = sourceNodeId;
    this.drawingState.sourceNode = sourceNode;
    this.drawingState.targetX = startX;
    this.drawingState.targetY = startY;

    // Create preview edge
    this._createPreviewEdge();

    // Set viewport mode to drawing
    this.editor.setViewportMode("draw-edge");

    this.eventBus.emit("controller:edge-drawing-started", {
      sourceNodeId,
    });
  }

  /**
   * Finish edge drawing
   *
   * @param {string} targetNodeId - Target node ID
   *
   * @example
   * controller.finishDrawing('node-2');
   */
  finishDrawing(targetNodeId) {
    const sourceNodeId = this.drawingState.sourceNodeId;
    const sourceNode = this.drawingState.sourceNode;
    const targetNode = this.nodeManager.get(targetNodeId);

    if (!targetNode) {
      this.cancelDrawing();
      return;
    }

    // Validate connection
    if (!this._isValidConnection(sourceNodeId, targetNodeId)) {
      console.warn(`Invalid connection: ${sourceNodeId} -> ${targetNodeId}`);
      this.cancelDrawing();
      return;
    }

    // Create edge
    const edgeId = this.edgeManager.create(
      {
        sourceId: sourceNodeId,
        targetId: targetNodeId,
        type: "connection",
        routingType: this.config.routingType,
      },
      { reason: "user created" }
    );

    // Record command for undo
    this._recordCommand({
      type: "create-edge",
      edgeId,
      sourceId: sourceNodeId,
      targetId: targetNodeId,
    });

    // Clean up drawing state
    this._removePreviewEdge();
    this.drawingState.isDrawing = false;
    this.drawingState.sourceNodeId = null;
    this.drawingState.sourceNode = null;

    this.editor.setViewportMode("select");

    this.eventBus.emit("controller:edge-created", {
      edgeId,
      sourceId: sourceNodeId,
      targetId: targetNodeId,
    });
  }

  /**
   * Cancel edge drawing
   *
   * @example
   * controller.cancelDrawing();
   */
  cancelDrawing() {
    this._removePreviewEdge();
    this._clearTargetHighlight();

    this.drawingState.isDrawing = false;
    this.drawingState.sourceNodeId = null;
    this.drawingState.sourceNode = null;

    this.editor.setViewportMode("select");

    this.eventBus.emit("controller:edge-drawing-cancelled");
  }

  /**
   * Select an edge
   *
   * @param {string} edgeId - Edge to select
   * @param {boolean} [append=false] - Add to selection?
   *
   * @example
   * controller.selectEdge('edge-1');
   */
  selectEdge(edgeId, append = false) {
    if (!this.edgeManager.has(edgeId)) {
      console.warn(`EdgeController: Edge '${edgeId}' not found`);
      return;
    }

    if (!append) {
      this.clearSelection();
    }

    this.edgeManager.select(edgeId, append);
    this.selectedEdgeIds.add(edgeId);

    this.eventBus.emit("controller:edge-selected", {
      edgeId,
      append,
    });
  }

  /**
   * Deselect an edge
   *
   * @param {string} edgeId - Edge to deselect
   *
   * @example
   * controller.deselectEdge('edge-1');
   */
  deselectEdge(edgeId) {
    this.edgeManager.deselect(edgeId);
    this.selectedEdgeIds.delete(edgeId);

    this.eventBus.emit("controller:edge-deselected", { edgeId });
  }

  /**
   * Clear selection
   *
   * @example
   * controller.clearSelection();
   */
  clearSelection() {
    for (const edgeId of this.selectedEdgeIds) {
      this.edgeManager.deselect(edgeId);
    }

    this.selectedEdgeIds.clear();

    this.eventBus.emit("controller:selection-cleared");
  }

  /**
   * Delete selected edges
   *
   * @example
   * controller.deleteSelected();
   */
  deleteSelected() {
    const selected = Array.from(this.selectedEdgeIds);

    if (selected.length === 0) {
      return;
    }

    const deletedEdges = [];

    for (const edgeId of selected) {
      const edgeData = this.edgeManager.get(edgeId);
      deletedEdges.push(edgeData);
      this.edgeManager.delete(edgeId, { reason: "user deleted" });
    }

    // Record command for undo
    this._recordCommand({
      type: "delete-edges",
      edges: deletedEdges,
    });

    this.selectedEdgeIds.clear();

    this.eventBus.emit("controller:edges-deleted", { count: selected.length });
  }

  /**
   * Edit edge properties
   *
   * @param {string} edgeId - Edge to edit
   * @param {Object} updates - Properties to update
   *
   * @example
   * controller.editEdge('edge-1', {
   *   label: 'connects to',
   *   stroke: '#ff0000'
   * });
   */
  editEdge(edgeId, updates) {
    if (!this.edgeManager.has(edgeId)) {
      throw new Error(`EdgeController: Edge '${edgeId}' not found`);
    }

    const oldEdge = this.edgeManager.get(edgeId);

    // Update edge
    this.edgeManager.update(edgeId, updates, { reason: "user edited" });

    // Record command for undo
    this._recordCommand({
      type: "edit-edge",
      edgeId,
      from: oldEdge,
      to: { ...oldEdge, ...updates },
    });

    this.eventBus.emit("controller:edge-edited", {
      edgeId,
      updates,
    });
  }

  /**
   * Create preview edge during drawing
   *
   * @private
   */
  _createPreviewEdge() {
    const layer = this.editor.getLayer("interaction");
    const sourceNode = this.drawingState.sourceNode;

    // Create preview edge data
    const previewData = {
      id: "__preview__",
      sourceNode,
      targetNode: {
        x: this.drawingState.targetX,
        y: this.drawingState.targetY,
        width: 0,
        height: 0,
      },
      label: "",
      stroke: this.config.drawingColor,
      strokeWidth: this.config.drawingStrokeWidth,
      routingType: this.config.routingType,
    };

    // Render preview element
    const previewElement = this.edgeView.render(previewData, {
      showArrow: false,
    });

    previewElement.setAttribute("class", "edge-preview");
    previewElement.setAttribute("pointer-events", "none");
    previewElement.setAttribute("opacity", "0.7");

    layer.appendChild(previewElement);
    this.drawingState.previewElement = previewElement;
  }

  /**
   * Update preview edge
   *
   * @private
   */
  _updatePreviewEdge(targetX, targetY) {
    if (!this.drawingState.previewElement) {
      return;
    }

    const sourceNode = this.drawingState.sourceNode;

    // Update target node in preview data
    const targetNode = {
      x: targetX,
      y: targetY,
      width: 0,
      height: 0,
    };

    // Re-render preview
    const layer = this.editor.getLayer("interaction");
    this.drawingState.previewElement.remove();

    const previewData = {
      id: "__preview__",
      sourceNode,
      targetNode,
      label: "",
      stroke: this.config.drawingColor,
      strokeWidth: this.config.drawingStrokeWidth,
      routingType: this.config.routingType,
    };

    const previewElement = this.edgeView.render(previewData, {
      showArrow: false,
    });

    previewElement.setAttribute("class", "edge-preview");
    previewElement.setAttribute("pointer-events", "none");
    previewElement.setAttribute("opacity", "0.7");

    layer.appendChild(previewElement);
    this.drawingState.previewElement = previewElement;
  }

  /**
   * Remove preview edge
   *
   * @private
   */
  _removePreviewEdge() {
    if (this.drawingState.previewElement) {
      this.drawingState.previewElement.remove();
      this.drawingState.previewElement = null;
    }
  }

  /**
   * Highlight valid target node
   *
   * @private
   */
  _highlightValidTarget(nodeId) {
    // Could add visual highlight to target node
    // For now, just track it
  }

  /**
   * Clear target highlight
   *
   * @private
   */
  _clearTargetHighlight() {
    // Clear any highlight
  }

  /**
   * Check if connection is valid
   *
   * @private
   */
  _isValidConnection(sourceNodeId, targetNodeId) {
    // Can't connect to non-existent nodes
    if (
      !this.nodeManager.has(sourceNodeId) ||
      !this.nodeManager.has(targetNodeId)
    ) {
      return false;
    }

    // Check self-loops
    if (!this.config.allowSelfLoops && sourceNodeId === targetNodeId) {
      return false;
    }

    return true;
  }

  /**
   * Handle edge created event
   *
   * @private
   */
  _onEdgeCreated(e) {
    // Auto-render the new edge
    const edge = this.edgeManager.get(e.edgeId);

    if (edge) {
      const sourceNode = this.nodeManager.get(edge.sourceId);
      const targetNode = this.nodeManager.get(edge.targetId);

      if (sourceNode && targetNode) {
        edge.sourceNode = sourceNode;
        edge.targetNode = targetNode;

        const layer = this.editor.getLayer("content");
        const edgeElement = this.edgeView.render(edge, { showArrow: true });
        layer.appendChild(edgeElement);

        this.eventBus.emit("controller:edge-rendered", { edgeId: e.edgeId });
      }
    }
  }

  /**
   * Handle edge deleted event
   *
   * @private
   */
  _onEdgeDeleted(e) {
    this.selectedEdgeIds.delete(e.edgeId);
  }

  /**
   * Handle edge selected event
   *
   * @private
   */
  _onEdgeSelected(e) {
    // Update edge visual state
    const layer = this.editor.getLayer("content");
    const edgeElement = layer.querySelector(`[data-edge-id="${e.edgeId}"]`);

    if (edgeElement) {
      this.edgeView.setSelected(edgeElement, true);
    }
  }

  /**
   * Handle edge deselected event
   *
   * @private
   */
  _onEdgeDeselected(e) {
    // Update edge visual state
    const layer = this.editor.getLayer("content");
    const edgeElement = layer.querySelector(`[data-edge-id="${e.edgeId}"]`);

    if (edgeElement) {
      this.edgeView.setSelected(edgeElement, false);
    }
  }

  /**
   * Record command for undo/redo
   *
   * @private
   */
  _recordCommand(command) {
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

    this.eventBus.emit("controller:command-recorded", { command });
  }

  /**
   * Undo last command
   *
   * @example
   * controller.undo();
   */
  undo() {
    if (this.commandIndex < 0) {
      return;
    }

    const command = this.commandHistory[this.commandIndex];
    this._executeUndo(command);
    this.commandIndex--;

    this.eventBus.emit("controller:undo", { command });
  }

  /**
   * Redo last undone command
   *
   * @example
   * controller.redo();
   */
  redo() {
    if (this.commandIndex >= this.commandHistory.length - 1) {
      return;
    }

    this.commandIndex++;
    const command = this.commandHistory[this.commandIndex];
    this._executeRedo(command);

    this.eventBus.emit("controller:redo", { command });
  }

  /**
   * Execute undo
   *
   * @private
   */
  _executeUndo(command) {
    switch (command.type) {
      case "create-edge":
        this.edgeManager.delete(command.edgeId, { silent: true });
        break;

      case "delete-edges":
        for (const edgeData of command.edges) {
          this.edgeManager.create(edgeData, { silent: true });
        }
        break;

      case "edit-edge":
        this.edgeManager.update(command.edgeId, command.from, {
          silent: true,
        });
        break;
    }
  }

  /**
   * Execute redo
   *
   * @private
   */
  _executeRedo(command) {
    switch (command.type) {
      case "create-edge":
        this.edgeManager.create(
          {
            sourceId: command.sourceId,
            targetId: command.targetId,
          },
          { silent: true }
        );
        break;

      case "delete-edges":
        for (const edgeData of command.edges) {
          this.edgeManager.delete(edgeData.id, { silent: true });
        }
        break;

      case "edit-edge":
        this.edgeManager.update(command.edgeId, command.to, { silent: true });
        break;
    }
  }

  /**
   * Check if can undo
   *
   * @returns {boolean} True if undo available
   *
   * @example
   * if (controller.canUndo()) {
   *   controller.undo();
   * }
   */
  canUndo() {
    return this.commandIndex >= 0;
  }

  /**
   * Check if can redo
   *
   * @returns {boolean} True if redo available
   *
   * @example
   * if (controller.canRedo()) {
   *   controller.redo();
   * }
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
    const info = this.debugInfo();
    console.log("========== EdgeController Debug Info ==========");
    console.log(`Drawing: ${info.isDrawing} (from ${info.sourceNodeId})`);
    console.log(`Selected Edges: ${info.selectedEdgesCount}`);
    console.log(`Command History: ${info.commandHistorySize} commands`);
    console.log(`Current Index: ${info.commandIndex}`);
    console.log(`Can Undo: ${info.canUndo}`);
    console.log(`Can Redo: ${info.canRedo}`);
    console.log("=".repeat(44));
  }
}

// Export for use in other modules
export { EdgeController };
