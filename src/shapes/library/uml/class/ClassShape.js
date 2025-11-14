export class ClassShape {
  constructor(config) {
    this.id = config.id || "class";
    this.type = "class";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", node.style?.fill || "#fff9c4");
    rect.setAttribute("stroke", node.style?.stroke || "#000");
    rect.setAttribute("stroke-width", 2);
    container.appendChild(rect);
    const line1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line1.setAttribute("x1", x);
    line1.setAttribute("y1", y + height / 3);
    line1.setAttribute("x2", x + width);
    line1.setAttribute("y2", y + height / 3);
    line1.setAttribute("stroke", "#000");
    line1.setAttribute("stroke-width", 2);
    container.appendChild(line1);
    const line2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line2.setAttribute("x1", x);
    line2.setAttribute("y1", y + (height * 2) / 3);
    line2.setAttribute("x2", x + width);
    line2.setAttribute("y2", y + (height * 2) / 3);
    line2.setAttribute("stroke", "#000");
    line2.setAttribute("stroke-width", 2);
    container.appendChild(line2);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height / 6);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
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
