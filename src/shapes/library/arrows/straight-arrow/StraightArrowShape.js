/** ArrowShapes.js */
export class StraightArrowShape {
  constructor(config) {
    this.id = "straight-arrow";
    this.type = "straight-arrow";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const cy = y + height / 2;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", x + width - 15);
    line.setAttribute("y2", cy);
    line.setAttribute("stroke", node.style?.stroke || "#000");
    line.setAttribute("stroke-width", node.style?.strokeWidth || 3);
    container.appendChild(line);
    const arrowhead = `M ${x + width - 15} ${cy - 8} L ${x + width} ${cy} L ${
      x + width - 15
    } ${cy + 8}`;
    const arrow = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    arrow.setAttribute("d", arrowhead);
    arrow.setAttribute("fill", node.style?.stroke || "#000");
    container.appendChild(arrow);
    return container;
  }
  getConnectionPoints(node) {
    const { x, y, width, height } = node;
    return [
      { id: "start", x: x, y: y + height / 2 },
      { id: "end", x: x + width, y: y + height / 2 },
    ];
  }
}
