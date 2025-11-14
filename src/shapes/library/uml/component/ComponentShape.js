export class ComponentShape {
  constructor(config) {
    this.id = config.id || "component";
    this.type = "component";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", node.style?.fill || "#c5e1a5");
    rect.setAttribute("stroke", node.style?.stroke || "#000");
    rect.setAttribute("stroke-width", 2);
    container.appendChild(rect);
    const tab = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tab.setAttribute("x", x + width - 35);
    tab.setAttribute("y", y - 10);
    tab.setAttribute("width", 30);
    tab.setAttribute("height", 10);
    tab.setAttribute("fill", node.style?.fill || "#c5e1a5");
    tab.setAttribute("stroke", node.style?.stroke || "#000");
    tab.setAttribute("stroke-width", 2);
    container.appendChild(tab);
    const tab2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tab2.setAttribute("x", x + width - 35);
    tab2.setAttribute("y", y + 5);
    tab2.setAttribute("width", 30);
    tab2.setAttribute("height", 10);
    tab2.setAttribute("fill", node.style?.fill || "#c5e1a5");
    tab2.setAttribute("stroke", node.style?.stroke || "#000");
    tab2.setAttribute("stroke-width", 2);
    container.appendChild(tab2);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height / 2);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
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
