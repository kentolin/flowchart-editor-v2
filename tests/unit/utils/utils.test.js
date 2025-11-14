/**
 * Unit Tests for Utils
 */

import { describe, it, expect } from "vitest";
import {
  GeometryUtils,
  ValidationUtils,
  DOMUtils,
  MathUtils,
} from "../../../src/utils/index.js";

describe("GeometryUtils", () => {
  describe("distance", () => {
    it("should calculate distance between two points", () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };

      const dist = GeometryUtils.distance(p1, p2);

      expect(dist).toBe(5);
    });
  });

  describe("pointInRect", () => {
    it("should return true if point is inside rectangle", () => {
      const point = { x: 50, y: 50 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(GeometryUtils.pointInRect(point, rect)).toBe(true);
    });

    it("should return false if point is outside rectangle", () => {
      const point = { x: 150, y: 150 };
      const rect = { x: 0, y: 0, width: 100, height: 100 };

      expect(GeometryUtils.pointInRect(point, rect)).toBe(false);
    });
  });

  describe("rectsIntersect", () => {
    it("should return true if rectangles intersect", () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 };
      const rect2 = { x: 50, y: 50, width: 100, height: 100 };

      expect(GeometryUtils.rectsIntersect(rect1, rect2)).toBe(true);
    });

    it("should return false if rectangles do not intersect", () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 100, y: 100, width: 50, height: 50 };

      expect(GeometryUtils.rectsIntersect(rect1, rect2)).toBe(false);
    });
  });

  describe("boundingBox", () => {
    it("should calculate bounding box for points", () => {
      const points = [
        { x: 10, y: 20 },
        { x: 100, y: 50 },
        { x: 50, y: 150 },
      ];

      const bbox = GeometryUtils.boundingBox(points);

      expect(bbox.x).toBe(10);
      expect(bbox.y).toBe(20);
      expect(bbox.width).toBe(90);
      expect(bbox.height).toBe(130);
    });
  });

  describe("snapToGrid", () => {
    it("should snap value to grid", () => {
      expect(GeometryUtils.snapToGrid(123, 20)).toBe(120);
      expect(GeometryUtils.snapToGrid(127, 20)).toBe(120);
      expect(GeometryUtils.snapToGrid(133, 20)).toBe(140);
    });
  });
});

describe("ValidationUtils", () => {
  describe("validateNode", () => {
    it("should validate valid node", () => {
      const node = {
        id: "node1",
        type: "rect",
        x: 100,
        y: 100,
        width: 120,
        height: 80,
      };

      const result = ValidationUtils.validateNode(node);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should detect missing required fields", () => {
      const node = {
        x: 100,
        y: 100,
      };

      const result = ValidationUtils.validateNode(node);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should detect invalid dimensions", () => {
      const node = {
        id: "node1",
        type: "rect",
        x: 100,
        y: 100,
        width: -10,
        height: 80,
      };

      const result = ValidationUtils.validateNode(node);

      expect(result.valid).toBe(false);
    });
  });

  describe("validateColor", () => {
    it("should validate hex colors", () => {
      expect(ValidationUtils.validateColor("#fff")).toBe(true);
      expect(ValidationUtils.validateColor("#ffffff")).toBe(true);
      expect(ValidationUtils.validateColor("#FF00AA")).toBe(true);
    });

    it("should validate rgb colors", () => {
      expect(ValidationUtils.validateColor("rgb(255, 0, 0)")).toBe(true);
      expect(ValidationUtils.validateColor("rgba(255, 0, 0, 0.5)")).toBe(true);
    });

    it("should validate named colors", () => {
      expect(ValidationUtils.validateColor("red")).toBe(true);
      expect(ValidationUtils.validateColor("transparent")).toBe(true);
    });

    it("should reject invalid colors", () => {
      expect(ValidationUtils.validateColor("notacolor")).toBe(false);
      expect(ValidationUtils.validateColor("#gggggg")).toBe(false);
    });
  });

  describe("validateRange", () => {
    it("should validate numbers in range", () => {
      expect(ValidationUtils.validateRange(5, 0, 10)).toBe(true);
      expect(ValidationUtils.validateRange(0, 0, 10)).toBe(true);
      expect(ValidationUtils.validateRange(10, 0, 10)).toBe(true);
    });

    it("should reject numbers out of range", () => {
      expect(ValidationUtils.validateRange(-1, 0, 10)).toBe(false);
      expect(ValidationUtils.validateRange(11, 0, 10)).toBe(false);
    });
  });
});

