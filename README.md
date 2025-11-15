# Flowchart Editor v2 - Complete Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Layer Architecture](#layer-architecture)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Design Patterns](#design-patterns)
6. [Getting Started](#getting-started)
7. [API Reference](#api-reference)
8. [Extending the System](#extending-the-system)

---

## Overview

The Flowchart Editor is built using a **layered, modular architecture** that separates concerns across multiple independent layers:

```
┌──────────────────────────────────────┐
│    UI Layer (Panels, Dialogs, Bars)  │
├──────────────────────────────────────┤
│    Manager Layer (Business Logic)    │
├──────────────────────────────────────┤
│   MVC Layer (Models, Views, Control) │
├──────────────────────────────────────┤
│   Core Services (Editor, State, Bus) │
├──────────────────────────────────────┤
│  DI Layer (ServiceContainer)         │
└──────────────────────────────────────┘
```

### Key Principles

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Injection**: All services are managed by ServiceContainer
- **Event-Driven**: Components communicate via EventBus
- **Immutability**: State updates are explicit and traceable
- **Modularity**: Each component is independently testable

---

## Layer Architecture

### Layer 1: Dependency Injection

**Location**: `src/core/container/`

Manages all service instances using the **Singleton pattern**.

**Key Classes**:

- `ServiceContainer`: Stores and retrieves services
- `ServiceProvider`: Bootstraps all services

**Usage**:

```javascript
import { ServiceContainer } from "./core/container/ServiceContainer.js";

const container = new ServiceContainer();
container.register("eventBus", () => new EventBus(), true);
const eventBus = container.get("eventBus");
```

### Layer 2: Event System

**Location**: `src/core/events/`

Implements **Pub/Sub pattern** for component communication.

**Key Classes**:

- `EventBus`: Manages event subscriptions and emissions

**Common Events**:

```javascript
// Node events
"node:created"; // New node created
"node:deleted"; // Node deleted
"node:selected"; // Node selected
"node:updated"; // Node properties changed
"node:dragStart"; // Node drag started
"node:dragging"; // Node being dragged
"node:dragEnd"; // Node drag ended

// Edge events
"edge:created"; // New edge created
"edge:deleted"; // Edge deleted
"edge:selected"; // Edge selected
"edge:updated"; // Edge properties changed

// Canvas events
"canvas:clicked"; // Canvas clicked
"shape:dropped"; // Shape dropped on canvas
"viewport:changed"; // Zoom/pan changed
```

### Layer 3: State Management

**Location**: `src/core/state/`

Centralized state store with immutable updates.

**Key Classes**:

- `EditorState`: Data store
- `StateManager`: State mutations

**State Structure**:

```javascript
{
  nodes: Map<nodeId, NodeModel>,
  edges: Map<edgeId, EdgeModel>,
  selection: {
    nodes: Set<nodeId>,
    edges: Set<edgeId>
  },
  viewport: { x, y, zoom },
  mode: 'select' | 'draw' | 'connect' | 'edit',
  tool: shapeType,
  clipboard: { data, type },
  history: { undoStack, redoStack },
  theme: 'light' | 'dark',
  grid: { enabled, size, visible }
}
```

### Layer 4: Core Services

**Location**: `src/core/`

Core services for rendering and state management.

**Key Classes**:

- `Editor`: SVG canvas management
- `ShapeRegistry`: Shape definitions

### Layer 5: MVC Pattern

**Location**: `src/core/models/`, `src/core/views/`, `src/core/controllers/`

Separates data, presentation, and interaction logic.

**Models** (`src/core/models/`):

- `NodeModel`: Node data structure
- `EdgeModel`: Edge data structure

**Views** (`src/core/views/`):

- `NodeView`: SVG rendering for nodes
- `EdgeView`: SVG rendering for edges

**Controllers** (`src/core/controllers/`):

- `NodeController`: Node interaction handling
- `EdgeController`: Edge interaction handling

### Layer 6: Managers

**Location**: `src/core/managers/`

Business logic layer handling CRUD and domain operations.

**Key Managers**:

| Manager             | Responsibility                              |
| ------------------- | ------------------------------------------- |
| `NodeManager`       | Node creation, deletion, updates, alignment |
| `EdgeManager`       | Edge creation, deletion, routing            |
| `SelectionManager`  | Selection state management                  |
| `HistoryManager`    | Undo/Redo stack                             |
| `ClipboardManager`  | Copy/Paste/Cut operations                   |
| `SnapManager`       | Grid snapping                               |
| `ValidationManager` | Connection/node validation                  |
| `ThemeManager`      | Theme management                            |
| `ExportManager`     | Import/Export (JSON, SVG, PNG)              |
| `PluginManager`     | Plugin registration and execution           |
| `LayerManager`      | Layer organization                          |

### Layer 7: Shape System

**Location**: `src/shapes/`

Defines and manages shape types.

**Key Classes**:

- `BaseShape`: Abstract shape definition
- `ShapeRegistry`: Shape registry
- `ShapeBuilder`: Fluent API for shape creation
- `ShapeLoader`: Loads built-in shapes

**Creating a Custom Shape**:

```javascript
const customShape = new ShapeBuilder("myShape")
  .displayName("My Custom Shape")
  .category("custom")
  .size(100, 100)
  .style({ fill: "#FF0000", stroke: "#000000" })
  .build();

registry.register(customShape);
```

### Layer 8: UI Components

**Location**: `src/ui/`

User interface components.

**Panels**:

- `LeftPalette`: Shape library
- `RightInspector`: Property editor
- `LayersPanel`: Layer management
- `MiniMap`: Canvas overview

**Bars**:

- `MenuBar`: File, Edit, View menus
- `ToolBar`: Quick tools
- `StatusBar`: Status information

**Dialogs**:

- `ExportDialog`: Export options
- `ShapePickerDialog`: Shape selection
- `ColorPickerDialog`: Color selection

---

## Core Components

### ServiceContainer

Manages service lifecycle and dependencies.

```javascript
const container = new ServiceContainer();

// Register a service
container.register("myService", () => new MyService(), true);

// Get a service
const service = container.get("myService");

// Check if service exists
if (container.has("myService")) {
  // ...
}
```

### EventBus

Enables component communication.

```javascript
const eventBus = new EventBus();

// Subscribe to event
eventBus.on("node:created", (node) => {
  console.log("Node created:", node);
});

// One-time subscription
eventBus.once("sync:complete", () => {
  console.log("Sync complete");
});

// Emit event
eventBus.emit("node:created", { id: "node_1", type: "rect" });

// Unsubscribe
eventBus.off("node:created", handler);
```

### Editor

Main SVG canvas manager.

```javascript
const editor = new Editor(eventBus, stateManager);
editor.initialize(svgElement);

// Set viewport (zoom/pan)
editor.setViewport({ x: 0, y: 0, zoom: 1 });

// Add elements
editor.addNodeElement(nodeId, svgElement);
editor.addEdgeElement(edgeId, svgElement);

// Export
const svgString = editor.exportSVG();
const imageUrl = await editor.exportImage("png");

// Fit to view
editor.fitToView(padding);
```

### StateManager

State mutations and queries.

```javascript
const stateManager = new StateManager(editorState);

// Get current state
const state = stateManager.getState();

// Update state
stateManager.setMode("draw");
stateManager.setTool("rect");
stateManager.setViewport({ zoom: 2 });
stateManager.setTheme("dark");

// Grid settings
stateManager.setGrid(true, 20, false);
```

---

## Data Flow

### Flow 1: Creating a Node

```
User clicks "Rectangle" in palette
    ↓
LeftPalette emits 'shape:selected'
    ↓
main.js receives event → StateManager.setMode('draw')
    ↓
User clicks on canvas
    ↓
Canvas emits 'canvas:clicked'
    ↓
main.js calls NodeManager.createNode()
    ↓
NodeManager:
  • Creates NodeModel
  • Creates NodeView
  • Creates NodeController
  • Adds to state
  • Renders to canvas
    ↓
Emits 'node:created'
    ↓
UI updates:
  • LayersPanel adds layer
  • MiniMap updates
  • StatusBar shows message
```

### Flow 2: Connecting Nodes

```
User clicks on source node's port
    ↓
NodeController emits 'port:mouseDown'
    ↓
main.js enters 'connect' mode
    ↓
User clicks on target node's port
    ↓
main.js calls EdgeManager.createEdge()
    ↓
EdgeManager:
  • Validates connection
  • Creates EdgeModel
  • Creates EdgeView
  • Renders to canvas
    ↓
Emits 'edge:created'
    ↓
UI updates
```

### Flow 3: Selecting and Moving

```
User clicks on node
    ↓
NodeView emits click event
    ↓
main.js calls SelectionManager.selectNode()
    ↓
StateManager updates selection state
    ↓
RightInspector displays node properties
    ↓
User drags node
    ↓
NodeController handles mousemove
    ↓
Updates model position
    ↓
Emits 'node:dragging'
    ↓
MiniMap updates viewport indicator
```

---

## Design Patterns

### 1. Singleton Pattern

**Used in**: `ServiceContainer`, Managers

Services are created once and reused throughout the application.

```javascript
container.register('nodeManager', () => new NodeManager(...), true);
// 'true' means singleton - same instance every time
```

### 2. Factory Pattern

**Used in**: `ServiceProvider`, `ShapeBuilder`

Creates services and objects with consistent interfaces.

```javascript
class ServiceProvider {
  static register(container) {
    container.register('editor', (c) => new Editor(...));
  }
}
```

### 3. Registry Pattern

**Used in**: `ShapeRegistry`

Stores and manages collection of objects.

```javascript
registry.register(shape);
const shape = registry.getShape("rect");
const allRectShapes = registry.getCategory("basic");
```

### 4. Observer Pattern (Pub/Sub)

**Used in**: `EventBus`

Components observe events and react without tight coupling.

```javascript
eventBus.on("node:created", (node) => {
  // React to node creation
});
```

### 5. MVC Pattern

**Used in**: Nodes and Edges

Model stores data, View renders it, Controller handles interaction.

```javascript
const model = new NodeModel(data);
const view = new NodeView(model, shape);
const controller = new NodeController(model, view);
```

### 6. Command Pattern

**Used in**: `HistoryManager`

Encapsulates actions as objects for undo/redo.

```javascript
const command = new CreateNodeCommand(nodeManager, data);
historyManager.execute(command); // Can undo later
```

### 7. Strategy Pattern

**Used in**: Shape rendering, Edge routing

Different algorithms for different scenarios.

```javascript
// Different edge routing strategies
const edgeView = new EdgeView(model); // Can render straight, bezier, orthogonal
edgeManager.changeEdgeType(edgeId, "bezier");
```

### 8. Builder Pattern

**Used in**: `ShapeBuilder`

Fluent API for complex object creation.

```javascript
const shape = new ShapeBuilder("rect")
  .displayName("Rectangle")
  .size(120, 60)
  .style({ fill: "#fff" })
  .build();
```

### 9. Facade Pattern

**Used in**: Managers

Simplified interface to complex subsystems.

```javascript
// NodeManager simplifies access to models, views, controllers
nodeManager.createNode(type, x, y);
nodeManager.alignNodes("left");
```

### 10. Dependency Injection

**Used in**: `ServiceContainer`

Decouples components by injecting dependencies.

```javascript
const nodeManager = new NodeManager(editor, stateManager, eventBus, ...);
// Dependencies are passed in, not created internally
```

---

## Getting Started

### 1. Basic Setup

```javascript
import { FlowchartApp } from "./app/main.js";

// Initialize the app
const app = new FlowchartApp();
await app.initialize();

// Access managers
const nodeManager = app.getManager("node");
const edgeManager = app.getManager("edge");
const stateManager = app.getStateManager();
```

### 2. Creating Shapes

```javascript
// Create a rectangle
const node = nodeManager.createNode("rect", 100, 100, {
  label: "Process",
  style: { fill: "#90EE90" },
});

// Create a decision diamond
const decision = nodeManager.createNode("decision", 300, 100, {
  label: "Decision?",
});
```

### 3. Creating Connections

```javascript
// Connect two nodes
const edge = edgeManager.createEdge(node.id, decision.id, {
  label: "Yes",
  type: "straight", // or 'bezier', 'orthogonal'
});
```

### 4. Handling Events

```javascript
const eventBus = app.getService("eventBus");

eventBus.on("node:created", (node) => {
  console.log(`Node created: ${node.id}`);
});

eventBus.on("edge:created", (edge) => {
  console.log(`Edge created: ${edge.id}`);
});

eventBus.on("selection:changed", (selection) => {
  console.log(`Selected: ${selection.nodes.size} nodes`);
});
```

### 5. Export/Import

```javascript
// Export diagram as JSON
const jsonString = exportManager.exportAsJSON();

// Export as SVG
const svgString = exportManager.exportAsSVG();

// Import from JSON
exportManager.importFromJSON(jsonString);
```

---

## API Reference

### NodeManager

```javascript
// Create node
nodeManager.createNode(type, x, y, options);

// Get node
nodeManager.getNode(nodeId);
nodeManager.getAllNodes();

// Update node
nodeManager.updateNode(nodeId, updates);

// Remove node
nodeManager.removeNode(nodeId);
nodeManager.removeNodes([nodeId1, nodeId2]);

// Query
nodeManager.getNodeAt(x, y);
nodeManager.getNodesInArea(x, y, width, height);

// Operations
nodeManager.duplicateNode(nodeId, offsetX, offsetY);
nodeManager.alignNodes(alignment); // 'left', 'right', 'top', 'bottom', 'centerH', 'centerV'
nodeManager.distributeNodes(direction); // 'horizontal', 'vertical'
```

### EdgeManager

```javascript
// Create edge
edgeManager.createEdge(sourceId, targetId, options);

// Get edge
edgeManager.getEdge(edgeId);
edgeManager.getAllEdges();

// Update edge
edgeManager.updateEdge(edgeId, updates);

// Remove edge
edgeManager.removeEdge(edgeId);
edgeManager.removeEdges([edgeId1, edgeId2]);

// Query
edgeManager.getEdgesForNode(nodeId);
edgeManager.getIncomingEdges(nodeId);
edgeManager.getOutgoingEdges(nodeId);
edgeManager.removeNodeEdges(nodeId);

// Operations
edgeManager.changeEdgeType(edgeId, routingType);
edgeManager.detectCycles();
```

### SelectionManager

```javascript
// Select
selectionManager.selectNode(nodeId, addToSelection);
selectionManager.selectNodes([nodeId1, nodeId2]);
selectionManager.selectEdge(edgeId, addToSelection);
selectionManager.selectEdges([edgeId1, edgeId2]);

// Clear
selectionManager.clearSelection();

// Query
selectionManager.getSelection(); // { nodes: Set, edges: Set }
```

### HistoryManager

```javascript
// Execute command
historyManager.execute(command);

// Undo/Redo
historyManager.undo();
historyManager.redo();
historyManager.canUndo();
historyManager.canRedo();

// Clear
historyManager.clear();
```

### ClipboardManager

```javascript
// Copy/Paste/Cut
clipboardManager.copy();
clipboardManager.paste(offsetX, offsetY);
clipboardManager.cut();

// Query
clipboardManager.hasContent();
clipboardManager.clear();
```

### ExportManager

```javascript
// Export
exportManager.exportAsJSON(); // Returns JSON string
exportManager.exportAsSVG(); // Returns SVG string
exportManager.exportAsPNG(); // Returns image URL

// Import
exportManager.importFromJSON(jsonString); // Returns boolean
```

---

## Extending the System

### Adding a Custom Shape

```javascript
import { ShapeBuilder } from "./shapes/registry/ShapeRegistry.js";

const myShape = new ShapeBuilder("myShape")
  .category("custom")
  .displayName("My Shape")
  .description("A custom shape")
  .size(100, 100)
  .style({
    fill: "#FF0000",
    stroke: "#000000",
    strokeWidth: 2,
  })
  .build();

// Register in shape registry
const shapeRegistry = app.getService("shapeRegistry");
shapeRegistry.register(myShape);
```

### Adding a Plugin

```javascript
class MyPlugin {
  name = "myPlugin";

  execute(data) {
    // Plugin logic
    return result;
  }
}

const plugin = new MyPlugin();
app.registerPlugin(plugin);

// Execute plugin
const result = pluginManager.execute("myPlugin", data);
```

### Creating a Custom Manager

```javascript
class CustomManager {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
  }

  // Your custom logic
}

// Register in ServiceProvider
ServiceProvider.registerCustom("customManager", (container) => {
  return new CustomManager(
    container.get("eventBus"),
    container.get("stateManager")
  );
});
```

### Adding Custom Validation Rules

```javascript
const validationManager = app.getManager("validation");

validationManager.addRule("customConnection", (sourceId, targetId) => {
  // Your validation logic
  return true; // or false if not allowed
});
```

---

## Testing Architecture

### Unit Testing

```javascript
// Test a manager in isolation
describe('NodeManager', () => {
  it('should create a node', () => {
    const nodeManager = new NodeManager(editor, stateManager, ...);
    const node = nodeManager.createNode('rect', 0, 0);
    expect(node).toBeDefined();
    expect(node.type).toBe('rect');
  });
});
```

### Integration Testing

```javascript
// Test multiple components working together
describe("Node Creation Flow", () => {
  it("should create node and update UI", () => {
    app.initialize();
    const eventBus = app.getService("eventBus");
    let nodeCreated = false;

    eventBus.on("node:created", () => {
      nodeCreated = true;
    });

    app.getManager("node").createNode("rect", 0, 0);
    expect(nodeCreated).toBe(true);
  });
});
```

---

## Performance Considerations

1. **Lazy Loading**: Services are created on demand
2. **Event Batching**: Batch updates to reduce re-renders
3. **Virtual Rendering**: Only render visible elements
4. **Debouncing**: Debounce frequent events (dragging, zooming)
5. **Caching**: Cache computed values (layouts, paths)

---

## File Structure

```
src/
├── app/
│   └── main.js                      # Application bootstrap
├── core/
│   ├── container/
│   │   ├── ServiceContainer.js
│   │   └── ServiceProvider.js
│   ├── events/
│   │   └── EventBus.js
│   ├── state/
│   │   └── EditorState.js
│   ├── models/
│   │   └── index.js
│   ├── views/
│   │   └── index.js
│   ├── controllers/
│   │   └── index.js
│   ├── managers/
│   │   ├── NodeManager.js
│   │   ├── EdgeManager.js
│   │   └── index.js
│   └── Editor.js
├── shapes/
│   ├── registry/
│   │   └── ShapeRegistry.js
│   └── shapeLoader.js
└── ui/
    ├── panels/
    │   ├── LeftPalette.js
    │   ├── RightInspector.js
    │   ├── LayersPanel.js
    │   └── MiniMap.js
    ├── bars/
    │   ├── MenuBar.js
    │   ├── ToolBar.js
    │   └── StatusBar.js
    └── dialogs/
        ├── ExportDialog.js
        ├── ShapePickerDialog.js
        └── ColorPickerDialog.js
```

---

## Next Steps

1. Implement remaining UI components
2. Add custom shape renderers
3. Implement diagram layout algorithms
4. Add collaborative editing
5. Create plugin system examples
6. Add comprehensive test suite

## Create the complete directory structure for flowchart-editor-v2

```
bash

cd /home/... && mkdir -p flowchart-editor-v2/{assets/{icons,sprite},config,docs/{api,examples,guides},examples/{advanced,basic,diagrams},src/{app,core/{container,controllers,events,managers,models,state,views},shapes/{base,helpers,library/{arrows/{curved-arrow,double-arrow,straight-arrow},basic/{circle,diamond,ellipse,polygon,rect,star,triangle},containers/{frame,group,swimlane},flowchart/{data,decision,display,document,manual-input,predefined-process,preparation,process,terminator},network/{cloud,database,firewall,router,server,switch,workstation},text/{callout,label,note},uml/{actor,class,component,interface,note,package}},loader,presets,registry},styles/{base,components,layout},ui/{bars,dialogs,overlays,panels},utils/{dom,geometry,math,validation}},tests/{e2e/{managers,shapes,utils},integration/{managers,shapes,utils},unit/{managers,shapes,utils}}}
```
