```javascript
// Canvas operations
setZoom(zoomLevel);
getZoom();
zoomIn() / zoomOut() / resetZoom();
setPan(x, y);
getPan();
setCanvasSize(width, height);

// Selection operations
selectNode(nodeId);
selectNodes(nodeIds);
addNodeToSelection(nodeId);
clearSelection();
selectAll();
isNodeSelected(nodeId);

// Viewport operations
setViewportMode(mode);
getViewportMode();
setDragging(isDragging, startX, startY);

// Theme operations
setTheme(themeName);
getTheme();
setAccentColor(color);

// UI operations
setActivePanel(panelName);
toggleGrid() / toggleGuides() / toggleSnapToGrid();

// Graph queries
getAllNodes();
getNode(nodeId);
getAllEdges();
getEdge(edgeId);

// Debug
getSummary();
printSummary();
```
