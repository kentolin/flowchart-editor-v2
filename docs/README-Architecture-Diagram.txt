
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │    UI    │  │   Node   │  │   Edge   │  │  Editor  │   │
│  │Components│  │ Manager  │  │ Manager  │  │          │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │             │          │
│       └─────────────┼──────────────┼─────────────┘          │
│                     │              │                         │
│                     ▼              ▼                         │
│            ┌─────────────────────────────────┐              │
│            │      StateManager               │              │
│            │  (ONLY Interface to State)      │              │
│            │                                 │              │
│            │  • CRUD: add/remove/update      │              │
│            │  • Selection: select/clear      │              │
│            │  • Canvas: zoom/pan             │              │
│            │  • Viewport: mode/drag          │              │
│            │  • Theme: light/dark            │              │
│            │  • UI: panel/grid/guides        │              │
│            │  • Query: get/getAll/has        │              │
│            └────────────┬────────────────────┘              │
│                         │                                    │
│                         ▼                                    │
│            ┌─────────────────────────────────┐              │
│            │       EditorState               │              │
│            │  (Single Source of Truth)       │              │
│            │                                 │              │
│            │  • graph.nodes (Map)            │              │
│            │  • graph.edges (Map)            │              │
│            │  • selection                    │              │
│            │  • canvas (zoom, pan)           │              │
│            │  • viewport (mode, drag)        │              │
│            │  • theme                        │              │
│            │  • ui (grid, guides)            │              │
│            │  • history (undo/redo)          │              │
│            └────────────┬────────────────────┘              │
│                         │                                    │
│                         ▼                                    │
│            ┌─────────────────────────────────┐              │
│            │         EventBus                │              │
│            │  (Event Communication)          │              │
│            └─────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘

KEY PRINCIPLE:
► Nobody touches EditorState except StateManager
► StateManager is the ONLY entry point for all state operations
                                  │
                                  ↓
┌────────────────────────────────────────────────────────────────────────────┐
│                           RENDERING LAYER                                   │
│                                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐            │
│  │    Editor    │◄─────┤   NodeView   │      │   EdgeView   │            │
│  │ (SVG Canvas) │      │  (Renders    │      │  (Renders    │            │
│  └──────┬───────┘      │   nodes)     │      │   edges)     │            │
│         │              └──────────────┘      └──────────────┘            │
│         │                     ▲                                            │
│         │                     │                                            │
│         │              ┌──────┴──────┐                                     │
│         │              │ ShapeClass  │                                     │
│         │              │  (geometry) │                                     │
│         │              └─────────────┘                                     │
│         │                     ▲                                            │
│         │                     │                                            │
│         │              ┌──────┴───────┐                                    │
│         │              │ShapeRegistry │                                    │
│         │              │ShapeLoader   │                                    │
│         │              └──────────────┘                                    │
│         ↓                                                                  │
│  ┌──────────────────────────────────────────────┐                        │
│  │           SVG DOM Structure:                  │                        │
│  │  <svg>                                        │                        │
│  │    <g class="grid-layer">...</g>             │                        │
│  │    <g class="edge-layer">...</g>             │                        │
│  │    <g class="node-layer">                    │                        │
│  │      <g class="node" id="node-123">          │                        │
│  │        <rect/>  ← Shape geometry             │                        │
│  │        <text/>  ← Label                      │                        │
│  │        <g class="ports">...</g>              │                        │
│  │        <g class="handles">...</g>            │                        │
│  │      </g>                                     │                        │
│  │    </g>                                       │                        │
│  │    <g class="overlay-layer">...</g>          │                        │
│  │  </svg>                                       │                        │
│  └──────────────────────────────────────────────┘                        │
└────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║                              DATA FLOW EXAMPLES                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────── CREATE NODE ────────────────────────┐
│                                                             │
│  User drops shape                                           │
│       ↓                                                     │
│  LeftPalette emits 'shape:dropped'                         │
│       ↓                                                     │
│  app.js receives event                                      │
│       ↓                                                     │
│  nodeManager.createNode(type, x, y)                        │
│       ↓                                                     │
│  NodeManager:                                               │
│    1. Get ShapeDefinition from registry                     │
│    2. Create NodeModel (data)                               │
│    3. Create NodeView (visual)                              │
│    4. Create NodeController (interactions)                  │
│    5. Store in local maps                                   │
│    6. ✓ editorState.addNode(nodeData) ← KEY!              │
│    7. editor.addNodeElement(id, svg)                       │
│    8. Emit 'node:created'                                   │
│       ↓                                                     │
│  Node appears on canvas                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────── CREATE EDGE ────────────────────────┐
│                                                             │
│  User clicks port 1                                         │
│       ↓                                                     │
│  NodeController emits 'port:mousedown'                     │
│       ↓                                                     │
│  app.js stores connectingFrom state                         │
│       ↓                                                     │
│  User clicks port 2                                         │
│       ↓                                                     │
│  app.js detects second port                                 │
│       ↓                                                     │
│  edgeManager.createEdge(source, target, ports)            │
│       ↓                                                     │
│  EdgeManager:                                               │
│    1. Validate nodes exist                                  │
│    2. Create EdgeModel                                      │
│    3. Store in local maps                                   │
│    4. Track by nodes                                        │
│    5. ✓ editorState.addEdge(edgeData) ← KEY!              │
│    6. Emit 'edge:created'                                   │
│       ↓                                                     │
│  Edge appears on canvas                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌────────────────────── UPDATE SELECTION ────────────────────┐
│                                                             │
│  User clicks node                                           │
│       ↓                                                     │
│  NodeController emits 'node:selected'                      │
│       ↓                                                     │
│  app.js receives event                                      │
│       ↓                                                     │
│  stateManager.selectNode(nodeId)                           │
│       ↓                                                     │
│  StateManager calls:                                        │
│    editorState.setSelection({nodeIds: [id]})               │
│       ↓                                                     │
│  EditorState:                                               │
│    • Updates selection.nodeIds                              │
│    • Emits 'state:selection-changed'                       │
│       ↓                                                     │
│  UI components update                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║                        KEY ARCHITECTURAL PRINCIPLES                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

1. SEPARATION OF CONCERNS
   • EditorState  = Data storage + event emission
   • StateManager = Convenience API for UI
   • NodeManager  = Business logic for nodes
   • EdgeManager  = Business logic for edges
   • Editor       = SVG rendering only

2. DEPENDENCY INJECTION
   • All services registered in ServiceProvider
   • Dependencies passed via constructor
   • Easy testing and modularity

3. EVENT-DRIVEN COMMUNICATION
   • EventBus for loose coupling
   • Components don't directly call each other
   • Emit events, listen to events

4. MVC PATTERN (for nodes)
   • NodeModel      = Data
   • NodeView       = Visual representation
   • NodeController = User interactions

5. PROPER STATE MANAGEMENT
   • EditorState    = Single source of truth
   • All CRUD ops go through EditorState
   • StateManager is convenience wrapper

╔══════════════════════════════════════════════════════════════════════════════╗
║                             CRITICAL REMINDER                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

  NodeManager uses EditorState, NOT StateManager!
  EdgeManager uses EditorState, NOT StateManager!
  
  EditorState  = addNode(), removeNode(), updateNode()
  StateManager = setZoom(), selectNode(), setTheme()
  
  Managers need CRUD operations → Use EditorState
  UI needs convenience methods → Use StateManager