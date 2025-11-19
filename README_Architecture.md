╔═══════════════════════════════════════════════════════════════════════════════╗
║ FLOWCHART EDITOR ARCHITECTURE ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ INITIALIZATION FLOW │
└─────────────────────────────────────────────────────────────────────────────┘

    [1] index.html
         │
         ├─> <div id="app"></div>
         │
         └─> <script src="main.js">
                      │
                      ▼
    [2] FlowchartApp (main.js)
         │
         ├─> createDOMStructure()
         │        └─> Creates: toolbar, left-panel, editor, right-panel, statusbar
         │
         ├─> ServiceProvider.register(ServiceContainer)
         │        └─> Registers all services as singletons
         │
         ├─> Get: eventBus, shapeRegistry
         │
         ├─> ShapeLoader.loadBuiltInShapes()
         │
         ├─> setupUI()
         │        ├─> ToolBar
         │        ├─> LeftPalette
         │        ├─> RightInspector
         │        └─> StatusBar
         │
         ├─> Get: editor, nodeManager, edgeManager, etc.
         │
         └─> setupEventHandlers()

┌─────────────────────────────────────────────────────────────────────────────┐
│ CORE ARCHITECTURE LAYERS │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: DEPENDENCY INJECTION │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────┐ │
│ │ ServiceContainer │ Singleton pattern │
│ ├─────────────────────┤ │
│ │ - services: Map │ Manages all service instances │
│ │ - singletons: Map │ Lazy initialization │
│ │ - factories: Map │ │
│ ├─────────────────────┤ │
│ │ + register() │ │
│ │ + get() │ │
│ │ + has() │ │
│ └─────────────────────┘ │
│ │ │
│ │ registers │
│ ▼ │
│ ┌─────────────────────┐ │
│ │ ServiceProvider │ Static factory │
│ ├─────────────────────┤ │
│ │ + register() │ Registers all services at once │
│ └─────────────────────┘ │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: EVENT SYSTEM │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────┐ │
│ │ EventBus │ Pub/Sub pattern │
│ ├─────────────────────┤ │
│ │ - listeners: Map │ Decouples components │
│ ├─────────────────────┤ │
│ │ + on(event, cb) │ Subscribe to events │
│ │ + once(event, cb) │ One-time subscription │
│ │ + off(event, cb) │ Unsubscribe │
│ │ + emit(event, data) │ Publish events │
│ └─────────────────────┘ │
│ │ │
│ └─────> Used by ALL components for communication │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: STATE MANAGEMENT │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────┐ ┌─────────────────────┐ │
│ │ EditorState │────────>│ StateManager │ │
│ ├─────────────────────┤ ├─────────────────────┤ │
│ │ - state: Object │ │ + getState() │ │
│ │ ├─ nodes: Map │ │ + setState() │ │
│ │ ├─ edges: Map │ │ + setMode() │ │
│ │ ├─ selection: Set │ │ + setTool() │ │
│ │ ├─ viewport │ │ + setViewport() │ │
│ │ ├─ mode │ └─────────────────────┘ │
│ │ └─ tool │ │
│ ├─────────────────────┤ │
│ │ + addNode() │ │
│ │ + removeNode() │ │
│ │ + addEdge() │ │
│ │ + setViewport() │ │
│ └─────────────────────┘ │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 4: CORE EDITOR & RENDERING │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────┐ │
│ │ Editor │ SVG Canvas Manager │
│ ├─────────────────────┤ │
│ │ - svg: SVGElement │ │
│ │ - edgeLayer: g │ │
│ │ - nodeLayer: g │ │
│ │ - viewport │ │
│ ├─────────────────────┤ │
│ │ + addNode() │ │
│ │ + addEdge() │ │
│ │ + setViewport() │ │
│ │ + updateTransform() │ │
│ │ + getSVG() │ │
│ └─────────────────────┘ │
│ │ │
│ ├─> Appends to: #editor-container │
│ │ │
│ └─> Contains: Node & Edge SVG elements │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 5: MVC PATTERN (Nodes & Edges) │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ NODE MVC │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ │ │
│ │ [Model] [View] [Controller] │ │
│ │ NodeModel ────> NodeView ◄────────── NodeController │ │
│ │ │ │ │ │ │
│ │ │ │ ├─> DragController │ │
│ │ │ │ └─> ResizeController │
│ │ │ │ │ │
│ │ │ ├─> PortView │ │
│ │ │ └─> HandleView │ │
│ │ │ │ │
│ │ └─> Data: id, type, x, y, width, height, label, style │ │
│ │ │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ EDGE MVC │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ │ │
│ │ [Model] [View] [Controller] │ │
│ │ EdgeModel ────> EdgeView ◄────────── EdgeController │ │
│ │ │ │ │ │
│ │ │ └─> Calculates path (straight/bezier/ │ │
│ │ │ orthogonal) │ │
│ │ │ │ │
│ │ └─> Data: id, sourceId, targetId, type, label, style │ │
│ │ │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 6: MANAGERS (Business Logic) │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ NodeManager │ │ EdgeManager │ │
│ ├────────────────────┤ ├────────────────────┤ │
│ │ - nodes: Map │ │ - edges: Map │ │
│ │ - views: Map │ │ - views: Map │ │
│ │ - controllers: Map │ │ - controllers: Map │ │
│ ├────────────────────┤ ├────────────────────┤ │
│ │ + createNode() │ │ + createEdge() │ │
│ │ + getNode() │ │ + getEdge() │ │
│ │ + removeNode() │ │ + removeEdge() │ │
│ │ + updateNode() │ │ + updateEdge() │ │
│ │ + getAllNodes() │ │ + getAllEdges() │ │
│ └────────────────────┘ └────────────────────┘ │
│ │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ SelectionManager │ │ HistoryManager │ │
│ ├────────────────────┤ ├────────────────────┤ │
│ │ - selectedNodes │ │ - undoStack: [] │ │
│ │ - selectedEdges │ │ - redoStack: [] │ │
│ ├────────────────────┤ ├────────────────────┤ │
│ │ + selectNode() │ │ + execute(cmd) │ │
│ │ + selectEdge() │ │ + undo() │ │
│ │ + clearSelection() │ │ + redo() │ │
│ │ + selectArea() │ │ + canUndo() │ │
│ └────────────────────┘ └────────────────────┘ │
│ │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ ClipboardManager │ │ SnapManager │ │
│ ├────────────────────┤ ├────────────────────┤ │
│ │ - clipboard: {} │ │ - gridSize │ │
│ ├────────────────────┤ │ - snapThreshold │ │
│ │ + copy() │ ├────────────────────┤ │
│ │ + paste() │ │ + snapToGrid() │ │
│ │ + cut() │ │ + snapToNode() │ │
│ └────────────────────┘ └────────────────────┘ │
│ │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ ValidationManager │ │ ThemeManager │ │
│ ├────────────────────┤ ├────────────────────┤ │
│ │ - rules: Map │ │ - currentTheme │ │
│ ├────────────────────┤ │ - themes: {} │ │
│ │ + validateConn() │ ├────────────────────┤ │
│ │ + validateNode() │ │ + setTheme() │ │
│ └────────────────────┘ │ + getTheme() │ │
│ └────────────────────┘ │
│ │
│ ┌────────────────────┐ ┌────────────────────┐ │
│ │ ExportManager │ │ PluginManager │ │
│ ├────────────────────┤ ├────────────────────┤ │
│ │ + exportAsJSON() │ │ - plugins: Map │ │
│ │ + exportAsSVG() │ ├────────────────────┤ │
│ │ + exportAsPNG() │ │ + register() │ │
│ │ + importFromJSON() │ │ + unregister() │ │
│ └────────────────────┘ └────────────────────┘ │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 7: SHAPE SYSTEM │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────┐ │
│ │ ShapeRegistry │ Registry pattern │
│ ├─────────────────────┤ │
│ │ - shapes: Map │ Stores shape definitions │
│ │ - categories: Map │ Groups shapes by category │
│ ├─────────────────────┤ │
│ │ + register() │ Register new shape │
│ │ + getShape() │ Get shape by type │
│ │ + getCategory() │ Get shapes in category │
│ │ + getAllCategories()│ │
│ └─────────────────────┘ │
│ │ │
│ │ contains │
│ ▼ │
│ ┌─────────────────────┐ │
│ │ BaseShape │ Abstract base class │
│ ├─────────────────────┤ │
│ │ - type │ │
│ │ - defaultWidth │ │
│ │ - defaultHeight │ │
│ │ - defaultPorts │ │
│ │ - defaultStyle │ │
│ ├─────────────────────┤ │
│ │ + createRenderer() │ Returns shape renderer │
│ │ + render() │ Renders SVG │
│ │ + validate() │ │
│ └─────────────────────┘ │
│ △ │
│ │ extends │
│ │ │
│ ┌────────┴────────┬──────────────┬──────────────┐ │
│ │ │ │ │ │
│ ▼ ▼ ▼ ▼ │
│ RectShape CircleShape DiamondShape ProcessShape │
│ (basic) (basic) (basic) (flowchart) │
│ │
│ ┌─────────────────────┐ │
│ │ ShapeLoader │ Loads shapes into registry │
│ ├─────────────────────┤ │
│ │ + loadBuiltInShapes()│ Loads: rect, circle, diamond, process, │
│ │ + loadCustomShape() │ decision, terminator │
│ └─────────────────────┘ │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ LAYER 8: UI COMPONENTS │
├───────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ MenuBar │ │ ToolBar │ │ StatusBar │ │
│ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤ │
│ │ File, Edit, View │ │ Select, Pan │ │ Cursor position │ │
│ │ Insert, Arrange │ │ Zoom, Undo/Redo │ │ Zoom level │ │
│ │ Help │ │ Alignment tools │ │ Selection count │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│ │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ LeftPalette │ │ RightInspector │ │ LayersPanel │ │
│ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤ │
│ │ Shape library │ │ Properties editor│ │ Layer list │ │
│ │ Search shapes │ │ Node: x,y,w,h │ │ Visibility toggle│ │
│ │ Categories │ │ Edge: type, style│ │ Z-index display │ │
│ │ Drag & drop │ │ Color pickers │ │ │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│ │
│ ┌──────────────────┐ │
│ │ MiniMap │ │
│ ├──────────────────┤ │
│ │ Canvas overview │ │
│ │ Viewport indicator│ │
│ │ Click-to-navigate│ │
│ │ Real-time updates│ │
│ └──────────────────┘ │
│ │
│ DIALOGS: │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ ExportDialog │ │ ShapePickerDialog│ │ ColorPickerDialog│ │
│ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤ │
│ │ Format selection │ │ Shape grid/list │ │ Color presets │ │
│ │ Export options │ │ Category sidebar │ │ Hex input │ │
│ │ File preview │ │ Search shapes │ │ Color picker │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│ │
│ OVERLAYS: │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │ ContextMenu │ │ Tooltip │ │
│ ├──────────────────┤ ├──────────────────┤ │
│ │ Right-click menu │ │ Hover tooltips │ │
│ │ Actions + icons │ │ Delayed display │ │
│ └──────────────────┘ └──────────────────┘ │
│ │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│ DATA FLOW EXAMPLE │
└───────────────────────────────────────────────────────────────────────────┘

