export class CurvedArrowShape {
  constructor(config) {
    this.id = "curved-arrow";
    this.type = "curved-arrow";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const path = `M ${x} ${y + height} Q ${x + width / 2} ${y} ${
      x + width - 15
    } ${y + height}`;
    const curve = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    curve.setAttribute("d", path);
    curve.setAttribute("fill", "none");
    curve.setAttribute("stroke", node.style?.stroke || "#000");
    curve.setAttribute("stroke-width", node.style?.strokeWidth || 3);
    container.appendChild(curve);
    const arrowhead = `M ${x + width - 20} ${y + height - 8} L ${x + width} ${
      y + height
    } L ${x + width - 15} ${y + height + 8}`;
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
      { id: "start", x: x, y: y + height },
      { id: "end", x: x + width, y: y + height },
    ];
  }
}
