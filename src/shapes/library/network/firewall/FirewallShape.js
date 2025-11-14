export class FirewallShape {
  constructor(config) {
    this.id = config.id || "firewall";
    this.type = "firewall";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", node.style?.fill || "#ffebee");
    rect.setAttribute("stroke", node.style?.stroke || "#d32f2f");
    rect.setAttribute("stroke-width", node.style?.strokeWidth || 3);
    container.appendChild(rect);
    const path = `M ${x + width / 2 - 15} ${y + height / 2 + 10} L ${
      x + width / 2
    } ${y + height / 2 - 15} L ${x + width / 2 + 15} ${y + height / 2 + 10}`;
    const flame = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    flame.setAttribute("d", path);
    flame.setAttribute("fill", "none");
    flame.setAttribute("stroke", "#ff5722");
    flame.setAttribute("stroke-width", 3);
    container.appendChild(flame);
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
