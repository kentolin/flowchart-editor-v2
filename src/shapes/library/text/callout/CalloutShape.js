export class CalloutShape {
  constructor(config) {
    this.id = "callout";
    this.type = "callout";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const tailY = y + height + 20;
    const path = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${
      y + height
    } L ${x + width * 0.6} ${y + height} L ${x + width * 0.5} ${tailY} L ${
      x + width * 0.4
    } ${y + height} L ${x} ${y + height} Z`;
    const callout = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    callout.setAttribute("d", path);
    callout.setAttribute("fill", node.style?.fill || "#fff");
    callout.setAttribute("stroke", node.style?.stroke || "#000");
    callout.setAttribute("stroke-width", 2);
    container.appendChild(callout);
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
      { id: "bottom", x: x + width / 2, y: y + height + 20 },
      { id: "left", x: x, y: y + height / 2 },
    ];
  }
}
