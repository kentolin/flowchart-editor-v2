## Creating a Node:

```

[1] User drops shape from palette
     ↓
[2] app.js: nodeManager.createNode('rect', x, y)
     ↓
[3] NodeManager:
     ├─> Create NodeModel({id, type:'rect', x, y, width, height})
     ├─> Get ShapeDefinition from registry
     ├─> Create NodeView(model, shapeDefinition)
     │    └─> NodeView gets RectShape.render() → <rect>
     │    └─> NodeView adds label, ports, handles
     │    └─> Returns complete <g> group
     ├─> Create NodeController(model, view)
     │    └─> Attaches drag, resize, click handlers
     └─> editor.addNodeElement(nodeId, view.element)
     ↓
[4] Editor: Appends to node layer

```
