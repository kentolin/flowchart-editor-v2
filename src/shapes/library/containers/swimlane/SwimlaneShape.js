/** ContainerShapes.js */
export class SwimlaneShape {
  constructor(config) {
    this.id = "swimlane";
    this.type = "swimlane";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", node.style?.fill || "#e3f2fd");
    rect.setAttribute("stroke", node.style?.stroke || "#1976d2");
    rect.setAttribute("stroke-width", 2);
    rect.setAttribute("stroke-dasharray", "5,5");
    container.appendChild(rect);
    const header = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    header.setAttribute("x", x);
    header.setAttribute("y", y);
    header.setAttribute("width", width);
    header.setAttribute("height", 30);
    header.setAttribute("fill", "#bbdefb");
    header.setAttribute("stroke", "#1976d2");
    header.setAttribute("stroke-width", 2);
    container.appendChild(header);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + 18);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-weight", "bold");
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