USER ACTION: Click shape in LeftPalette
│
├─> [1] LeftPalette.createShapeItem()
│ └─> addEventListener('click')
│
├─> [2] EventBus.emit('shape:selected', { type: 'rect' })
│
├─> [3] main.js: eventBus.on('shape:selected')
│ ├─> StateManager.setMode('draw')
│ └─> StateManager.setTool('rect')
│
└─> [4] User clicks on canvas
│
├─> [5] editorContainer.addEventListener('click')
│ └─> nodeManager.createNode('rect', x, y)
│
├─> [6] NodeManager.createNode()
│ ├─> Creates NodeModel
│ ├─> Creates NodeView (using ShapeRegistry)
│ ├─> Creates NodeController
│ └─> Renders to Editor
│
├─> [7] EventBus.emit('node:created', node)
│
├─> [8] Multiple subscribers react:
│ ├─> MiniMap updates
│ ├─> LayersPanel updates
│ └─> StatusBar updates
│
└─> [9] StateManager resets to 'select' mode

┌───────────────────────────────────────────────────────────────────────────┐
│ KEY DESIGN PATTERNS │
└───────────────────────────────────────────────────────────────────────────┘

1. SINGLETON → ServiceContainer (one instance)
2. FACTORY → ServiceProvider (creates services)
3. REGISTRY → ShapeRegistry (stores shapes)
4. MVC → NodeModel/View/Controller
5. OBSERVER → EventBus (pub/sub)
6. COMMAND → HistoryManager (undo/redo)
7. STRATEGY → Different shape renderers
8. BUILDER → ShapeBuilder (fluent API)
9. FACADE → Managers (simplified interface)
10. DEPENDENCY INJECTION → ServiceContainer

