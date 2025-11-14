export class PackageShape {
  constructor(config) {
    this.id = config.id || "package";
    this.type = "package";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const tab = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tab.setAttribute("x", x);
    tab.setAttribute("y", y);
    tab.setAttribute("width", width * 0.4);
    tab.setAttribute("height", height * 0.2);
    tab.setAttribute("fill", node.style?.fill || "#ffccbc");
    tab.setAttribute("stroke", node.style?.stroke || "#000");
    tab.setAttribute("stroke-width", 2);
    container.appendChild(tab);
    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("x", x);
    body.setAttribute("y", y + height * 0.2);
    body.setAttribute("width", width);
    body.setAttribute("height", height * 0.8);
    body.setAttribute("fill", node.style?.fill || "#ffccbc");
    body.setAttribute("stroke", node.style?.stroke || "#000");
    body.setAttribute("stroke-width", 2);
    container.appendChild(body);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height * 0.6);
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
