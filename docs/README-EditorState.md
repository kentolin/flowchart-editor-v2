```javascript
// Generic state access
get(path, defaultValue);
set(path, value, options);
update(updates, options);

// Node operations
addNode(nodeData, options);
removeNode(nodeId, options);
updateNode(nodeId, updates, options);
getNode(nodeId);
getAllNodes();

// Edge operations
addEdge(edgeData, options);
removeEdge(edgeId, options);
updateEdge(edgeId, updates, options);
getEdge(edgeId);
getAllEdges();

// Selection operations
setSelection(selection, options);
clearSelection(options);

// Debug
debugInfo();
printDebugInfo();
```
