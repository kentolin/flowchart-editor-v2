/**
 * PredefinedProcessShape.js - Flowchart predefined process (double-line rectangle)
 */
export class PredefinedProcessShape {
  constructor(config) {
    this.id = config.id || "predefined-process";
    this.type = "predefined-process";
  }

  render(container, node) {
    const { x, y, width, height } = node;
    const inset = 8;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", node.style?.fill || "#ffffff");
    rect.setAttribute("stroke", node.style?.stroke || "#000000");
    rect.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(rect);

    const line1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line1.setAttribute("x1", x + inset);
    line1.setAttribute("y1", y);
    line1.setAttribute("x2", x + inset);
    line1.setAttribute("y2", y + height);
    line1.setAttribute("stroke", node.style?.stroke || "#000000");
    line1.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(line1);

    const line2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line2.setAttribute("x1", x + width - inset);
    line2.setAttribute("y1", y);
    line2.setAttribute("x2", x + width - inset);
    line2.setAttribute("y2", y + height);
    line2.setAttribute("stroke", node.style?.stroke || "#000000");
    line2.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(line2);

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
