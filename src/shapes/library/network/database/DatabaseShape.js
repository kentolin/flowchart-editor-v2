export class DatabaseShape {
  constructor(config) {
    this.id = config.id || "database";
    this.type = "database";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const rx = width / 2;
    const ry = height * 0.15;
    const ellipse1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "ellipse"
    );
    ellipse1.setAttribute("cx", x + width / 2);
    ellipse1.setAttribute("cy", y + ry);
    ellipse1.setAttribute("rx", rx);
    ellipse1.setAttribute("ry", ry);
    ellipse1.setAttribute("fill", node.style?.fill || "#fff3e0");
    ellipse1.setAttribute("stroke", node.style?.stroke || "#f57c00");
    ellipse1.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(ellipse1);
    const path = `M ${x} ${y + ry} L ${x} ${y + height - ry} Q ${
      x + width / 2
    } ${y + height} ${x + width} ${y + height - ry} L ${x + width} ${y + ry}`;
    const cylinder = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    cylinder.setAttribute("d", path);
    cylinder.setAttribute("fill", node.style?.fill || "#fff3e0");
    cylinder.setAttribute("stroke", node.style?.stroke || "#f57c00");
    cylinder.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(cylinder);
    const ellipse2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "ellipse"
    );
    ellipse2.setAttribute("cx", x + width / 2);
    ellipse2.setAttribute("cy", y + height - ry);
    ellipse2.setAttribute("rx", rx);
    ellipse2.setAttribute("ry", ry);
    ellipse2.setAttribute("fill", "none");
    ellipse2.setAttribute("stroke", node.style?.stroke || "#f57c00");
    ellipse2.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(ellipse2);
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
      { id: "top", x: x + width / 2, y: y },
      { id: "right", x: x + width, y: y + height / 2 },
      { id: "bottom", x: x + width / 2, y: y + height },
      { id: "left", x: x, y: y + height / 2 },
    ];
  }
}
