/**
 * HistoryManager.js - Manages undo/redo history using Command Pattern
 *
 * Responsibilities:
 * - Track all reversible actions
 * - Execute undo/redo operations
 * - Manage history stack with size limits
 * - Support command grouping for atomic operations
 * - Emit history change events
 *
 * @module core/managers/HistoryManager
 */

export class HistoryManager {
  constructor(eventBus, stateManager, options = {}) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;

    // Configuration
    this.maxHistorySize = options.maxHistorySize || 100;
    this.enabled = options.enabled !== false;

    // History stacks
    this.undoStack = [];
    this.redoStack = [];

    // Command grouping for atomic operations
    this.currentGroup = null;
    this.groupDepth = 0;

    // Track if we're currently executing undo/redo
    this.isExecuting = false;

    this._setupEventListeners();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for state changes that should be recorded
    // This is a simplified approach - in production you'd want more granular tracking
  }

  /**
   * Execute a command and add to history
   * @param {Command} command - Command object with execute() and undo() methods
   */
  execute(command) {
    if (!this.enabled || this.isExecuting) {
      return;
    }

    try {
      // Execute the command
      command.execute();

      // Add to history
      if (this.currentGroup) {
        // Add to current group
        this.currentGroup.commands.push(command);
      } else {
        // Add directly to undo stack
        this.undoStack.push(command);

        // Clear redo stack when new action is performed
        this.redoStack = [];

        // Maintain max size
        if (this.undoStack.length > this.maxHistorySize) {
          this.undoStack.shift();
        }
      }

      this._emitHistoryChange();
    } catch (error) {
      console.error("Error executing command:", error);
      this.eventBus.emit("history:error", { error, command });
    }
  }

  /**
   * Undo the last action
   * @returns {boolean} - True if undo was performed
   */
  undo() {
    if (!this.canUndo()) {
      return false;
    }

    this.isExecuting = true;

    try {
      const command = this.undoStack.pop();

      // Execute undo
      command.undo();

      // Move to redo stack
      this.redoStack.push(command);

      this._emitHistoryChange();
      this.eventBus.emit("history:undo", { command });

      return true;
    } catch (error) {
      console.error("Error during undo:", error);
      this.eventBus.emit("history:error", { error, operation: "undo" });
      return false;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Redo the last undone action
   * @returns {boolean} - True if redo was performed
   */
  redo() {
    if (!this.canRedo()) {
      return false;
    }

    this.isExecuting = true;

    try {
      const command = this.redoStack.pop();

      // Execute redo (same as execute)
      command.execute();

      // Move back to undo stack
      this.undoStack.push(command);

      this._emitHistoryChange();
      this.eventBus.emit("history:redo", { command });

      return true;
    } catch (error) {
      console.error("Error during redo:", error);
      this.eventBus.emit("history:error", { error, operation: "redo" });
      return false;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Begin a command group for atomic undo/redo
   * @param {string} name - Group name/description
   */
  beginGroup(name = "Group") {
    this.groupDepth++;

    if (this.groupDepth === 1) {
      this.currentGroup = {
        name,
        commands: [],
        execute: function () {
          this.commands.forEach((cmd) => cmd.execute());
        },
        undo: function () {
          // Undo in reverse order
          for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
          }
        },
      };
    }
  }

  /**
   * End the current command group
   */
  endGroup() {
    if (this.groupDepth === 0) {
      console.warn("endGroup called without matching beginGroup");
      return;
    }

    this.groupDepth--;

    if (this.groupDepth === 0 && this.currentGroup) {
      // Add group to undo stack if it has commands
      if (this.currentGroup.commands.length > 0) {
        this.undoStack.push(this.currentGroup);

        // Clear redo stack
        this.redoStack = [];

        // Maintain max size
        if (this.undoStack.length > this.maxHistorySize) {
          this.undoStack.shift();
        }

        this._emitHistoryChange();
      }

      this.currentGroup = null;
    }
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.currentGroup = null;
    this.groupDepth = 0;

    this._emitHistoryChange();
    this.eventBus.emit("history:cleared");
  }

  /**
   * Get history state
   * @returns {Object}
   */
  getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      enabled: this.enabled,
    };
  }

  /**
   * Get undo stack info (for debugging/UI)
   * @returns {Array}
   */
  getUndoStack() {
    return this.undoStack.map((cmd) => ({
      name: cmd.name || "Command",
      type: cmd.constructor.name,
    }));
  }

  /**
   * Get redo stack info (for debugging/UI)
   * @returns {Array}
   */
  getRedoStack() {
    return this.redoStack.map((cmd) => ({
      name: cmd.name || "Command",
      type: cmd.constructor.name,
    }));
  }

  /**
   * Enable history tracking
   */
  enable() {
    this.enabled = true;
    this.eventBus.emit("history:enabled");
  }

  /**
   * Disable history tracking
   */
  disable() {
    this.enabled = false;
    this.eventBus.emit("history:disabled");
  }

  /**
   * Set maximum history size
   * @param {number} size - Maximum number of commands to store
   */
  setMaxSize(size) {
    this.maxHistorySize = size;

    // Trim stacks if needed
    while (this.undoStack.length > size) {
      this.undoStack.shift();
    }
    while (this.redoStack.length > size) {
      this.redoStack.shift();
    }
  }

  /**
   * Emit history change event
   * @private
   */
  _emitHistoryChange() {
    this.eventBus.emit("history:changed", this.getState());

    // Update state manager
    this.stateManager.setState("history", this.getState());
  }

  /**
   * Serialize history (for save/load)
   * @returns {Object}
   */
  serialize() {
    return {
      undoStack: this.undoStack
        .map((cmd) => (cmd.serialize ? cmd.serialize() : null))
        .filter(Boolean),
      redoStack: this.redoStack
        .map((cmd) => (cmd.serialize ? cmd.serialize() : null))
        .filter(Boolean),
      maxHistorySize: this.maxHistorySize,
      enabled: this.enabled,
    };
  }

  /**
   * Restore history (for save/load)
   * Note: Commands must be reconstructed from serialized data
   * @param {Object} data - Serialized history data
   * @param {Function} commandFactory - Factory to recreate commands from serialized data
   */
  deserialize(data, commandFactory) {
    this.clear();

    this.maxHistorySize = data.maxHistorySize || 100;
    this.enabled = data.enabled !== false;

    // Recreate commands if factory provided
    if (commandFactory) {
      this.undoStack = data.undoStack.map((cmdData) => commandFactory(cmdData));
      this.redoStack = data.redoStack.map((cmdData) => commandFactory(cmdData));
    }

    this._emitHistoryChange();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clear();
  }
}

