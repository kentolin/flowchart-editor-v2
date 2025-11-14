/**
 * vitest.config.js - Test configuration
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.js"],
      exclude: ["src/**/*.test.js", "src/**/*.spec.js", "tests/**"],
    },
  },
});

/**
 * tests/setup.js - Test setup file
 */

import { beforeAll, afterEach } from "vitest";

// Setup global test utilities
beforeAll(() => {
  // Mock localStorage
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };

  // Mock navigator.clipboard
  global.navigator.clipboard = {
    writeText: async () => {},
    readText: async () => "",
  };
});

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = "";
});

/**
 * E2E Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Editor } from "../../../src/core/Editor.js";
import { ServiceProvider } from "../../../src/core/container/ServiceProvider.js";

describe("E2E: Editor Initialization", () => {
  let container, editor;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("should initialize editor with canvas", () => {
    editor = new Editor(container);

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg.classList.contains("flowchart-editor-canvas")).toBe(true);
  });

  it("should create all required layers", () => {
    editor = new Editor(container);

    expect(editor.layers.grid).toBeTruthy();
    expect(editor.layers.content).toBeTruthy();
    expect(editor.layers.overlay).toBeTruthy();
    expect(editor.layers.ui).toBeTruthy();
  });

  it("should handle viewport transformations", () => {
    editor = new Editor(container);

    const center = editor.getCenter();
    editor.zoom(0.5, center);

    expect(editor.viewport.zoom).toBeGreaterThan(1);
  });
});

describe("E2E: Complete Application Flow", () => {
  let container, provider, editor;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Initialize full application
    provider = new ServiceProvider();
    provider.registerServices();

    editor = new Editor(container);
  });

  it("should create and render nodes", () => {
    const nodeManager = provider.resolve("nodeManager");
    const node1 = nodeManager.createNode({
      type: "rect",
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      label: "Process 1",
    });

    expect(nodeManager.hasNode(node1)).toBe(true);
    expect(nodeManager.getNodeCount()).toBe(1);
  });

  it("should create edges between nodes", () => {
    const nodeManager = provider.resolve("nodeManager");
    const edgeManager = provider.resolve("edgeManager");

    const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
    const node2 = nodeManager.createNode({ type: "rect", x: 200, y: 0 });

    const edge = edgeManager.createEdge({
      sourceId: node1,
      targetId: node2,
    });

    expect(edgeManager.hasEdge(edge)).toBe(true);
  });

  it("should support undo/redo operations", () => {
    const nodeManager = provider.resolve("nodeManager");
    const historyManager = provider.resolve("historyManager");

    const node1 = nodeManager.createNode({
      type: "rect",
      x: 0,
      y: 0,
      label: "Original",
    });

    const updateCommand = {
      execute: () => nodeManager.updateNode(node1, { label: "Updated" }),
      undo: () => nodeManager.updateNode(node1, { label: "Original" }),
    };

    historyManager.execute(updateCommand);
    expect(nodeManager.getNode(node1).label).toBe("Updated");

    historyManager.undo();
    expect(nodeManager.getNode(node1).label).toBe("Original");

    historyManager.redo();
    expect(nodeManager.getNode(node1).label).toBe("Updated");
  });

  it("should support copy/paste operations", () => {
    const nodeManager = provider.resolve("nodeManager");
    const selectionManager = provider.resolve("selectionManager");
    const clipboardManager = provider.resolve("clipboardManager");

    const node1 = nodeManager.createNode({
      type: "rect",
      x: 100,
      y: 100,
      label: "Original",
    });

    selectionManager.selectNode(node1);
    clipboardManager.copy();

    const initialCount = nodeManager.getNodeCount();
    const pasted = clipboardManager.paste();

    expect(pasted.nodes.length).toBe(1);
    expect(nodeManager.getNodeCount()).toBe(initialCount + 1);

    const pastedNode = nodeManager.getNode(pasted.nodes[0]);
    expect(pastedNode.label).toBe("Original");
    expect(pastedNode.x).toBe(120); // With offset
  });

  it("should export and import graph data", () => {
    const nodeManager = provider.resolve("nodeManager");
    const edgeManager = provider.resolve("edgeManager");
    const exportManager = provider.resolve("exportManager");

    // Create graph
    const node1 = nodeManager.createNode({
      type: "rect",
      x: 0,
      y: 0,
      label: "A",
    });
    const node2 = nodeManager.createNode({
      type: "rect",
      x: 200,
      y: 0,
      label: "B",
    });
    const edge = edgeManager.createEdge({ sourceId: node1, targetId: node2 });

    // Export
    const json = exportManager.exportJSON();
    expect(json).toBeTruthy();

    const data = JSON.parse(json);
    expect(data.nodes.length).toBe(2);
    expect(data.edges.length).toBe(1);

    // Clear and import
    nodeManager.clearAll();
    expect(nodeManager.getNodeCount()).toBe(0);

    const imported = exportManager.importJSON(json);
    expect(imported.nodes.length).toBe(2);
    expect(imported.edges.length).toBe(1);
  });

  it("should validate graph structure", () => {
    const nodeManager = provider.resolve("nodeManager");
    const edgeManager = provider.resolve("edgeManager");
    const validationManager = provider.resolve("validationManager");

    // Create valid graph
    const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
    const node2 = nodeManager.createNode({ type: "rect", x: 200, y: 0 });
    edgeManager.createEdge({ sourceId: node1, targetId: node2 });

    const result = validationManager.validate();
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should apply themes", () => {
    const themeManager = provider.resolve("themeManager");

    themeManager.setTheme("dark");
    const theme = themeManager.getCurrentTheme();

    expect(theme.id).toBe("dark");
    expect(theme.canvas).toBeTruthy();
    expect(theme.node).toBeTruthy();
  });

  it("should manage layers", () => {
    const nodeManager = provider.resolve("nodeManager");
    const layerManager = provider.resolve("layerManager");

    const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
    const node2 = nodeManager.createNode({ type: "rect", x: 100, y: 0 });

    // Create custom layer
    layerManager.createLayer("background", { name: "Background" });

    // Move node to layer
    layerManager.addNodeToLayer(node1, "background");

    expect(layerManager.getNodeLayer(node1)).toBe("background");

    // Z-ordering
    layerManager.bringToFront(node2);
    expect(layerManager.getNodeZIndex(node2)).toBeGreaterThan(
      layerManager.getNodeZIndex(node1)
    );
  });
});

describe("E2E: Performance", () => {
  it("should handle large graphs efficiently", () => {
    const nodeManager = provider.resolve("nodeManager");
    const start = performance.now();

    // Create 1000 nodes
    for (let i = 0; i < 1000; i++) {
      nodeManager.createNode({
        type: "rect",
        x: (i % 50) * 50,
        y: Math.floor(i / 50) * 50,
      });
    }

    const end = performance.now();
    const duration = end - start;

    expect(nodeManager.getNodeCount()).toBe(1000);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});

/**
 * package.json test scripts
 */

/*
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "jsdom": "^23.0.0"
  }
}
*/
