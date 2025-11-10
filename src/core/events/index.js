/**
 * events/index.js - Barrel Export
 *
 * Re-exports all event system components
 * Simplifies imports throughout the application
 *
 * @example
 * // Instead of:
 * import { EventBus } from './EventBus.js';
 *
 * // You can do:
 * import { EventBus } from './index.js';
 * // Or even shorter:
 * import { EventBus } from './';
 */

export { EventBus } from "./EventBus.js";
