export class WorkstationShape {
  constructor(config) {
    this.id = config.id || "workstation";
    this.type = "workstation";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const monitor = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    monitor.setAttribute("x", x + width * 0.1);
    monitor.setAttribute("y", y);
    monitor.setAttribute("width", width * 0.8);
    monitor.setAttribute("height", height * 0.7);
    monitor.setAttribute("fill", node.style?.fill || "#e8eaf6");
    monitor.setAttribute("stroke", node.style?.stroke || "#3f51b5");
    monitor.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    monitor.setAttribute("rx", 5);
    container.appendChild(monitor);
    const stand = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    stand.setAttribute("x", x + width * 0.4);
    stand.setAttribute("y", y + height * 0.7);
    stand.setAttribute("width", width * 0.2);
    stand.setAttribute("height", height * 0.15);
    stand.setAttribute("fill", node.style?.stroke || "#3f51b5");
    container.appendChild(stand);
    const base = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    base.setAttribute("x", x + width * 0.2);
    base.setAttribute("y", y + height * 0.85);
    base.setAttribute("width", width * 0.6);
    base.setAttribute("height", height * 0.08);
    base.setAttribute("fill", node.style?.stroke || "#3f51b5");
    base.setAttribute("rx", 3);
    container.appendChild(base);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height * 0.35);
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
