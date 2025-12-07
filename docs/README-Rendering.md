## Rendering

```
RectShape.render(width, height, style)
  └─> Returns: <rect width="120" height="60" fill="#fff" stroke="#000"/>

NodeView (wraps it)
  ├─> <g class="node" transform="translate(x,y)">
  │    ├─> <rect> ← from RectShape.render()
  │    ├─> <text>Label</text>
  │    ├─> <g class="ports">
  │    │    ├─> <circle class="port" data-port-id="top"/>
  │    │    ├─> <circle class="port" data-port-id="right"/>
  │    │    └─> ...
  │    └─> <g class="handles">
  │         ├─> <rect class="handle" data-handle-id="nw"/>
  │         └─> ...
  └─> </g>

```