┌───────────────────────────────────────────────────────────────────────────┐
│ FILE STRUCTURE SUMMARY │
└───────────────────────────────────────────────────────────────────────────┘

src/
├── app/
│ └── main.js ← Entry point, bootstraps app
│
├── core/
│ ├── container/ ← DI system
│ │ ├── ServiceContainer.js
│ │ └── ServiceProvider.js
│ ├── events/
│ │ └── EventBus.js ← Event system
│ ├── state/
│ │ └── EditorState.js ← Centralized state
│ ├── managers/ ← Business logic (11 managers)
│ ├── models/ ← Data models
│ ├── views/ ← SVG rendering
│ ├── controllers/ ← User interaction
│ └── Editor.js ← Main canvas manager
│
├── shapes/
│ ├── registry/ ← Shape registration
│ ├── base/ ← Base classes
│ ├── library/ ← All shape implementations
│ └── shapeLoader.js ← Shape loader
│
└── ui/
├── panels/ ← Side panels
├── bars/ ← Top/bottom bars
├── dialogs/ ← Modal dialogs
└── overlays/ ← Context menus, tooltips

main.js
│
▼
ServiceContainer (singleton)
│ registers:
├── editor: Editor()
├── shapes: ShapeRegistry()
├── nodeManager: NodeManager(editor, shapes)
├── edgeManager: EdgeManager(editor, nodeManager)
│
▼
Editor
└── holds viewport
NodeManager
└── creates nodes using ShapeRegistry
EdgeManager
└── renders edges using NodeManager
ShapeRegistry
└── returns Shape classes (RectShape, CircleShape...)
RectShape
└── renders shape → SVG node