describe("MathUtils", () => {
  describe("clamp", () => {
    it("should clamp values between min and max", () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("lerp", () => {
    it("should interpolate between values", () => {
      expect(MathUtils.lerp(0, 100, 0)).toBe(0);
      expect(MathUtils.lerp(0, 100, 1)).toBe(100);
      expect(MathUtils.lerp(0, 100, 0.5)).toBe(50);
    });
  });

  describe("map", () => {
    it("should map value from one range to another", () => {
      expect(MathUtils.map(5, 0, 10, 0, 100)).toBe(50);
      expect(MathUtils.map(0, 0, 10, 0, 100)).toBe(0);
      expect(MathUtils.map(10, 0, 10, 0, 100)).toBe(100);
    });
  });

  describe("round", () => {
    it("should round to specified decimal places", () => {
      expect(MathUtils.round(3.14159, 2)).toBe(3.14);
      expect(MathUtils.round(3.14159, 3)).toBe(3.142);
      expect(MathUtils.round(3.14159, 0)).toBe(3);
    });
  });

  describe("degToRad", () => {
    it("should convert degrees to radians", () => {
      expect(MathUtils.degToRad(0)).toBe(0);
      expect(MathUtils.degToRad(180)).toBeCloseTo(Math.PI);
      expect(MathUtils.degToRad(90)).toBeCloseTo(Math.PI / 2);
    });
  });
});

/**
 * Integration Tests
 */

describe("Integration: Node and Edge Management", () => {
  let eventBus, stateManager, shapeRegistry, nodeManager, edgeManager;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
    shapeRegistry = new ShapeRegistry();
    shapeRegistry.registerShape("rect", class RectShape {});
    nodeManager = new NodeManager(eventBus, stateManager, shapeRegistry);
    edgeManager = new EdgeManager(eventBus, stateManager, nodeManager);
  });

  it("should create connected nodes and edges", () => {
    const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
    const node2 = nodeManager.createNode({ type: "rect", x: 100, y: 0 });
    const node3 = nodeManager.createNode({ type: "rect", x: 200, y: 0 });

    const edge1 = edgeManager.createEdge({ sourceId: node1, targetId: node2 });
    const edge2 = edgeManager.createEdge({ sourceId: node2, targetId: node3 });

    expect(nodeManager.getNodeCount()).toBe(3);
    expect(edgeManager.getEdgeCount()).toBe(2);

    const node2Edges = edgeManager.getEdgesForNode(node2);
    expect(node2Edges.length).toBe(2);
  });

  it("should clean up edges when node is deleted", () => {
    const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
    const node2 = nodeManager.createNode({ type: "rect", x: 100, y: 0 });

    edgeManager.createEdge({ sourceId: node1, targetId: node2 });

    expect(edgeManager.getEdgeCount()).toBe(1);

    nodeManager.deleteNode(node1);

    expect(edgeManager.getEdgeCount()).toBe(0);
  });
});

describe("Integration: Selection and History", () => {
  let eventBus,
    stateManager,
    shapeRegistry,
    nodeManager,
    selectionManager,
    historyManager;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
    shapeRegistry = new ShapeRegistry();
    shapeRegistry.registerShape("rect", class RectShape {});
    nodeManager = new NodeManager(eventBus, stateManager, shapeRegistry);
    selectionManager = new SelectionManager(eventBus, stateManager);
    historyManager = new HistoryManager(eventBus, stateManager);
  });

  it("should maintain selection through undo/redo", () => {
    const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
    selectionManager.selectNode(node1);

    const command = {
      execute: () => {
        nodeManager.updateNode(node1, { label: "Updated" });
      },
      undo: () => {
        nodeManager.updateNode(node1, { label: "" });
      },
    };

    historyManager.execute(command);
    expect(nodeManager.getNode(node1).label).toBe("Updated");

    historyManager.undo();
    expect(nodeManager.getNode(node1).label).toBe("");

    historyManager.redo();
    expect(nodeManager.getNode(node1).label).toBe("Updated");
  });
});

describe("Integration: Complete Workflow", () => {
  it("should handle complete create-edit-delete workflow", () => {
    const eventBus = new EventBus();
    const stateManager = new StateManager(eventBus);
    const shapeRegistry = new ShapeRegistry();
    shapeRegistry.registerShape("rect", class RectShape {});

    const nodeManager = new NodeManager(eventBus, stateManager, shapeRegistry);
    const edgeManager = new EdgeManager(eventBus, stateManager, nodeManager);
    const selectionManager = new SelectionManager(eventBus, stateManager);
    const historyManager = new HistoryManager(eventBus, stateManager);
    const clipboardManager = new ClipboardManager(
      eventBus,
      stateManager,
      nodeManager,
      edgeManager,
      selectionManager
    );

    // Create nodes
    const node1 = nodeManager.createNode({
      type: "rect",
      x: 0,
      y: 0,
      label: "Node 1",
    });
    const node2 = nodeManager.createNode({
      type: "rect",
      x: 100,
      y: 0,
      label: "Node 2",
    });

    // Create edge
    const edge = edgeManager.createEdge({ sourceId: node1, targetId: node2 });

    // Select and copy
    selectionManager.selectNode(node1);
    clipboardManager.copy();

    // Paste
    const pasted = clipboardManager.paste();
    expect(pasted.nodes.length).toBe(1);

    // Update with history
    const updateCommand = {
      execute: () => nodeManager.updateNode(node1, { label: "Updated" }),
      undo: () => nodeManager.updateNode(node1, { label: "Node 1" }),
    };
    historyManager.execute(updateCommand);

    expect(nodeManager.getNode(node1).label).toBe("Updated");

    // Undo
    historyManager.undo();
    expect(nodeManager.getNode(node1).label).toBe("Node 1");

    // Delete
    nodeManager.deleteNode(node1);
    expect(nodeManager.hasNode(node1)).toBe(false);
    expect(edgeManager.getEdgeCount()).toBe(0); // Edge should be auto-deleted
  });
});
