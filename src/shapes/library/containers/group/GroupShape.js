export class GroupShape {
  constructor(config) {
    this.id = "group";
    this.type = "group";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", node.style?.fill || "#f5f5f5");
    rect.setAttribute("stroke", node.style?.stroke || "#9e9e9e");
    rect.setAttribute("stroke-width", 2);
    rect.setAttribute("rx", 8);
    container.appendChild(rect);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + 10);
      text.setAttribute("y", y + 20);
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