main.js
│
▼
ServiceContainer / DI
├─ Editor
├─ ShapeRegistry
├─ NodeManager ───────────────┐
├─ EdgeManager │
│ │
▼ ▼
NodeManager EdgeManager
│ │
├─ createNode() ├─ createEdge()
│ │
▼ ▼
NodeModel EdgeModel
NodeView <─ renders ──> EdgeView
NodeController EdgeController

---

src/
├── app/
│ └── main.js # Application entry point
│
├── core/
│ ├── container/
│ │ ├── ServiceContainer.js
│ │ ├── ServiceProvider.js
│ │ └── index.js
│ │
│ ├── events/
│ │ └── EventBus.js
│ │
│ ├── state/
│ │ └── EditorState.js
│ │
│ ├── managers/
│ │ ├── ClipboardManager.js
│ │ ├── EdgeManager.js
│ │ ├── ExportManager.js
│ │ ├── HistoryManager.js
│ │ ├── NodeManager.js
│ │ ├── PluginManager.js
│ │ ├── SelectionManager.js
│ │ ├── SnapManager.js
│ │ ├── StateManager.js
│ │ ├── ThemeManager.js
│ │ └── ValidationManager.js
│ │
│ ├── models/
│ │ ├── NodeModel.js
│ │ └── EdgeModel.js
│ │
│ ├── views/
│ │ ├── NodeView.js
│ │ ├── EdgeView.js
│ │ ├── PortView.js
│ │ └── HandleView.js
│ │
│ ├── controllers/
│ │ ├── NodeController.js
│ │ ├── EdgeController.js
│ │ ├── DragController.js
│ │ ├── ResizeController.js
│ │ └── PortController.js
│ │
│ ├── Editor.js # Main editor class
│ ├── Geometry.js # Geometry utilities
│ ├── Serializer.js # Import/export logic
│ └── Utils.js # General utilities
│
├── shapes/
│ ├── registry/
│ │ ├── ShapeRegistry.js
│ │ └── ShapeDefinition.js
│ │
│ ├── base/
│ │ ├── BaseShape.js # Abstract base class
│ │ └── ShapeBuilder.js # Fluent builder API
│ │
│ ├── library/ # Organized shape library
│ │ ├── basic/
│ │ │ ├── rect/
│ │ │ │ ├── RectShape.js
│ │ │ │ └── config.json
│ │ │ ├── circle/
│ │ │ │ ├── CircleShape.js
│ │ │ │ └── config.json
│ │ │ └── diamond/
│ │ │ ├── DiamondShape.js
│ │ │ └── config.json
│ │ │
│ │ ├── flowchart/
│ │ │ ├── process/
│ │ │ │ ├── ProcessShape.js
│ │ │ │ └── config.json
│ │ │ ├── decision/
│ │ │ │ ├── DecisionShape.js
│ │ │ │ └── config.json
│ │ │ └── terminator/
│ │ │ ├── TerminatorShape.js
│ │ │ └── config.json
│ │ │
│ │ ├── network/
│ │ │ ├── server/
│ │ │ ├── router/
│ │ │ ├── switch/
│ │ │ └── firewall/
│ │ │
│ │ ├── uml/
│ │ │ ├── class/
│ │ │ ├── interface/
│ │ │ └── actor/
│ │ │
│ │ └── custom/ # User custom shapes
│ │
│ ├── presets/ # Shared configurations
│ │ ├── ports.json # Common port configs
│ │ ├── handles.json # Common handle configs
│ │ └── styles.json # Common styles
│ │
│ └── shapeLoader.js # Dynamic shape loading
│
├── ui/
│ ├── panels/
│ │ ├── LeftPalette.js # Shape palette
│ │ ├── RightInspector.js # Properties inspector
│ │ ├── LayersPanel.js # Layer management
│ │ └── MiniMap.js # Canvas minimap
│ │
│ ├── bars/
│ │ ├── MenuBar.js # Top menu
│ │ ├── ToolBar.js # Tool buttons
│ │ └── StatusBar.js # Bottom status
│ │
│ ├── dialogs/
│ │ ├── ColorPickerDialog.js
│ │ ├── ShapePickerDialog.js
│ │ └── ExportDialog.js
│ │
│ └── overlays/
│ ├── ContextMenu.js
│ └── Tooltip.js
│
├── styles/
│ ├── base/
│ │ ├── reset.css # CSS reset
│ │ ├── variables.css # CSS custom properties
│ │ └── theme.css # Theme definitions
│ │
│ ├── components/
│ │ ├── nodes.css
│ │ ├── edges.css
│ │ ├── panels.css
│ │ ├── toolbar.css
│ │ ├── menu.css
│ │ └── statusbar.css
│ │
│ ├── layout/
│ │ ├── app-layout.css # Main app layout
│ │ ├── left-panel.css
│ │ └── right-panel.css
│ │
│ ├── animations.css # Animations/transitions
│ └── main.css # Main stylesheet import
│
└── assets/
└── icons/
├── sprite.svg # Combined SVG sprite
└── individual/ # Individual icon files
├── close.svg
├── copy.svg
├── delete.svg
└── ...

## Node features:

resize handles

ports

anchors

constraints

selection boxes

1 node → multiple SVG elements

cloning

undo/redo

serialization

snapping / magnet points

overlays

comments

labels

## Edges features:

elbows

orthogonal routing

bezier curves

arrowheads

multi-labels

custom anchors

snapping

rerouting

live update while node moves

hit-testing

hover state

styles

animations
