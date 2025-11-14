/**
 * Shapes Module - Main Entry Point
 *
 * Central export for the entire shape system.
 * Import everything you need from this single file.
 *
 * @module shapes
 */

// Base classes
export * from "./base/index.js";

// Registry and loader
export * from "./registry/index.js";
export * from "./loader/index.js";

// Helpers
export * from "./helpers/index.js";

// Shape categories (organized imports)
import * as BasicShapes from "./library/basic/index.js";
import * as FlowchartShapes from "./library/flowchart/index.js";
import * as NetworkShapes from "./library/network/index.js";

// Export categories as namespaced objects
export { BasicShapes, FlowchartShapes, NetworkShapes };

// Re-export individual shapes for convenience
export {
  // Basic shapes
  CircleShape,
  RectShape,
  DiamondShape,
  EllipseShape,
  TriangleShape,
} from "./library/basic/index.js";

export {
  // Flowchart shapes
  ProcessShape,
  DecisionShape,
  TerminatorShape,
  DataShape,
  DocumentShape,
} from "./library/flowchart/index.js";

export {
  // Network shapes
  ServerShape,
  RouterShape,
} from "./library/network/index.js";

// Presets (if needed programmatically)
// Note: JSON files are typically loaded via fetch or imported with assertions

/**
 * Usage Examples:
 *
 * // Import everything
 * import * as Shapes from './shapes/index.js';
 *
 * // Import specific category
 * import { BasicShapes, FlowchartShapes } from './shapes/index.js';
 *
 * // Import specific shapes
 * import { CircleShape, ProcessShape, ServerShape } from './shapes/index.js';
 *
 * // Import registry and loader
 * import { ShapeRegistry, ShapeLoader } from './shapes/index.js';
 *
 * // Create shape registry
 * const registry = new Shapes.ShapeRegistry();
 *
 * // Create shape loader
 * const loader = new Shapes.ShapeLoader(registry);
 *
 * // Load all built-in shapes
 * await loader.loadBuiltInShapes('./shapes/library');
 *
 * // Create shapes
 * const circle = registry.create('basic-circle', { x: 100, y: 100, radius: 50 });
 * const process = registry.create('flowchart-process', { x: 200, y: 200, label: 'Process' });
 *
 * // Or create directly
 * const rect = new Shapes.RectShape({ x: 300, y: 300, width: 120, height: 80 });
 */
