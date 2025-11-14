/**
 * NodeController.js - Node Interaction & Command Coordination
 *
 * Coordinates interaction between NodeManager, NodeView, and user input.
 * Handles user interactions with nodes (clicking, dragging, resizing) and
 * orchestrates the corresponding operations.
 *
 * DEPENDENCIES: NodeManager, NodeView, EditorView, StateManager, EventBus
 *
 * @module core/controllers/NodeController
 * @version 1.0.0
 *
 * Purpose:
 * - Handle user interactions with nodes
 * - Coordinate between model (NodeManager) and view (NodeView)
 * - Manage node creation workflows
 * - Handle node selection, deletion, and modification
 * - Manage drag operations and visual feedback
 * - Provide keyboard shortcuts and commands
 * - Undo/redo integration
 *
 * Responsibilities:
 * - Listen for mouse/keyboard events on nodes
 * - Translate user actions into manager operations
 * - Update views based on model changes
 * - Handle selection state
 * - Manage drag operations with constraints
 * - Provide visual feedback during interactions
 * - Emit user-triggered events
 * - Support keyboard shortcuts
 *
 * Architecture:
 * - Event listeners on canvas for node interactions
 * - State machine for drag operations
 * - Action queuing for complex operations
 * - Command pattern for undo/redo
 *
 * @example
 * const controller = new NodeController(
 *   nodeManager,
 *   nodeView,
 *   editor,
 *   stateManager,
 *   eventBus
 * );
 *
 * // User clicks on a node - automatically handled
 * // User drags node - automatically updates position
 * // User presses Delete - automatically deletes selected nodes
 */

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
   * @param {EditorView} editor - Main editor instance
   * @param {StateManager} stateManager - State manager
   * @param {EventBus} eventBus - Event emitter
   *
   * @throws {Error} If any dependency is invalid
   *
   * @example
   * const controller = new NodeController(
   *   nodeManager,
   *   nodeView,
   *   editor,
   *   stateManager,
   *   eventBus
   * );
   */
  constructor(nodeManager, nodeView, editor, stateManager, eventBus) {
    // Validate dependencies
    if (!nodeManager || typeof nodeManager.create !== "function") {
      throw new Error(
        "NodeController: Constructor requires valid NodeManager instance"
      );
    }

    if (!nodeView || typeof nodeView.render !== "function") {
      throw new Error(
        "NodeController: Constructor requires valid NodeView instance"
      );
    }

    if (!editor || typeof editor.getLayer !== "function") {
      throw new Error(
        "NodeController: Constructor requires valid EditorView instance"
      );
    }

    if (!stateManager || typeof stateManager.getNode !== "function") {
      throw new Error(
        "NodeController: Constructor requires valid StateManager instance"
      );
    }

    if (!eventBus || typeof eventBus.emit !== "function") {
      throw new Error("NodeController: Constructor requires valid EventBus");
    }

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

    // Command history for undo/redo
    this.commandHistory = [];
    this.commandIndex = -1;

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
    this.editor.on("canvas:keyup", (e) => this._onCanvasKeyUp(e));

    // Manager events
    this.eventBus.on("node:created", (e) => this._onNodeCreated(e));
    this.eventBus.on("node:deleted", (e) => this._onNodeDeleted(e));
    this.eventBus.on("node:selected", (e) => this._onNodeSelected(e));
    this.eventBus.on("node:deselected", (e) => this._onNodeDeselected(e));
  }

  /**
   * Handle canvas mouse down
   *
   * @private
   */
  _onCanvasMouseDown(e) {
    // Check if clicking on a node
    const nodeId = this.nodeManager.getAtPoint(e.x, e.y);

    if (nodeId) {
      // Click on node
      if (this.config.multiSelectModifier === "ctrl") {
        const append = e.ctrlKey || e.metaKey;
        this.selectNode(nodeId, append);
      } else if (this.config.multiSelectModifier === "shift") {
        const append = e.shiftKey;
        this.selectNode(nodeId, append);
      } else {
        this.selectNode(nodeId, false);
      }

      // Start drag operation
      this.dragState.isDragging = true;
      this.dragState.nodeId = nodeId;
      this.dragState.startX = e.x;
      this.dragState.startY = e.y;
      this.dragState.currentX = e.x;
      this.dragState.currentY = e.y;

      const node = this.nodeManager.get(nodeId);
      if (node) {
        this.dragState.originalX = node.x;
        this.dragState.originalY = node.y;
      }

      this.eventBus.emit("controller:drag-start", { nodeId });
    } else {
      // Click on canvas
      this.clearSelection();

      // Could start selection box here
      this.eventBus.emit("controller:canvas-click", { x: e.x, y: e.y });
    }
  }

  /**
   * Handle canvas mouse move
   *
   * @private
   */
  _onCanvasMouseMove(e) {
    if (!this.dragState.isDragging) {
      return;
    }

    const nodeId = this.dragState.nodeId;
    const deltaX = e.x - this.dragState.startX;
    const deltaY = e.y - this.dragState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only start drag after threshold
    if (distance < this.config.dragThreshold) {
      return;
    }

    // Calculate new position
    let newX = this.dragState.originalX + deltaX;
    let newY = this.dragState.originalY + deltaY;

    // Apply snap to grid
    if (this.config.snapToGrid) {
      newX = Math.round(newX / this.config.gridSize) * this.config.gridSize;
      newY = Math.round(newY / this.config.gridSize) * this.config.gridSize;
    }

    // Move node
    this.nodeManager.move(nodeId, newX, newY, { reason: "user dragging" });

    this.dragState.currentX = e.x;
    this.dragState.currentY = e.y;

    this.eventBus.emit("controller:drag-move", {
      nodeId,
      x: newX,
      y: newY,
      deltaX,
      deltaY,
    });
  }

  /**
   * Handle canvas mouse up
   *
   * @private
   */
  _onCanvasMouseUp(e) {
    if (!this.dragState.isDragging) {
      return;
    }

    const nodeId = this.dragState.nodeId;
    const wasChanged =
      this.dragState.originalX !== this.dragState.currentX ||
      this.dragState.originalY !== this.dragState.currentY;

    // Record command for undo/redo
    if (wasChanged) {
      this._recordCommand({
        type: "move",
        nodeId,
        from: {
          x: this.dragState.originalX,
          y: this.dragState.originalY,
        },
        to: {
          x: this.dragState.currentX,
          y: this.dragState.currentY,
        },
      });
    }

    this.dragState.isDragging = false;
    this.dragState.nodeId = null;

    this.eventBus.emit("controller:drag-end", { nodeId, changed: wasChanged });
  }

  /**
   * Handle canvas mouse leave
   *
   * @private
   */
  _onCanvasMouseLeave(e) {
    // Cancel drag if mouse leaves canvas
    if (this.dragState.isDragging) {
      // Revert to original position
      const nodeId = this.dragState.nodeId;
      this.nodeManager.move(
        nodeId,
        this.dragState.originalX,
        this.dragState.originalY
      );

      this.dragState.isDragging = false;
      this.dragState.nodeId = null;

      this.eventBus.emit("controller:drag-cancelled", { nodeId });
    }
  }

  /**
   * Handle keyboard down
   *
   * @private
   */
  _onCanvasKeyDown(e) {
    // Delete selected nodes
    if (e.key === this.config.deleteKey) {
      e.event.preventDefault();
      this.deleteSelected();
      return;
    }

    // Duplicate selected nodes
    if (
      this.config.duplicateKey === "Ctrl+D" &&
      e.ctrlKey &&
      e.key.toLowerCase() === "d"
    ) {
      e.event.preventDefault();
      this.duplicateSelected();
      return;
    }

    // Escape - clear selection or cancel operation
    if (e.key === "Escape") {
      if (this.config.escapeAction === "deselect") {
        this.clearSelection();
      }
      return;
    }

    // Select all (Ctrl+A)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.event.preventDefault();
      this.selectAll();
      return;
    }

    // Arrow keys - move selected nodes
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.event.preventDefault();
      this._moveSelectedByArrow(e.key, e.shiftKey);
      return;
    }
  }

  /**
   * Handle keyboard up
   *
   * @private
   */
  _onCanvasKeyUp(e) {
    // Could use for release-based actions
  }

  /**
   * Select a node
   *
   * @param {string} nodeId - Node to select
   * @param {boolean} [append=false] - Add to selection?
   *
   * @example
   * controller.selectNode('node-1');
   * controller.selectNode('node-2', true); // Multi-select
   */
  selectNode(nodeId, append = false) {
    if (!this.nodeManager.has(nodeId)) {
      console.warn(`NodeController: Node '${nodeId}' not found`);
      return;
    }

    if (!append) {
      this.clearSelection();
    }

    this.nodeManager.select(nodeId, append);

    this.eventBus.emit("controller:node-selected", {
      nodeId,
      append,
    });
  }

  /**
   * Deselect a node
   *
   * @param {string} nodeId - Node to deselect
   *
   * @example
   * controller.deselectNode('node-1');
   */
  deselectNode(nodeId) {
    this.nodeManager.deselect(nodeId);

    this.eventBus.emit("controller:node-deselected", { nodeId });
  }

  /**
   * Select all nodes
   *
   * @example
   * controller.selectAll();
   */
  selectAll() {
    this.stateManager.selectAll();

    this.eventBus.emit("controller:select-all");
  }

  /**
   * Clear selection
   *
   * @example
   * controller.clearSelection();
   */
  clearSelection() {
    this.stateManager.clearSelection();

    this.eventBus.emit("controller:selection-cleared");
  }

  /**
   * Delete selected nodes
   *
   * @example
   * controller.deleteSelected();
   */
  deleteSelected() {
    const selected = this.nodeManager.getSelected();

    if (selected.length === 0) {
      return;
    }

    const deletedNodes = [];

    for (const nodeId of selected) {
      const nodeData = this.nodeManager.get(nodeId);
      deletedNodes.push(nodeData);
      this.nodeManager.delete(nodeId, { reason: "user deleted" });
    }

    // Record command for undo
    this._recordCommand({
      type: "delete-nodes",
      nodes: deletedNodes,
    });

    this.eventBus.emit("controller:nodes-deleted", { count: selected.length });
  }

  /**
   * Duplicate selected nodes
   *
   * @example
   * controller.duplicateSelected();
   */
  duplicateSelected() {
    const selected = this.nodeManager.getSelected();

    if (selected.length === 0) {
      return;
    }

    const createdNodes = [];
    const offset = 30;

    for (const nodeId of selected) {
      const original = this.nodeManager.get(nodeId);

      if (!original) {
        continue;
      }

      // Create new node with offset position
      const newNodeData = {
        ...original,
        x: original.x + offset,
        y: original.y + offset,
      };

      const newNodeId = this.nodeManager.create(
        original.shapeType,
        newNodeData,
        { reason: "user duplicated" }
      );

      createdNodes.push(newNodeId);
    }

    // Record command for undo
    this._recordCommand({
      type: "duplicate-nodes",
      createdNodes,
      originalCount: selected.length,
    });

    this.eventBus.emit("controller:nodes-duplicated", {
      count: createdNodes.length,
    });
  }

  /**
   * Start node creation mode
   *
   * @param {string} shapeType - Shape type to create
   *
   * @example
   * controller.startCreation('rectangle');
   * // User clicks and drags to create node
   * // Automatically exits creation mode after creation
   */
  startCreation(shapeType) {
    if (!shapeType || typeof shapeType !== "string") {
      throw new Error(
        `NodeController.startCreation: shapeType must be string, got ${typeof shapeType}`
      );
    }

    this.creationMode = shapeType;
    this.editor.setViewportMode("create");

    this.eventBus.emit("controller:creation-started", { shapeType });
  }

  /**
   * Cancel node creation mode
   *
   * @example
   * controller.cancelCreation();
   */
  cancelCreation() {
    this.creationMode = null;
    this.creationStart = null;
    this.editor.setViewportMode("select");

    this.eventBus.emit("controller:creation-cancelled");
  }

  /**
   * Edit node properties
   *
   * @param {string} nodeId - Node to edit
   * @param {Object} updates - Properties to update
   *
   * @example
   * controller.editNode('node-1', {
   *   label: 'New Label',
   *   fill: '#ff0000'
   * });
   */
  editNode(nodeId, updates) {
    if (!this.nodeManager.has(nodeId)) {
      throw new Error(`NodeController: Node '${nodeId}' not found`);
    }

    const oldNode = this.nodeManager.get(nodeId);

    // Update node
    this.nodeManager.update(nodeId, updates, { reason: "user edited" });

    // Record command for undo
    this._recordCommand({
      type: "edit-node",
      nodeId,
      from: oldNode,
      to: { ...oldNode, ...updates },
    });

    this.eventBus.emit("controller:node-edited", {
      nodeId,
      updates,
    });
  }

  /**
   * Move selected nodes by arrow key
   *
   * @private
   */
  _moveSelectedByArrow(key, isShift) {
    const selected = this.nodeManager.getSelected();
    const distance = isShift ? 10 : 1;

    let deltaX = 0,
      deltaY = 0;

    switch (key) {
      case "ArrowUp":
        deltaY = -distance;
        break;
      case "ArrowDown":
        deltaY = distance;
        break;
      case "ArrowLeft":
        deltaX = -distance;
        break;
      case "ArrowRight":
        deltaX = distance;
        break;
    }

    const moves = [];

    for (const nodeId of selected) {
      const node = this.nodeManager.get(nodeId);

      if (node) {
        this.nodeManager.move(nodeId, node.x + deltaX, node.y + deltaY);
        moves.push({ nodeId, from: { x: node.x, y: node.y } });
      }
    }

    // Record command for undo
    this._recordCommand({
      type: "move-selected",
      moves,
      deltaX,
      deltaY,
    });

    this.eventBus.emit("controller:nodes-moved-by-arrow", {
      count: selected.length,
      deltaX,
      deltaY,
    });
  }

  /**
   * Handle node created event
   *
   * @private
   */
  _onNodeCreated(e) {
    // Auto-render the new node
    const node = this.nodeManager.get(e.nodeId);

    if (node) {
      const layer = this.editor.getLayer("content");
      const nodeElement = this.nodeView.render(node);
      layer.appendChild(nodeElement);
    }

    this.eventBus.emit("controller:node-rendered", { nodeId: e.nodeId });
  }

  /**
   * Handle node deleted event
   *
   * @private
   */
  _onNodeDeleted(e) {
    // View cleanup handled by NodeManager
  }

  /**
   * Handle node selected event
   *
   * @private
   */
  _onNodeSelected(e) {
    // Update node visual state
    const layer = this.editor.getLayer("content");
    const nodeElement = layer.querySelector(`[data-node-id="${e.nodeId}"]`);

    if (nodeElement) {
      this.nodeView.setSelected(nodeElement, true);
    }
  }

  /**
   * Handle node deselected event
   *
   * @private
   */
  _onNodeDeselected(e) {
    // Update node visual state
    const layer = this.editor.getLayer("content");
    const nodeElement = layer.querySelector(`[data-node-id="${e.nodeId}"]`);

    if (nodeElement) {
      this.nodeView.setSelected(nodeElement, false);
    }
  }

  /**
   * Record command for undo/redo
   *
   * @private
   */
  _recordCommand(command) {
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
      case "move":
        this.nodeManager.move(command.nodeId, command.from.x, command.from.y, {
          silent: true,
        });
        break;

      case "delete-nodes":
        for (const nodeData of command.nodes) {
          this.nodeManager.create(nodeData.shapeType, nodeData, {
            silent: true,
          });
        }
        break;

      case "edit-node":
        this.nodeManager.update(command.nodeId, command.from, { silent: true });
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
      case "move":
        this.nodeManager.move(command.nodeId, command.to.x, command.to.y, {
          silent: true,
        });
        break;

      case "delete-nodes":
        for (const nodeData of command.nodes) {
          this.nodeManager.delete(nodeData.id, { silent: true });
        }
        break;

      case "edit-node":
        this.nodeManager.update(command.nodeId, command.to, { silent: true });
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
    const info = this.debugInfo();
    console.log("========== NodeController Debug Info ==========");
    console.log(`Dragging: ${info.isDragging} (${info.draggedNodeId})`);
    console.log(`Creation Mode: ${info.creationMode || "none"}`);
    console.log(`Command History: ${info.commandHistorySize} commands`);
    console.log(`Current Index: ${info.commandIndex}`);
    console.log(`Can Undo: ${info.canUndo}`);
    console.log(`Can Redo: ${info.canRedo}`);
    console.log("=".repeat(44));
  }
}

// Export for use in other modules
export { NodeController };
