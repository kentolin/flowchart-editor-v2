/**
 * src/controllers/index.js - Barrel Export
 *
 * Centralized export point for all controller components.
 * Simplifies imports throughout the application.
 *
 * @module controllers
 * @version 1.0.0
 *
 * @example
 * // Instead of:
 * import { NodeController } from './src/controllers/NodeController.js';
 * import { EdgeController } from './src/controllers/EdgeController.js';
 *
 * // Use:
 * import { NodeController, EdgeController } from './src/controllers';
 */

export { NodeController } from "./NodeController.js";
export { EdgeController } from "./EdgeController.js";
