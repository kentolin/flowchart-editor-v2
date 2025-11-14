/**
 * ManualInputShape.js - Flowchart manual input shape
 */
export class ManualInputShape {
  constructor(config) {
    this.id = config.id || "manual-input";
    this.type = "manual-input";
  }

  render(container, node) {
    const { x, y, width, height } = node;
    const slant = width * 0.15;
    const path = `M ${x + slant} ${y} L ${x + width} ${y} L ${x + width} ${
      y + height
    } L ${x} ${y + height} Z`;

    const pathEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathEl.setAttribute("d", path);
    pathEl.setAttribute("fill", node.style?.fill || "#ffffff");
    pathEl.setAttribute("stroke", node.style?.stroke || "#000000");
    pathEl.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(pathEl);

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
    return [
      { id: "top", x: x + width / 2, y: y },
      { id: "right", x: x + width, y: y + height / 2 },
      { id: "bottom", x: x + width / 2, y: y + height },
      { id: "left", x: x, y: y + height / 2 },
    ];
  }
}
