/**
 * Unit Tests for Managers
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EventBus } from "../../../src/core/events/EventBus.js";
import { StateManager } from "../../../src/core/state/StateManager.js";
import { NodeManager } from "../../../src/core/managers/NodeManager.js";
import { EdgeManager } from "../../../src/core/managers/EdgeManager.js";
import { SelectionManager } from "../../../src/core/managers/SelectionManager.js";
import {
  HistoryManager,
  AddNodeCommand,
} from "../../../src/core/managers/HistoryManager.js";
import { ClipboardManager } from "../../../src/core/managers/ClipboardManager.js";
import { ShapeRegistry } from "../../../src/shapes/registry/ShapeRegistry.js";

describe("NodeManager", () => {
  let eventBus, stateManager, shapeRegistry, nodeManager;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
    shapeRegistry = new ShapeRegistry();
    shapeRegistry.registerShape("rect", class RectShape {});
    nodeManager = new NodeManager(eventBus, stateManager, shapeRegistry);
  });

  afterEach(() => {
    nodeManager.destroy();
  });

  describe("createNode", () => {
    it("should create a node with valid data", () => {
      const nodeId = nodeManager.createNode({
        type: "rect",
        x: 100,
        y: 100,
        width: 120,
        height: 80,
      });

      expect(nodeId).toBeTruthy();
      expect(nodeManager.hasNode(nodeId)).toBe(true);
    });

    it("should generate unique IDs for nodes", () => {
      const id1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      const id2 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });

      expect(id1).not.toBe(id2);
    });

    it("should emit node:created event", (done) => {
      eventBus.on("node:created", ({ nodeId }) => {
        expect(nodeId).toBeTruthy();
        done();
      });

      nodeManager.createNode({ type: "rect", x: 0, y: 0 });
    });

    it("should throw error for invalid shape type", () => {
      expect(() => {
        nodeManager.createNode({ type: "invalid", x: 0, y: 0 });
      }).toThrow();
    });
  });

  describe("getNode", () => {
    it("should return node by ID", () => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      const node = nodeManager.getNode(nodeId);

      expect(node).toBeTruthy();
      expect(node.id).toBe(nodeId);
    });

    it("should return null for non-existent node", () => {
      const node = nodeManager.getNode("non-existent");
      expect(node).toBeNull();
    });
  });

  describe("updateNode", () => {
    it("should update node properties", () => {
      const nodeId = nodeManager.createNode({
        type: "rect",
        x: 0,
        y: 0,
        label: "Old",
      });
      nodeManager.updateNode(nodeId, { label: "New" });

      const node = nodeManager.getNode(nodeId);
      expect(node.label).toBe("New");
    });

    it("should emit node:updated event", (done) => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 0, y: 0 });

      eventBus.on("node:updated", ({ nodeId: id, updates }) => {
        expect(id).toBe(nodeId);
        expect(updates.label).toBe("Updated");
        done();
      });

      nodeManager.updateNode(nodeId, { label: "Updated" });
    });
  });

  describe("deleteNode", () => {
    it("should delete existing node", () => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      const result = nodeManager.deleteNode(nodeId);

      expect(result).toBe(true);
      expect(nodeManager.hasNode(nodeId)).toBe(false);
    });

    it("should emit node:deleted event", (done) => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 0, y: 0 });

      eventBus.on("node:deleted", ({ nodeId: id }) => {
        expect(id).toBe(nodeId);
        done();
      });

      nodeManager.deleteNode(nodeId);
    });
  });

  describe("getNodeBounds", () => {
    it("should return correct bounds", () => {
      const nodeId = nodeManager.createNode({
        type: "rect",
        x: 100,
        y: 200,
        width: 150,
        height: 80,
      });

      const bounds = nodeManager.getNodeBounds(nodeId);

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(150);
      expect(bounds.height).toBe(80);
      expect(bounds.centerX).toBe(175);
      expect(bounds.centerY).toBe(240);
    });
  });
});

describe("EdgeManager", () => {
  let eventBus, stateManager, nodeManager, shapeRegistry, edgeManager;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
    shapeRegistry = new ShapeRegistry();
    shapeRegistry.registerShape("rect", class RectShape {});
    nodeManager = new NodeManager(eventBus, stateManager, shapeRegistry);
    edgeManager = new EdgeManager(eventBus, stateManager, nodeManager);
  });

  afterEach(() => {
    edgeManager.destroy();
    nodeManager.destroy();
  });

  describe("createEdge", () => {
    it("should create edge between two nodes", () => {
      const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      const node2 = nodeManager.createNode({ type: "rect", x: 100, y: 100 });

      const edgeId = edgeManager.createEdge({
        sourceId: node1,
        targetId: node2,
      });

      expect(edgeId).toBeTruthy();
      expect(edgeManager.hasEdge(edgeId)).toBe(true);
    });

    it("should throw error for non-existent source node", () => {
      const node2 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });

      expect(() => {
        edgeManager.createEdge({
          sourceId: "non-existent",
          targetId: node2,
        });
      }).toThrow();
    });

    it("should not allow self-loops", () => {
      const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });

      expect(() => {
        edgeManager.createEdge({
          sourceId: node1,
          targetId: node1,
        });
      }).toThrow();
    });
  });

  describe("getEdgesForNode", () => {
    it("should return all edges connected to node", () => {
      const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      const node2 = nodeManager.createNode({ type: "rect", x: 100, y: 0 });
      const node3 = nodeManager.createNode({ type: "rect", x: 200, y: 0 });

      edgeManager.createEdge({ sourceId: node1, targetId: node2 });
      edgeManager.createEdge({ sourceId: node2, targetId: node3 });

      const edges = edgeManager.getEdgesForNode(node2);
      expect(edges.length).toBe(2);
    });
  });

  describe("deleteEdgesForNode", () => {
    it("should delete all edges when node is deleted", () => {
      const node1 = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      const node2 = nodeManager.createNode({ type: "rect", x: 100, y: 0 });

      edgeManager.createEdge({ sourceId: node1, targetId: node2 });

      nodeManager.deleteNode(node1);

      const edges = edgeManager.getEdgesForNode(node2);
      expect(edges.length).toBe(0);
    });
  });
});

describe("SelectionManager", () => {
  let eventBus, stateManager, selectionManager;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
    selectionManager = new SelectionManager(eventBus, stateManager);
  });

  afterEach(() => {
    selectionManager.destroy();
  });

  describe("selectNode", () => {
    it("should select a node", () => {
      selectionManager.selectNode("node1");

      expect(selectionManager.isNodeSelected("node1")).toBe(true);
    });

    it("should replace selection by default", () => {
      selectionManager.selectNode("node1");
      selectionManager.selectNode("node2");

      expect(selectionManager.isNodeSelected("node1")).toBe(false);
      expect(selectionManager.isNodeSelected("node2")).toBe(true);
    });

    it("should add to selection with mode=add", () => {
      selectionManager.selectNode("node1");
      selectionManager.selectNode("node2", { mode: "add" });

      expect(selectionManager.isNodeSelected("node1")).toBe(true);
      expect(selectionManager.isNodeSelected("node2")).toBe(true);
    });

    it("should toggle selection with mode=toggle", () => {
      selectionManager.selectNode("node1");
      selectionManager.selectNode("node1", { mode: "toggle" });

      expect(selectionManager.isNodeSelected("node1")).toBe(false);
    });
  });

  describe("clearSelection", () => {
    it("should clear all selections", () => {
      selectionManager.selectNode("node1");
      selectionManager.selectNode("node2", { mode: "add" });
      selectionManager.clearSelection();

      expect(selectionManager.hasSelection()).toBe(false);
    });
  });

  describe("getSelection", () => {
    it("should return selected items", () => {
      selectionManager.selectNode("node1");
      selectionManager.selectNode("node2", { mode: "add" });

      const selection = selectionManager.getSelection();

      expect(selection.nodes).toContain("node1");
      expect(selection.nodes).toContain("node2");
      expect(selection.count).toBe(2);
    });
  });
});

describe("HistoryManager", () => {
  let eventBus, stateManager, historyManager;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
    historyManager = new HistoryManager(eventBus, stateManager);
  });

  afterEach(() => {
    historyManager.destroy();
  });

  describe("execute", () => {
    it("should execute command", () => {
      let executed = false;
      const command = {
        execute: () => {
          executed = true;
        },
        undo: () => {
          executed = false;
        },
      };

      historyManager.execute(command);

      expect(executed).toBe(true);
      expect(historyManager.canUndo()).toBe(true);
    });
  });

  describe("undo", () => {
    it("should undo last command", () => {
      let value = 0;
      const command = {
        execute: () => {
          value = 1;
        },
        undo: () => {
          value = 0;
        },
      };

      historyManager.execute(command);
      expect(value).toBe(1);

      historyManager.undo();
      expect(value).toBe(0);
    });

    it("should enable redo after undo", () => {
      const command = {
        execute: () => {},
        undo: () => {},
      };

      historyManager.execute(command);
      historyManager.undo();

      expect(historyManager.canRedo()).toBe(true);
    });
  });

  describe("redo", () => {
    it("should redo undone command", () => {
      let value = 0;
      const command = {
        execute: () => {
          value = 1;
        },
        undo: () => {
          value = 0;
        },
      };

      historyManager.execute(command);
      historyManager.undo();
      historyManager.redo();

      expect(value).toBe(1);
    });
  });

  describe("command grouping", () => {
    it("should group multiple commands", () => {
      let value = 0;

      historyManager.beginGroup("Test Group");
      historyManager.execute({
        execute: () => {
          value += 1;
        },
        undo: () => {
          value -= 1;
        },
      });
      historyManager.execute({
        execute: () => {
          value += 2;
        },
        undo: () => {
          value -= 2;
        },
      });
      historyManager.endGroup();

      expect(value).toBe(3);

      historyManager.undo();
      expect(value).toBe(0);
    });
  });
});

describe("ClipboardManager", () => {
  let eventBus,
    stateManager,
    nodeManager,
    edgeManager,
    selectionManager,
    clipboardManager,
    shapeRegistry;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
    shapeRegistry = new ShapeRegistry();
    shapeRegistry.registerShape("rect", class RectShape {});
    nodeManager = new NodeManager(eventBus, stateManager, shapeRegistry);
    edgeManager = new EdgeManager(eventBus, stateManager, nodeManager);
    selectionManager = new SelectionManager(eventBus, stateManager);
    clipboardManager = new ClipboardManager(
      eventBus,
      stateManager,
      nodeManager,
      edgeManager,
      selectionManager
    );
  });

  afterEach(() => {
    clipboardManager.destroy();
  });

  describe("copy", () => {
    it("should copy selected nodes", () => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      selectionManager.selectNode(nodeId);

      const result = clipboardManager.copy();

      expect(result).toBe(true);
      expect(clipboardManager.hasClipboardData()).toBe(true);
    });

    it("should return false if nothing selected", () => {
      const result = clipboardManager.copy();

      expect(result).toBe(false);
    });
  });

  describe("paste", () => {
    it("should paste copied nodes", () => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 100, y: 100 });
      selectionManager.selectNode(nodeId);
      clipboardManager.copy();

      const initialCount = nodeManager.getNodeCount();
      const result = clipboardManager.paste();

      expect(result.nodes.length).toBe(1);
      expect(nodeManager.getNodeCount()).toBe(initialCount + 1);
    });

    it("should apply paste offset", () => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 100, y: 100 });
      selectionManager.selectNode(nodeId);
      clipboardManager.copy();

      const result = clipboardManager.paste();
      const pastedNode = nodeManager.getNode(result.nodes[0]);

      expect(pastedNode.x).toBe(120); // 100 + 20 offset
      expect(pastedNode.y).toBe(120);
    });
  });

  describe("duplicate", () => {
    it("should duplicate selected nodes", () => {
      const nodeId = nodeManager.createNode({ type: "rect", x: 0, y: 0 });
      selectionManager.selectNode(nodeId);

      const initialCount = nodeManager.getNodeCount();
      clipboardManager.duplicate();

      expect(nodeManager.getNodeCount()).toBe(initialCount + 1);
    });
  });
});
