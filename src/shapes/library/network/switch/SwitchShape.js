export class SwitchShape {
  constructor(config) {
    this.id = config.id || "switch";
    this.type = "switch";
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
    rect.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(rect);
    for (let i = 0; i < 4; i++) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", x + 20 + i * 20);
      circle.setAttribute("cy", y + height / 2);
      circle.setAttribute("r", 4);
      circle.setAttribute("fill", "#4caf50");
      container.appendChild(circle);
    }
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height + 15);
      text.setAttribute("text-anchor", "middle");
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
