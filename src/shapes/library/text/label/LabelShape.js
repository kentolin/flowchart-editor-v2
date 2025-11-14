/** TextShapes.js */
export class LabelShape {
  constructor(config) {
    this.id = "label";
    this.type = "label";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height / 2);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", node.style?.fontSize || "16");
      text.setAttribute("fill", node.style?.textColor || "#000");
      text.textContent = node.label;
      container.appendChild(text);
    }
    return container;
  }
  getConnectionPoints(node) {
    return [];
  }
}
