/**
 * PreparationShape.js - Flowchart preparation shape (hexagon)
 */
export class PreparationShape {
  constructor(config) {
    this.id = config.id || "preparation";
    this.type = "preparation";
  }

  render(container, node) {
    const { x, y, width, height } = node;
    const offset = width * 0.15;
    const points = `${x + offset},${y} ${x + width - offset},${y} ${
      x + width
    },${y + height / 2} ${x + width - offset},${y + height} ${x + offset},${
      y + height
    } ${x},${y + height / 2}`;

    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute("points", points);
    polygon.setAttribute("fill", node.style?.fill || "#ffffff");
    polygon.setAttribute("stroke", node.style?.stroke || "#000000");
    polygon.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(polygon);

    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height / 2);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("fill", node.style?.textColor || "#000000");
      text.textContent = node.label;
      container.appendChild(text);
    }
    return container;
  }

  getConnectionPoints(node) {
    const { x, y, width, height } = node;
    const offset = width * 0.15;
    return [
      { id: "top-left", x: x + offset, y: y },
      { id: "top-right", x: x + width - offset, y: y },
      { id: "right", x: x + width, y: y + height / 2 },
      { id: "bottom-right", x: x + width - offset, y: y + height },
      { id: "bottom-left", x: x + offset, y: y + height },
      { id: "left", x: x, y: y + height / 2 },
    ];
  }
}
