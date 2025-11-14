/**
 * core/state/index.js - Barrel Export
 *
 * Centralized export point for all state management modules.
 * Simplifies imports throughout the application.
 *
 * @module core/state
 * @version 1.0.0
 *
 * @example
 * // Instead of:
 * import { EditorState } from './core/state/EditorState.js';
 *
 * // Use:
 * import { EditorState } from './core/state/index.js';
 *
 * // Or even simpler:
 * import { EditorState } from './core/state';
 */

export { EditorState } from "./EditorState.js";
export { StateManager } from "./StateManager.js";
