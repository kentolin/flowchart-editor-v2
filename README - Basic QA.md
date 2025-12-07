### 1. Event handlers in app.js vs Editor.js?

```
Keep them in app.js - This is correct.
Why:

Editor only handles canvas-level events (zoom, pan, drop)
app.js handles application-level orchestration (coordinating NodeManager, EdgeManager, StateManager)
Events like node:selected, port:mousedown require coordination between multiple managers - that's app.js's job
Editor shouldn't know about NodeManager or EdgeManager - separation of concerns

Rule: Editor emits low-level events (canvas:clicked), app.js listens and orchestrates high-level actions (create node, create edge).
```
