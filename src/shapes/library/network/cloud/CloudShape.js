export class CloudShape {
  constructor(config) {
    this.id = config.id || "cloud";
    this.type = "cloud";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const path = `M ${x + width * 0.3} ${y + height * 0.6} Q ${x} ${
      y + height * 0.6
    } ${x + width * 0.15} ${y + height * 0.3} Q ${x + width * 0.15} ${y} ${
      x + width * 0.4
    } ${y + height * 0.2} Q ${x + width * 0.6} ${y} ${x + width * 0.75} ${
      y + height * 0.2
    } Q ${x + width} ${y + height * 0.2} ${x + width * 0.85} ${
      y + height * 0.5
    } Q ${x + width} ${y + height * 0.8} ${x + width * 0.7} ${
      y + height * 0.8
    } L ${x + width * 0.3} ${y + height * 0.8} Q ${x + width * 0.1} ${
      y + height * 0.8
    } ${x + width * 0.3} ${y + height * 0.6} Z`;
    const cloudPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    cloudPath.setAttribute("d", path);
    cloudPath.setAttribute("fill", node.style?.fill || "#e1f5fe");
    cloudPath.setAttribute("stroke", node.style?.stroke || "#0288d1");
    cloudPath.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(cloudPath);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + width / 2);
      text.setAttribute("y", y + height / 2);
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
      { id: "top", x: x + width / 2, y: y + height * 0.2 },
      { id: "right", x: x + width * 0.85, y: y + height / 2 },
      { id: "bottom", x: x + width / 2, y: y + height * 0.8 },
      { id: "left", x: x + width * 0.15, y: y + height / 2 },
    ];
  }
}
