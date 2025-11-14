export class InterfaceShape {
  constructor(config) {
    this.id = config.id || "interface";
    this.type = "interface";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", x + width / 2);
    circle.setAttribute("cy", y + 20);
    circle.setAttribute("r", 15);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", node.style?.stroke || "#000");
    circle.setAttribute("stroke-width", 2);
    container.appendChild(circle);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y + 40);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height - 40);
    rect.setAttribute("fill", node.style?.fill || "#e1bee7");
    rect.setAttribute("stroke", node.style?.stroke || "#000");
    rect.setAttribute("stroke-width", 2);
    container.appendChild(rect);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + 60);
      text.setAttribute("text-anchor", "middle");
      text.textContent = `<<interface>>`;
      container.appendChild(text);
      const text2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text2.setAttribute("x", x + width / 2);
      text2.setAttribute("y", y + 80);
      text2.setAttribute("text-anchor", "middle");
      text2.setAttribute("font-weight", "bold");
      text2.textContent = node.label;
      container.appendChild(text2);
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
