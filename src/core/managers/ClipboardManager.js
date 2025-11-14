/**
 * ClipboardManager.js - Manages clipboard operations (copy/paste/cut)
 *
 * Responsibilities:
 * - Copy nodes and edges to clipboard
 * - Paste with smart positioning
 * - Cut operations (copy + delete)
 * - Duplicate selected items
 * - Handle clipboard data formats
 * - Support external clipboard integration
 *
 * @module core/managers/ClipboardManager
 */

export class ClipboardManager {
  constructor(
    eventBus,
    stateManager,
    nodeManager,
    edgeManager,
    selectionManager
  ) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.selectionManager = selectionManager;

    // Internal clipboard storage
    this.clipboard = {
      nodes: [],
      edges: [],
      timestamp: null,
      source: "internal", // 'internal' or 'external'
    };

    // Paste offset for visual feedback
    this.pasteOffset = { x: 20, y: 20 };
    this.pasteCount = 0; // Track multiple pastes for increasing offset

    this._setupKeyboardShortcuts();
  }

  /**
   * Setup keyboard shortcuts
   * @private
   */
  _setupKeyboardShortcuts() {
    // This would typically be handled by a KeyboardManager
    // For now, we'll just document the expected shortcuts:
    // Ctrl/Cmd + C: Copy
    // Ctrl/Cmd + X: Cut
    // Ctrl/Cmd + V: Paste
    // Ctrl/Cmd + D: Duplicate
  }

  /**
   * Copy selected items to clipboard
   * @param {Object} options - Copy options
   * @returns {boolean} - True if copy was successful
   */
  copy(options = {}) {
    const selection = this.selectionManager.getSelection();

    if (selection.count === 0) {
      return false;
    }

    try {
      // Serialize selected nodes
      const nodes = selection.nodes
        .map((nodeId) => {
          const node = this.nodeManager.getNode(nodeId);
          return node ? node.serialize() : null;
        })
        .filter(Boolean);

      // Serialize selected edges (only edges between selected nodes)
      const edges = selection.edges
        .map((edgeId) => {
          const edge = this.edgeManager.getEdge(edgeId);
          if (!edge) return null;

          // Only include edge if both source and target are selected
          if (
            selection.nodes.includes(edge.sourceId) &&
            selection.nodes.includes(edge.targetId)
          ) {
            return edge.serialize();
          }
          return null;
        })
        .filter(Boolean);

      // Store in clipboard
      this.clipboard = {
        nodes,
        edges,
        timestamp: Date.now(),
        source: "internal",
      };

      // Reset paste count
      this.pasteCount = 0;

      // Try to write to system clipboard if available
      this._writeToSystemClipboard();

      this.eventBus.emit("clipboard:copy", {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });

      return true;
    } catch (error) {
      console.error("Error during copy:", error);
      this.eventBus.emit("clipboard:error", { operation: "copy", error });
      return false;
    }
  }

  /**
   * Cut selected items (copy + delete)
   * @returns {boolean} - True if cut was successful
   */
  cut() {
    // First copy
    const copied = this.copy();

    if (!copied) {
      return false;
    }

    try {
      const selection = this.selectionManager.getSelection();

      // Delete selected items
      selection.edges.forEach((edgeId) => {
        this.edgeManager.deleteEdge(edgeId);
      });

      selection.nodes.forEach((nodeId) => {
        this.nodeManager.deleteNode(nodeId);
      });

      this.eventBus.emit("clipboard:cut", {
        nodeCount: selection.nodes.length,
        edgeCount: selection.edges.length,
      });

      return true;
    } catch (error) {
      console.error("Error during cut:", error);
      this.eventBus.emit("clipboard:error", { operation: "cut", error });
      return false;
    }
  }

  /**
   * Paste items from clipboard
   * @param {Object} options - Paste options
   * @returns {Object} - Created node and edge IDs
   */
  paste(options = {}) {
    const {
      position = null, // Custom paste position
      offset = true, // Apply paste offset
    } = options;

    if (!this.hasClipboardData()) {
      return { nodes: [], edges: [] };
    }

    try {
      this.pasteCount++;

      // Calculate paste offset
      const pasteOffset = offset
        ? {
            x: this.pasteOffset.x * this.pasteCount,
            y: this.pasteOffset.y * this.pasteCount,
          }
        : { x: 0, y: 0 };

      // Map old IDs to new IDs
      const idMap = new Map();
      const createdNodes = [];
      const createdEdges = [];

      // Create nodes with offset positions
      this.clipboard.nodes.forEach((nodeData) => {
        const newNodeData = {
          ...nodeData,
          id: undefined, // Let NodeManager generate new ID
          x: position ? position.x : nodeData.x + pasteOffset.x,
          y: position ? position.y : nodeData.y + pasteOffset.y,
        };

        const newNodeId = this.nodeManager.createNode(newNodeData);
        idMap.set(nodeData.id, newNodeId);
        createdNodes.push(newNodeId);
      });

      // Create edges with updated node references
      this.clipboard.edges.forEach((edgeData) => {
        const newSourceId = idMap.get(edgeData.sourceId);
        const newTargetId = idMap.get(edgeData.targetId);

        if (newSourceId && newTargetId) {
          const newEdgeData = {
            ...edgeData,
            id: undefined, // Let EdgeManager generate new ID
            sourceId: newSourceId,
            targetId: newTargetId,
          };

          const newEdgeId = this.edgeManager.createEdge(newEdgeData);
          createdEdges.push(newEdgeId);
        }
      });

      // Select newly pasted items
      this.selectionManager.selectNodes(createdNodes, { mode: "replace" });
      this.selectionManager.selectEdges(createdEdges, { mode: "add" });

      this.eventBus.emit("clipboard:paste", {
        nodeCount: createdNodes.length,
        edgeCount: createdEdges.length,
        nodes: createdNodes,
        edges: createdEdges,
      });

      return {
        nodes: createdNodes,
        edges: createdEdges,
      };
    } catch (error) {
      console.error("Error during paste:", error);
      this.eventBus.emit("clipboard:error", { operation: "paste", error });
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Duplicate selected items (copy + immediate paste)
   * @returns {Object} - Created node and edge IDs
   */
  duplicate() {
    this.copy();
    return this.paste();
  }

  /**
   * Check if clipboard has data
   * @returns {boolean}
   */
  hasClipboardData() {
    return this.clipboard.nodes.length > 0 || this.clipboard.edges.length > 0;
  }

  /**
   * Get clipboard data
   * @returns {Object}
   */
  getClipboardData() {
    return {
      ...this.clipboard,
      nodeCount: this.clipboard.nodes.length,
      edgeCount: this.clipboard.edges.length,
    };
  }

  /**
   * Clear clipboard
   */
  clearClipboard() {
    this.clipboard = {
      nodes: [],
      edges: [],
      timestamp: null,
      source: "internal",
    };

    this.pasteCount = 0;

    this.eventBus.emit("clipboard:cleared");
  }

  /**
   * Set paste offset
   * @param {number} x - X offset
   * @param {number} y - Y offset
   */
  setPasteOffset(x, y) {
    this.pasteOffset = { x, y };
  }

  /**
   * Get paste offset
   * @returns {Object}
   */
  getPasteOffset() {
    return { ...this.pasteOffset };
  }

  /**
   * Write to system clipboard (if available)
   * @private
   */
  async _writeToSystemClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return;
    }

    try {
      const data = JSON.stringify({
        type: "flowchart-editor-clipboard",
        version: "1.0",
        nodes: this.clipboard.nodes,
        edges: this.clipboard.edges,
        timestamp: this.clipboard.timestamp,
      });

      await navigator.clipboard.writeText(data);
    } catch (error) {
      // System clipboard write failed, but internal clipboard still works
      console.warn("Could not write to system clipboard:", error);
    }
  }

  /**
   * Read from system clipboard (if available)
   * @private
   */
  async _readFromSystemClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return false;
    }

    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);

      if (data.type === "flowchart-editor-clipboard") {
        this.clipboard = {
          nodes: data.nodes || [],
          edges: data.edges || [],
          timestamp: data.timestamp,
          source: "external",
        };

        this.pasteCount = 0;
        return true;
      }
    } catch (error) {
      // Not valid clipboard data
      return false;
    }

    return false;
  }

  /**
   * Import clipboard data from external source
   * @param {Object} data - Clipboard data
   */
  importClipboard(data) {
    if (!data || !data.nodes) {
      return false;
    }

    this.clipboard = {
      nodes: data.nodes || [],
      edges: data.edges || [],
      timestamp: data.timestamp || Date.now(),
      source: "external",
    };

    this.pasteCount = 0;

    this.eventBus.emit("clipboard:imported", {
      nodeCount: this.clipboard.nodes.length,
      edgeCount: this.clipboard.edges.length,
    });

    return true;
  }

  /**
   * Export clipboard data
   * @returns {Object}
   */
  exportClipboard() {
    return {
      type: "flowchart-editor-clipboard",
      version: "1.0",
      nodes: this.clipboard.nodes,
      edges: this.clipboard.edges,
      timestamp: this.clipboard.timestamp,
    };
  }

  /**
   * Serialize clipboard state
   * @returns {Object}
   */
  serialize() {
    return {
      clipboard: this.clipboard,
      pasteOffset: this.pasteOffset,
      pasteCount: this.pasteCount,
    };
  }

  /**
   * Restore clipboard state
   * @param {Object} data - Serialized clipboard data
   */
  deserialize(data) {
    this.clipboard = data.clipboard || {
      nodes: [],
      edges: [],
      timestamp: null,
      source: "internal",
    };

    this.pasteOffset = data.pasteOffset || { x: 20, y: 20 };
    this.pasteCount = data.pasteCount || 0;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearClipboard();
  }
}
