/**
 * SnapManager.js - Manages grid snapping and alignment guides
 *
 * Responsibilities:
 * - Grid snapping for nodes
 * - Smart guides (alignment with other nodes)
 * - Distance guides (equal spacing)
 * - Magnetic snapping to grid/guides
 * - Configurable snap settings
 *
 * @module core/managers/SnapManager
 */

export class SnapManager {
  constructor(eventBus, stateManager, options = {}) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;

    // Grid settings
    this.gridEnabled = options.gridEnabled !== false;
    this.gridSize = options.gridSize || 10;
    this.gridVisible = options.gridVisible !== false;

    // Snap settings
    this.snapToGrid = options.snapToGrid !== false;
    this.snapToGuides = options.snapToGuides !== false;
    this.snapThreshold = options.snapThreshold || 5; // pixels

    // Guide settings
    this.showGuides = options.showGuides !== false;
    this.guideColor = options.guideColor || "#00aaff";

    // Active guides (temporary alignment guides)
    this.activeGuides = {
      vertical: [],
      horizontal: [],
    };

    this._setupEventListeners();
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for drag events to show guides
    this.eventBus.on("node:drag:start", ({ nodeId }) => {
      this.clearGuides();
    });

    this.eventBus.on("node:drag:end", () => {
      this.clearGuides();
    });
  }

  /**
   * Snap a point to the grid
   * @param {Object} point - {x, y}
   * @returns {Object} - Snapped {x, y}
   */
  snapToGridPoint(point) {
    if (!this.snapToGrid) {
      return { ...point };
    }

    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize,
    };
  }

  /**
   * Snap a node position considering other nodes
   * @param {Object} node - Node being positioned
   * @param {Array} otherNodes - Other nodes to align with
   * @returns {Object} - {position: {x, y}, guides: [...]}
   */
  snapNodePosition(node, otherNodes) {
    let position = { x: node.x, y: node.y };
    const guides = { vertical: [], horizontal: [] };

    // First, try grid snapping
    if (this.snapToGrid) {
      position = this.snapToGridPoint(position);
    }

    // Then, try guide snapping (overrides grid if closer)
    if (this.snapToGuides && otherNodes && otherNodes.length > 0) {
      const guideSnap = this._findGuideSnaps(node, otherNodes);

      if (guideSnap.x !== null) {
        position.x = guideSnap.x;
        guides.vertical = guideSnap.verticalGuides;
      }

      if (guideSnap.y !== null) {
        position.y = guideSnap.y;
        guides.horizontal = guideSnap.horizontalGuides;
      }
    }

    // Update active guides
    this.activeGuides = guides;

    // Emit guide event if guides changed
    if (guides.vertical.length > 0 || guides.horizontal.length > 0) {
      this.eventBus.emit("snap:guides:show", { guides });
    }

    return { position, guides };
  }

  /**
   * Find potential snap positions based on alignment with other nodes
   * @private
   */
  _findGuideSnaps(node, otherNodes) {
    const result = {
      x: null,
      y: null,
      verticalGuides: [],
      horizontalGuides: [],
    };

    const nodeBounds = this._getNodeBounds(node);
    const threshold = this.snapThreshold;

    // Check alignment with each other node
    for (const otherNode of otherNodes) {
      if (otherNode.id === node.id) continue;

      const otherBounds = this._getNodeBounds(otherNode);

      // Check vertical alignment (X axis)
      // Left edge to left edge
      if (Math.abs(nodeBounds.left - otherBounds.left) < threshold) {
        result.x = otherBounds.left;
        result.verticalGuides.push({
          x: otherBounds.left,
          type: "left",
          nodeId: otherNode.id,
        });
      }
      // Center to center
      else if (Math.abs(nodeBounds.centerX - otherBounds.centerX) < threshold) {
        result.x = otherBounds.centerX - nodeBounds.width / 2;
        result.verticalGuides.push({
          x: otherBounds.centerX,
          type: "center",
          nodeId: otherNode.id,
        });
      }
      // Right edge to right edge
      else if (Math.abs(nodeBounds.right - otherBounds.right) < threshold) {
        result.x = otherBounds.right - nodeBounds.width;
        result.verticalGuides.push({
          x: otherBounds.right,
          type: "right",
          nodeId: otherNode.id,
        });
      }

      // Check horizontal alignment (Y axis)
      // Top edge to top edge
      if (Math.abs(nodeBounds.top - otherBounds.top) < threshold) {
        result.y = otherBounds.top;
        result.horizontalGuides.push({
          y: otherBounds.top,
          type: "top",
          nodeId: otherNode.id,
        });
      }
      // Middle to middle
      else if (Math.abs(nodeBounds.centerY - otherBounds.centerY) < threshold) {
        result.y = otherBounds.centerY - nodeBounds.height / 2;
        result.horizontalGuides.push({
          y: otherBounds.centerY,
          type: "middle",
          nodeId: otherNode.id,
        });
      }
      // Bottom edge to bottom edge
      else if (Math.abs(nodeBounds.bottom - otherBounds.bottom) < threshold) {
        result.y = otherBounds.bottom - nodeBounds.height;
        result.horizontalGuides.push({
          y: otherBounds.bottom,
          type: "bottom",
          nodeId: otherNode.id,
        });
      }
    }

    return result;
  }

  /**
   * Get node bounds
   * @private
   */
  _getNodeBounds(node) {
    const width = node.width || 100;
    const height = node.height || 60;

    return {
      left: node.x,
      right: node.x + width,
      top: node.y,
      bottom: node.y + height,
      centerX: node.x + width / 2,
      centerY: node.y + height / 2,
      width,
      height,
    };
  }

  /**
   * Clear all active guides
   */
  clearGuides() {
    this.activeGuides = {
      vertical: [],
      horizontal: [],
    };

    this.eventBus.emit("snap:guides:hide");
  }

  /**
   * Get active guides
   * @returns {Object}
   */
  getActiveGuides() {
    return { ...this.activeGuides };
  }

  /**
   * Enable/disable grid
   * @param {boolean} enabled
   */
  setGridEnabled(enabled) {
    this.gridEnabled = enabled;
    this.stateManager.setState("snap.gridEnabled", enabled);
    this.eventBus.emit("snap:grid:changed", { enabled });
  }

  /**
   * Enable/disable grid visibility
   * @param {boolean} visible
   */
  setGridVisible(visible) {
    this.gridVisible = visible;
    this.stateManager.setState("snap.gridVisible", visible);
    this.eventBus.emit("snap:grid:visibility", { visible });
  }

  /**
   * Set grid size
   * @param {number} size - Grid size in pixels
   */
  setGridSize(size) {
    if (size > 0) {
      this.gridSize = size;
      this.stateManager.setState("snap.gridSize", size);
      this.eventBus.emit("snap:grid:size", { size });
    }
  }

  /**
   * Enable/disable snap to grid
   * @param {boolean} enabled
   */
  setSnapToGrid(enabled) {
    this.snapToGrid = enabled;
    this.stateManager.setState("snap.snapToGrid", enabled);
    this.eventBus.emit("snap:grid:snap", { enabled });
  }

  /**
   * Enable/disable snap to guides
   * @param {boolean} enabled
   */
  setSnapToGuides(enabled) {
    this.snapToGuides = enabled;
    this.stateManager.setState("snap.snapToGuides", enabled);
    this.eventBus.emit("snap:guides:snap", { enabled });
  }

  /**
   * Set snap threshold
   * @param {number} threshold - Threshold in pixels
   */
  setSnapThreshold(threshold) {
    if (threshold >= 0) {
      this.snapThreshold = threshold;
      this.stateManager.setState("snap.threshold", threshold);
    }
  }

  /**
   * Enable/disable guide display
   * @param {boolean} show
   */
  setShowGuides(show) {
    this.showGuides = show;
    this.stateManager.setState("snap.showGuides", show);
  }

  /**
   * Get snap settings
   * @returns {Object}
   */
  getSettings() {
    return {
      gridEnabled: this.gridEnabled,
      gridSize: this.gridSize,
      gridVisible: this.gridVisible,
      snapToGrid: this.snapToGrid,
      snapToGuides: this.snapToGuides,
      snapThreshold: this.snapThreshold,
      showGuides: this.showGuides,
      guideColor: this.guideColor,
    };
  }

  /**
   * Align nodes horizontally
   * @param {Array} nodes - Nodes to align
   * @param {string} alignment - 'left', 'center', 'right'
   * @returns {Array} - Updated positions
   */
  alignNodesHorizontally(nodes, alignment = "left") {
    if (!nodes || nodes.length < 2) {
      return [];
    }

    const positions = [];

    switch (alignment) {
      case "left": {
        const minX = Math.min(...nodes.map((n) => n.x));
        positions.push(...nodes.map((n) => ({ id: n.id, x: minX, y: n.y })));
        break;
      }

      case "center": {
        const avgX =
          nodes.reduce((sum, n) => sum + n.x + (n.width || 100) / 2, 0) /
          nodes.length;
        positions.push(
          ...nodes.map((n) => ({
            id: n.id,
            x: avgX - (n.width || 100) / 2,
            y: n.y,
          }))
        );
        break;
      }

      case "right": {
        const maxX = Math.max(...nodes.map((n) => n.x + (n.width || 100)));
        positions.push(
          ...nodes.map((n) => ({
            id: n.id,
            x: maxX - (n.width || 100),
            y: n.y,
          }))
        );
        break;
      }
    }

    this.eventBus.emit("snap:align:horizontal", { alignment, positions });

    return positions;
  }

  /**
   * Align nodes vertically
   * @param {Array} nodes - Nodes to align
   * @param {string} alignment - 'top', 'middle', 'bottom'
   * @returns {Array} - Updated positions
   */
  alignNodesVertically(nodes, alignment = "top") {
    if (!nodes || nodes.length < 2) {
      return [];
    }

    const positions = [];

    switch (alignment) {
      case "top": {
        const minY = Math.min(...nodes.map((n) => n.y));
        positions.push(...nodes.map((n) => ({ id: n.id, x: n.x, y: minY })));
        break;
      }

      case "middle": {
        const avgY =
          nodes.reduce((sum, n) => sum + n.y + (n.height || 60) / 2, 0) /
          nodes.length;
        positions.push(
          ...nodes.map((n) => ({
            id: n.id,
            x: n.x,
            y: avgY - (n.height || 60) / 2,
          }))
        );
        break;
      }

      case "bottom": {
        const maxY = Math.max(...nodes.map((n) => n.y + (n.height || 60)));
        positions.push(
          ...nodes.map((n) => ({
            id: n.id,
            x: n.x,
            y: maxY - (n.height || 60),
          }))
        );
        break;
      }
    }

    this.eventBus.emit("snap:align:vertical", { alignment, positions });

    return positions;
  }

  /**
   * Distribute nodes evenly
   * @param {Array} nodes - Nodes to distribute
   * @param {string} direction - 'horizontal' or 'vertical'
   * @returns {Array} - Updated positions
   */
  distributeNodes(nodes, direction = "horizontal") {
    if (!nodes || nodes.length < 3) {
      return [];
    }

    const positions = [];
    const sorted = [...nodes].sort((a, b) =>
      direction === "horizontal" ? a.x - b.x : a.y - b.y
    );

    if (direction === "horizontal") {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpace = last.x + (last.width || 100) - first.x;
      const totalNodeWidth = sorted.reduce(
        (sum, n) => sum + (n.width || 100),
        0
      );
      const spacing = (totalSpace - totalNodeWidth) / (sorted.length - 1);

      let currentX = first.x;
      sorted.forEach((node) => {
        positions.push({ id: node.id, x: currentX, y: node.y });
        currentX += (node.width || 100) + spacing;
      });
    } else {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpace = last.y + (last.height || 60) - first.y;
      const totalNodeHeight = sorted.reduce(
        (sum, n) => sum + (n.height || 60),
        0
      );
      const spacing = (totalSpace - totalNodeHeight) / (sorted.length - 1);

      let currentY = first.y;
      sorted.forEach((node) => {
        positions.push({ id: node.id, x: node.x, y: currentY });
        currentY += (node.height || 60) + spacing;
      });
    }

    this.eventBus.emit("snap:distribute", { direction, positions });

    return positions;
  }

  /**
   * Serialize snap settings
   * @returns {Object}
   */
  serialize() {
    return this.getSettings();
  }

  /**
   * Restore snap settings
   * @param {Object} data - Serialized snap data
   */
  deserialize(data) {
    this.gridEnabled = data.gridEnabled !== false;
    this.gridSize = data.gridSize || 10;
    this.gridVisible = data.gridVisible !== false;
    this.snapToGrid = data.snapToGrid !== false;
    this.snapToGuides = data.snapToGuides !== false;
    this.snapThreshold = data.snapThreshold || 5;
    this.showGuides = data.showGuides !== false;
    this.guideColor = data.guideColor || "#00aaff";
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearGuides();
    this.eventBus.off("node:drag:start");
    this.eventBus.off("node:drag:end");
  }
}
