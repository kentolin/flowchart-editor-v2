/**
 * HandleManager.js - Resize handle management utilities
 *
 * Provides utilities for managing shape resize handles including
 * handle positioning, resize calculations, and constraint enforcement.
 *
 * @module shapes/helpers/HandleManager
 */

export class HandleManager {
  /**
   * Handle positions with their resize directions
   */
  static HANDLE_POSITIONS = {
    nw: { x: 0, y: 0, cursor: "nw-resize", xDir: -1, yDir: -1 },
    n: { x: 0.5, y: 0, cursor: "n-resize", xDir: 0, yDir: -1 },
    ne: { x: 1, y: 0, cursor: "ne-resize", xDir: 1, yDir: -1 },
    e: { x: 1, y: 0.5, cursor: "e-resize", xDir: 1, yDir: 0 },
    se: { x: 1, y: 1, cursor: "se-resize", xDir: 1, yDir: 1 },
    s: { x: 0.5, y: 1, cursor: "s-resize", xDir: 0, yDir: 1 },
    sw: { x: 0, y: 1, cursor: "sw-resize", xDir: -1, yDir: 1 },
    w: { x: 0, y: 0.5, cursor: "w-resize", xDir: -1, yDir: 0 },
  };

  /**
   * Calculate absolute handle positions for a shape
   * @param {BaseShape} shape - Shape instance
   * @returns {Array} - Array of {id, x, y, cursor}
   */
  static getHandlePositions(shape) {
    if (!shape.handlesEnabled || !shape.features.resizable) {
      return [];
    }

    const bounds = shape.getBounds();
    const handles = [];

    shape.handles.forEach((handleId) => {
      const position = HandleManager.HANDLE_POSITIONS[handleId];
      if (position) {
        handles.push({
          id: handleId,
          x: bounds.x + bounds.width * position.x,
          y: bounds.y + bounds.height * position.y,
          cursor: position.cursor,
          xDir: position.xDir,
          yDir: position.yDir,
        });
      }
    });

    return handles;
  }

  /**
   * Get handle by ID
   * @param {BaseShape} shape - Shape instance
   * @param {string} handleId - Handle identifier
   * @returns {Object|null} - Handle object or null
   */
  static getHandleById(shape, handleId) {
    const handles = HandleManager.getHandlePositions(shape);
    return handles.find((h) => h.id === handleId) || null;
  }

  /**
   * Find handle at point
   * @param {BaseShape} shape - Shape instance
   * @param {Object} point - {x, y}
   * @param {number} threshold - Hit test threshold
   * @returns {Object|null} - Handle object or null
   */
  static findHandleAtPoint(shape, point, threshold = 6) {
    const handles = HandleManager.getHandlePositions(shape);

    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(handle.x - point.x, 2) + Math.pow(handle.y - point.y, 2)
      );

