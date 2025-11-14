/**
 * ValidationManager.js - Validates graph structure and data integrity
 *
 * Responsibilities:
 * - Validate node and edge data
 * - Check for circular dependencies
 * - Validate connection rules
 * - Check graph integrity
 * - Report validation errors/warnings
 * - Support custom validation rules
 *
 * @module core/managers/ValidationManager
 */

export class ValidationManager {
  constructor(eventBus, stateManager, nodeManager, edgeManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;

    // Validation rules
    this.rules = new Map();

    // Validation results
    this.errors = [];
    this.warnings = [];

    // Auto-validation settings
    this.autoValidate = true;
    this.validateOnChange = true;

    this._registerDefaultRules();
    this._setupEventListeners();
  }

  /**
   * Register default validation rules
   * @private
   */
  _registerDefaultRules() {
    // No circular dependencies
    this.addRule("no-cycles", {
      level: "error",
      validate: (graph) => this._checkForCycles(graph),
      message: "Graph contains circular dependencies",
    });

    // All edges must have valid source and target
    this.addRule("valid-connections", {
      level: "error",
      validate: (graph) => this._checkValidConnections(graph),
      message: "Some edges have invalid source or target nodes",
    });

    // No disconnected nodes (warning)
    this.addRule("no-orphans", {
      level: "warning",
      validate: (graph) => this._checkOrphanNodes(graph),
      message: "Some nodes are not connected to the graph",
    });

    // No duplicate edges
    this.addRule("no-duplicate-edges", {
      level: "warning",
      validate: (graph) => this._checkDuplicateEdges(graph),
      message: "Duplicate edges found between same nodes",
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    if (this.validateOnChange) {
      this.eventBus.on("node:created", () => this.validate());
      this.eventBus.on("node:deleted", () => this.validate());
      this.eventBus.on("edge:created", () => this.validate());
      this.eventBus.on("edge:deleted", () => this.validate());
      this.eventBus.on("node:updated", () => this.validate());
    }
  }

  /**
   * Add a custom validation rule
   * @param {string} name - Rule name
   * @param {Object} rule - Rule definition
   */
  addRule(name, rule) {
    this.rules.set(name, {
      level: rule.level || "error", // 'error' or 'warning'
      validate: rule.validate,
      message: rule.message || "Validation failed",
      enabled: rule.enabled !== false,
    });
  }

  /**
   * Remove a validation rule
   * @param {string} name - Rule name
   */
  removeRule(name) {
    this.rules.delete(name);
  }

  /**
   * Enable/disable a rule
   * @param {string} name - Rule name
   * @param {boolean} enabled - Enable state
   */
  setRuleEnabled(name, enabled) {
    const rule = this.rules.get(name);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Validate the entire graph
   * @returns {Object} - Validation results
   */
  validate() {
    this.errors = [];
    this.warnings = [];

    const graph = this._buildGraphRepresentation();

    // Run all enabled rules
    for (const [name, rule] of this.rules.entries()) {
      if (!rule.enabled) continue;

      try {
        const result = rule.validate(graph);

        if (!result.valid) {
          const issue = {
            rule: name,
            level: rule.level,
            message: rule.message,
            details: result.details || [],
          };

          if (rule.level === "error") {
            this.errors.push(issue);
          } else {
            this.warnings.push(issue);
          }
        }
      } catch (error) {
        console.error(`Error running validation rule '${name}':`, error);
      }
    }

    const isValid = this.errors.length === 0;

    // Update state
    this.stateManager.setState("validation", {
      isValid,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
    });

    // Emit event
    this.eventBus.emit("validation:complete", {
      isValid,
      errors: this.errors,
      warnings: this.warnings,
    });

    return {
      isValid,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Validate a specific node
   * @param {string} nodeId - Node to validate
   * @returns {Object} - Validation results
   */
  validateNode(nodeId) {
    const node = this.nodeManager.getNode(nodeId);
    if (!node) {
      return {
        valid: false,
        errors: [{ message: "Node not found" }],
      };
    }

    const errors = [];

    // Check required fields
    if (!node.type) {
      errors.push({ field: "type", message: "Node type is required" });
    }

    // Check position
    if (typeof node.x !== "number" || typeof node.y !== "number") {
      errors.push({ field: "position", message: "Invalid node position" });
    }

    // Check dimensions
    if (node.width && node.width <= 0) {
      errors.push({ field: "width", message: "Width must be positive" });
    }
    if (node.height && node.height <= 0) {
      errors.push({ field: "height", message: "Height must be positive" });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a specific edge
   * @param {string} edgeId - Edge to validate
   * @returns {Object} - Validation results
   */
  validateEdge(edgeId) {
    const edge = this.edgeManager.getEdge(edgeId);
    if (!edge) {
      return {
        valid: false,
        errors: [{ message: "Edge not found" }],
      };
    }

    const errors = [];

    // Check source node exists
    if (!this.nodeManager.getNode(edge.sourceId)) {
      errors.push({ field: "sourceId", message: "Source node does not exist" });
    }

    // Check target node exists
    if (!this.nodeManager.getNode(edge.targetId)) {
      errors.push({ field: "targetId", message: "Target node does not exist" });
    }

    // Check self-loop
    if (edge.sourceId === edge.targetId) {
      errors.push({ message: "Self-loops are not allowed" });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for circular dependencies
   * @private
   */
  _checkForCycles(graph) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoing = graph.edges.filter((e) => e.sourceId === nodeId);

      for (const edge of outgoing) {
        if (!visited.has(edge.targetId)) {
          if (hasCycle(edge.targetId)) {
            return true;
          }
        } else if (recursionStack.has(edge.targetId)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          return { valid: false, details: ["Circular dependency detected"] };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check for valid connections
   * @private
   */
  _checkValidConnections(graph) {
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const invalidEdges = [];

    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
        invalidEdges.push(edge.id);
      }
    }

    if (invalidEdges.length > 0) {
      return {
        valid: false,
        details: invalidEdges.map((id) => `Edge ${id} has invalid connections`),
      };
    }

    return { valid: true };
  }

  /**
   * Check for orphan nodes
   * @private
   */
  _checkOrphanNodes(graph) {
    const connectedNodes = new Set();

    graph.edges.forEach((edge) => {
      connectedNodes.add(edge.sourceId);
      connectedNodes.add(edge.targetId);
    });

    const orphans = graph.nodes.filter((node) => !connectedNodes.has(node.id));

    if (orphans.length > 0) {
      return {
        valid: false,
        details: orphans.map((node) => `Node ${node.id} is not connected`),
      };
    }

    return { valid: true };
  }

  /**
   * Check for duplicate edges
   * @private
   */
  _checkDuplicateEdges(graph) {
    const connections = new Map();
    const duplicates = [];

    for (const edge of graph.edges) {
      const key = `${edge.sourceId}->${edge.targetId}`;

      if (connections.has(key)) {
        duplicates.push(`Duplicate: ${key}`);
      } else {
        connections.set(key, edge.id);
      }
    }

    if (duplicates.length > 0) {
      return { valid: false, details: duplicates };
    }

    return { valid: true };
  }

  /**
   * Build graph representation for validation
   * @private
   */
  _buildGraphRepresentation() {
    return {
      nodes: this.nodeManager.getAllNodes().map((n) => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
      })),
      edges: this.edgeManager.getAllEdges().map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
      })),
    };
  }

  /**
   * Get validation errors
   * @returns {Array}
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Get validation warnings
   * @returns {Array}
   */
  getWarnings() {
    return [...this.warnings];
  }

  /**
   * Check if graph is valid
   * @returns {boolean}
   */
  isValid() {
    return this.errors.length === 0;
  }

  /**
   * Get validation summary
   * @returns {Object}
   */
  getSummary() {
    return {
      isValid: this.isValid(),
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Clear validation results
   */
  clear() {
    this.errors = [];
    this.warnings = [];

    this.stateManager.setState("validation", {
      isValid: true,
      errorCount: 0,
      warningCount: 0,
    });
  }

  /**
   * Enable/disable auto-validation
   * @param {boolean} enabled
   */
  setAutoValidate(enabled) {
    this.autoValidate = enabled;
  }

  /**
   * Enable/disable validation on change
   * @param {boolean} enabled
   */
  setValidateOnChange(enabled) {
    this.validateOnChange = enabled;
  }

  /**
   * Get all registered rules
   * @returns {Map}
   */
  getRules() {
    return new Map(this.rules);
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clear();
    this.rules.clear();
    this.eventBus.off("node:created");
    this.eventBus.off("node:deleted");
    this.eventBus.off("edge:created");
    this.eventBus.off("edge:deleted");
    this.eventBus.off("node:updated");
  }
}
