/**
 * shapes/index.js - Main barrel export for all shapes
 *
 * This barrel file provides convenient access to all shape-related functionality:
 * - Base classes for creating custom shapes
 * - Shape registry and definition management
 * - Helper utilities for rendering and manipulation
 * - Shape loader and validation
 * - Complete library of pre-built shapes
 */

// Base shape classes
export { BaseShape } from "./base/BaseShape.js";
export { ShapeBuilder, createShape } from "./base/ShapeBuilder.js";

// Registry
export { ShapeRegistry } from "./registry/ShapeRegistry.js";
export { ShapeDefinition } from "./registry/ShapeDefinition.js";

// Helpers
export { ShapeRenderer } from "./helpers/ShapeRenderer.js";
export { PathGenerator } from "./helpers/PathGenerator.js";
export { PortManager } from "./helpers/PortManager.js";
export { HandleManager } from "./helpers/HandleManager.js";

// Loader
export { ShapeLoader } from "./loader/ShapeLoader.js";
export { ShapeValidator } from "./loader/ShapeValidator.js";

// Shape library - all pre-built shapes
export * from "./library/index.js";
