export class FrameShape {
  constructor(config) {
    this.id = "frame";
    this.type = "frame";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", node.style?.stroke || "#000");
    rect.setAttribute("stroke-width", 3);
    container.appendChild(rect);
    const tab = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tab.setAttribute("x", x);
    tab.setAttribute("y", y);
    tab.setAttribute("width", 60);
    tab.setAttribute("height", 25);
    tab.setAttribute("fill", node.style?.fill || "#fff");
    tab.setAttribute("stroke", node.style?.stroke || "#000");
    tab.setAttribute("stroke-width", 3);
    container.appendChild(tab);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + 30);
      text.setAttribute("y", y + 17);
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
