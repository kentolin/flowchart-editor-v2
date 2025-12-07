## App.js Flow

```
Step 1: Create DOM
    ↓
Step 2: Register Services
    ↓
Step 3: Get eventBus, shapeRegistry
    ↓
Step 4: Load Shapes into shapeRegistry
    ↓
Step 5: Setup UI (LeftPalette uses shapeRegistry)
    ↓
Step 6: Get editor, managers
    ↓
Step 7: Setup Event Handlers (uses all managers)
```

### **Key Points for app.js:**

1. Uses NodeManager.createNode()
2. Complete Edge Creation Logic
3. Node Movement Updates Edges
4. Node Resize Updates Edges
5. Node Deletion Removes Edges
6. Keyboard Shortcuts
7. Helper Methods
   - `getNodeManager`,`getEdgeManager`,`getEditor`,`getStateManager`
8. app.js handles **application-level** orchestration (coordinating NodeManager, EdgeManager, StateManager)
9. Editor only handles **canvas-level** events (zoom, pan, drop)
10. Events like `node:selected`, `port:mousedown` require coordination between multiple managers - that's app.js's job
11. Editor shouldn't know about NodeManager or EdgeManager - separation of concerns

**Rule:** Editor emits low-level events (`canvas:clicked`), app.js listens and orchestrates high-level actions (create node, create edge).
