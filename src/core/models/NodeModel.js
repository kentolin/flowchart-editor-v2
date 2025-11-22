/**
 * NodeModel.js - Pure data model for a node
 *
 * Responsibilities:
 * - Store node data (id, type, position, size, label, style)
 * - Provide getters/setters for data access
 * - NO rendering logic
 * - NO interaction logic
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class NodeModel {
  constructor(data = {}) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor", data);

    // Core properties
    this.id = data.id || `node_${Date.now()}`;
    this.type = data.type || "rect";

    // Position and size
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.width = data.width || 120;
    this.height = data.height || 60;

    // Visual properties
    this.label = data.label || this.type;
    this.style = data.style || {};

    // Additional metadata
    this.metadata = data.metadata || {};

    this.log.exit("constructor");
  }

  /**
   * Update node position
   */
  setPosition(x, y) {
    this.log.enter("setPosition", { x, y });
    this.x = x;
    this.y = y;
    this.log.exit("setPosition");
  }

  /**
   * Update node size
   */
  setSize(width, height) {
    this.log.enter("setSize", { width, height });
    this.width = width;
    this.height = height;
    this.log.exit("setSize");
  }

  /**
   * Update node label
   */
  setLabel(label) {
    this.log.enter("setLabel", { label });
    this.label = label;
    this.log.exit("setLabel");
  }

  /**
   * Update node style
   */
  setStyle(style) {
    this.log.enter("setStyle", style);
    this.style = { ...this.style, ...style };
    this.log.exit("setStyle");
  }

  /**
   * Get complete node data as plain object
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      label: this.label,
      style: this.style,
      metadata: this.metadata,
    };
  }

  /**
   * Create NodeModel from JSON
   */
  static fromJSON(json) {
    return new NodeModel(json);
  }
}