/**
 * Base Command class
 * All commands should extend this or implement execute() and undo()
 */
export class Command {
  constructor(name = "Command") {
    this.name = name;
    this.timestamp = Date.now();
  }

  execute() {
    throw new Error("Command.execute() must be implemented");
  }

  undo() {
    throw new Error("Command.undo() must be implemented");
  }

  serialize() {
    return {
      name: this.name,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Example Command: Add Node
 */
export class AddNodeCommand extends Command {
  constructor(nodeManager, nodeData) {
    super("Add Node");
    this.nodeManager = nodeManager;
    this.nodeData = nodeData;
    this.nodeId = null;
  }

  execute() {
    this.nodeId = this.nodeManager.createNode(this.nodeData);
  }

  undo() {
    if (this.nodeId) {
      this.nodeManager.deleteNode(this.nodeId);
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      type: "AddNode",
      nodeData: this.nodeData,
      nodeId: this.nodeId,
    };
  }
}

/**
 * Example Command: Delete Node
 */
export class DeleteNodeCommand extends Command {
  constructor(nodeManager, nodeId) {
    super("Delete Node");
    this.nodeManager = nodeManager;
    this.nodeId = nodeId;
    this.nodeData = null;
  }

  execute() {
    // Save node data before deleting
    this.nodeData = this.nodeManager.getNode(this.nodeId).serialize();
    this.nodeManager.deleteNode(this.nodeId);
  }

  undo() {
    if (this.nodeData) {
      this.nodeManager.createNode(this.nodeData);
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      type: "DeleteNode",
      nodeId: this.nodeId,
      nodeData: this.nodeData,
    };
  }
}

/**
 * Example Command: Move Node
 */
export class MoveNodeCommand extends Command {
  constructor(nodeManager, nodeId, oldPosition, newPosition) {
    super("Move Node");
    this.nodeManager = nodeManager;
    this.nodeId = nodeId;
    this.oldPosition = oldPosition;
    this.newPosition = newPosition;
  }

  execute() {
    this.nodeManager.updateNodePosition(this.nodeId, this.newPosition);
  }

  undo() {
    this.nodeManager.updateNodePosition(this.nodeId, this.oldPosition);
  }

  serialize() {
    return {
      ...super.serialize(),
      type: "MoveNode",
      nodeId: this.nodeId,
      oldPosition: this.oldPosition,
      newPosition: this.newPosition,
    };
  }
}

/**
 * Example Command: Update Node Property
 */
export class UpdateNodePropertyCommand extends Command {
  constructor(nodeManager, nodeId, property, oldValue, newValue) {
    super(`Update ${property}`);
    this.nodeManager = nodeManager;
    this.nodeId = nodeId;
    this.property = property;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  execute() {
    this.nodeManager.updateNodeProperty(
      this.nodeId,
      this.property,
      this.newValue
    );
  }

  undo() {
    this.nodeManager.updateNodeProperty(
      this.nodeId,
      this.property,
      this.oldValue
    );
  }

  serialize() {
    return {
      ...super.serialize(),
      type: "UpdateNodeProperty",
      nodeId: this.nodeId,
      property: this.property,
      oldValue: this.oldValue,
      newValue: this.newValue,
    };
  }
}
