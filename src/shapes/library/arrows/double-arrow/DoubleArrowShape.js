export class DoubleArrowShape {
  constructor(config) {
    this.id = "double-arrow";
    this.type = "double-arrow";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const cy = y + height / 2;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x + 15);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", x + width - 15);
    line.setAttribute("y2", cy);
    line.setAttribute("stroke", node.style?.stroke || "#000");
    line.setAttribute("stroke-width", node.style?.strokeWidth || 3);
    container.appendChild(line);
    const arrow1 = `M ${x + 15} ${cy - 8} L ${x} ${cy} L ${x + 15} ${cy + 8}`;
    const arrow1El = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    arrow1El.setAttribute("d", arrow1);
    arrow1El.setAttribute("fill", node.style?.stroke || "#000");
    container.appendChild(arrow1El);
    const arrow2 = `M ${x + width - 15} ${cy - 8} L ${x + width} ${cy} L ${
      x + width - 15
    } ${cy + 8}`;
    const arrow2El = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    arrow2El.setAttribute("d", arrow2);
    arrow2El.setAttribute("fill", node.style?.stroke || "#000");
    container.appendChild(arrow2El);
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