      if (distance <= threshold) {
        return handle;
      }
    }

    return null;
  }

  /**
   * Calculate new bounds based on handle drag
   * @param {BaseShape} shape - Shape instance
   * @param {string} handleId - Handle being dragged
   * @param {Object} delta - {dx, dy} movement delta
   * @param {Object} options - Resize options
   * @returns {Object} - {x, y, width, height}
   */
  static calculateResize(shape, handleId, delta, options = {}) {
    const {
      maintainAspectRatio = false,
      snapToGrid = false,
      gridSize = 10,
      constrainProportions = false,
    } = options;

    const handle = HandleManager.HANDLE_POSITIONS[handleId];
    if (!handle) return null;

    const bounds = shape.getBounds();
    let newBounds = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };

    // Calculate new bounds based on handle direction
    if (handle.xDir !== 0) {
      if (handle.xDir < 0) {
        // Moving left edge
        newBounds.x += delta.dx;
        newBounds.width -= delta.dx;
      } else {
        // Moving right edge
        newBounds.width += delta.dx;
      }
    }

    if (handle.yDir !== 0) {
      if (handle.yDir < 0) {
        // Moving top edge
        newBounds.y += delta.dy;
        newBounds.height -= delta.dy;
      } else {
        // Moving bottom edge
        newBounds.height += delta.dy;
      }
    }

    // Apply aspect ratio constraint
    if (maintainAspectRatio || shape.constraints.aspectRatio) {
      newBounds = HandleManager._applyAspectRatio(
        bounds,
        newBounds,
        handle,
        shape.constraints.aspectRatio
      );
    }

    // Apply constraints
    newBounds = HandleManager._applyConstraints(newBounds, shape.constraints);

    // Apply grid snapping
    if (snapToGrid) {
      newBounds = HandleManager._snapToGrid(newBounds, gridSize);
    }

    return newBounds;
  }

  /**
   * Apply aspect ratio constraint
   * @private
   */
  static _applyAspectRatio(originalBounds, newBounds, handle, aspectRatio) {
    const ratio = aspectRatio || originalBounds.width / originalBounds.height;

    // Determine which dimension changed more
    const widthChange = Math.abs(newBounds.width - originalBounds.width);
    const heightChange = Math.abs(newBounds.height - originalBounds.height);

    if (widthChange > heightChange) {
      // Width changed more, adjust height
      const newHeight = newBounds.width / ratio;
      const heightDiff = newHeight - newBounds.height;

      newBounds.height = newHeight;

      // Adjust y if resizing from top
      if (handle.yDir < 0) {
        newBounds.y -= heightDiff;
      }
    } else {
      // Height changed more, adjust width
      const newWidth = newBounds.height * ratio;
      const widthDiff = newWidth - newBounds.width;

      newBounds.width = newWidth;

      // Adjust x if resizing from left
      if (handle.xDir < 0) {
        newBounds.x -= widthDiff;
      }
    }

    return newBounds;
  }

  /**
   * Apply size constraints
   * @private
   */
  static _applyConstraints(bounds, constraints) {
    const constrained = { ...bounds };

    // Apply min/max width
    if (constraints.minWidth && constrained.width < constraints.minWidth) {
      const diff = constraints.minWidth - constrained.width;
      constrained.width = constraints.minWidth;
      constrained.x -= diff / 2; // Center the constraint adjustment
    }
    if (constraints.maxWidth && constrained.width > constraints.maxWidth) {
      const diff = constrained.width - constraints.maxWidth;
      constrained.width = constraints.maxWidth;
      constrained.x += diff / 2;
    }

    // Apply min/max height
    if (constraints.minHeight && constrained.height < constraints.minHeight) {
      const diff = constraints.minHeight - constrained.height;
      constrained.height = constraints.minHeight;
      constrained.y -= diff / 2;
    }
    if (constraints.maxHeight && constrained.height > constraints.maxHeight) {
      const diff = constrained.height - constraints.maxHeight;
      constrained.height = constraints.maxHeight;
      constrained.y += diff / 2;
    }

    return constrained;
  }

  /**
   * Snap bounds to grid
   * @private
   */
  static _snapToGrid(bounds, gridSize) {
    return {
      x: Math.round(bounds.x / gridSize) * gridSize,
      y: Math.round(bounds.y / gridSize) * gridSize,
      width: Math.round(bounds.width / gridSize) * gridSize,
      height: Math.round(bounds.height / gridSize) * gridSize,
    };
  }

  /**
   * Get opposite handle
   * @param {string} handleId - Handle identifier
   * @returns {string} - Opposite handle ID
   */
  static getOppositeHandle(handleId) {
    const opposites = {
      nw: "se",
      n: "s",
      ne: "sw",
      e: "w",
      se: "nw",
      s: "n",
      sw: "ne",
      w: "e",
    };

    return opposites[handleId];
  }

  /**
   * Check if handle is corner handle
   * @param {string} handleId - Handle identifier
   * @returns {boolean}
   */
  static isCornerHandle(handleId) {
    return ["nw", "ne", "se", "sw"].includes(handleId);
  }

  /**
   * Check if handle is side handle
   * @param {string} handleId - Handle identifier
   * @returns {boolean}
   */
  static isSideHandle(handleId) {
    return ["n", "e", "s", "w"].includes(handleId);
  }

  /**
   * Create standard handle configurations
   * @param {string} preset - Preset name
   * @returns {Array} - Array of handle IDs
   */
  static createStandardHandles(preset = "all") {
    const presets = {
      all: ["nw", "n", "ne", "e", "se", "s", "sw", "w"],
      corners: ["nw", "ne", "se", "sw"],
      sides: ["n", "e", "s", "w"],
      horizontal: ["e", "w"],
      vertical: ["n", "s"],
      proportional: ["nw", "ne", "se", "sw"], // Same as corners
    };

    return presets[preset] || presets["all"];
  }

  /**
   * Highlight handle (add visual indicator)
   * @param {SVGElement} handleElement - Handle SVG element
   * @param {string} color - Highlight color
   */
  static highlightHandle(handleElement, color = "#ff6b00") {
    handleElement.setAttribute(
      "data-original-fill",
      handleElement.getAttribute("fill")
    );
    handleElement.setAttribute("fill", color);
    handleElement.setAttribute("width", "10");
    handleElement.setAttribute("height", "10");
    handleElement.setAttribute(
      "x",
      parseFloat(handleElement.getAttribute("x")) - 1
    );
    handleElement.setAttribute(
      "y",
      parseFloat(handleElement.getAttribute("y")) - 1
    );
  }

  /**
   * Remove handle highlight
   * @param {SVGElement} handleElement - Handle SVG element
   */
  static unhighlightHandle(handleElement) {
    const originalFill = handleElement.getAttribute("data-original-fill");
    if (originalFill) {
      handleElement.setAttribute("fill", originalFill);
    }
    handleElement.setAttribute("width", "8");
    handleElement.setAttribute("height", "8");
    handleElement.setAttribute(
      "x",
      parseFloat(handleElement.getAttribute("x")) + 1
    );
    handleElement.setAttribute(
      "y",
      parseFloat(handleElement.getAttribute("y")) + 1
    );
  }

  /**
   * Calculate resize preview bounds
   * @param {BaseShape} shape - Shape instance
   * @param {string} handleId - Handle being dragged
   * @param {Object} currentPoint - Current mouse point
   * @param {Object} startPoint - Drag start point
   * @param {Object} options - Resize options
   * @returns {Object} - Preview bounds
   */
  static calculateResizePreview(
    shape,
    handleId,
    currentPoint,
    startPoint,
    options = {}
  ) {
    const delta = {
      dx: currentPoint.x - startPoint.x,
      dy: currentPoint.y - startPoint.y,
    };

    return HandleManager.calculateResize(shape, handleId, delta, options);
  }

  /**
   * Apply resize to shape
   * @param {BaseShape} shape - Shape instance
   * @param {Object} newBounds - New bounds
   */
  static applyResize(shape, newBounds) {
    shape.x = newBounds.x;
    shape.y = newBounds.y;
    shape.width = newBounds.width;
    shape.height = newBounds.height;
  }

  /**
   * Check if resize is valid
   * @param {Object} bounds - Proposed bounds
   * @param {Object} constraints - Shape constraints
   * @returns {boolean}
   */
  static isValidResize(bounds, constraints) {
    if (bounds.width < constraints.minWidth) return false;
    if (bounds.height < constraints.minHeight) return false;
    if (constraints.maxWidth && bounds.width > constraints.maxWidth)
      return false;
    if (constraints.maxHeight && bounds.height > constraints.maxHeight)
      return false;

    return true;
  }

  /**
   * Get handle size for rendering
   * @param {number} zoom - Current zoom level
   * @returns {number} - Handle size in pixels
   */
  static getHandleSize(zoom = 1) {
    // Keep handle size consistent regardless of zoom
    return 8 / zoom;
  }

  /**
   * Calculate handle offset for centering
   * @param {number} zoom - Current zoom level
   * @returns {number} - Offset in pixels
   */
  static getHandleOffset(zoom = 1) {
    return HandleManager.getHandleSize(zoom) / 2;
  }

  /**
   * Validate handle configuration
   * @param {Array} handles - Array of handle IDs
   * @returns {Object} - {valid: boolean, errors: Array}
   */
  static validateHandles(handles) {
    const errors = [];
    const validHandles = Object.keys(HandleManager.HANDLE_POSITIONS);

    handles.forEach((handleId) => {
      if (!validHandles.includes(handleId)) {
        errors.push(`Invalid handle ID: ${handleId}`);
      }
    });

    // Check for duplicates
    const unique = new Set(handles);
    if (unique.size !== handles.length) {
      errors.push("Duplicate handle IDs found");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get resize cursor for handle
   * @param {string} handleId - Handle identifier
   * @param {number} rotation - Shape rotation in degrees
   * @returns {string} - CSS cursor value
   */
  static getResizeCursor(handleId, rotation = 0) {
    const handle = HandleManager.HANDLE_POSITIONS[handleId];
    if (!handle) return "default";

    // Adjust cursor based on rotation
    // For simplicity, return base cursor
    // In production, calculate rotated cursor
    return handle.cursor;
  }
}
