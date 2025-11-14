export class ActorShape {
  constructor(config) {
    this.id = config.id || "actor";
    this.type = "actor";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const cx = x + width / 2;
    const cy = y + 15;
    const head = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    head.setAttribute("cx", cx);
    head.setAttribute("cy", cy);
    head.setAttribute("r", 12);
    head.setAttribute("fill", "none");
    head.setAttribute("stroke", node.style?.stroke || "#000");
    head.setAttribute("stroke-width", 2);
    container.appendChild(head);
    const body = document.createElementNS("http://www.w3.org/2000/svg", "line");
    body.setAttribute("x1", cx);
    body.setAttribute("y1", cy + 12);
    body.setAttribute("x2", cx);
    body.setAttribute("y2", y + height - 25);
    body.setAttribute("stroke", node.style?.stroke || "#000");
    body.setAttribute("stroke-width", 2);
    container.appendChild(body);
    const arms = document.createElementNS("http://www.w3.org/2000/svg", "line");
    arms.setAttribute("x1", x + 10);
    arms.setAttribute("y1", y + 40);
    arms.setAttribute("x2", x + width - 10);
    arms.setAttribute("y2", y + 40);
    arms.setAttribute("stroke", node.style?.stroke || "#000");
    arms.setAttribute("stroke-width", 2);
    container.appendChild(arms);
    const leg1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    leg1.setAttribute("x1", cx);
    leg1.setAttribute("y1", y + height - 25);
    leg1.setAttribute("x2", x + 15);
    leg1.setAttribute("y2", y + height - 5);
    leg1.setAttribute("stroke", node.style?.stroke || "#000");
    leg1.setAttribute("stroke-width", 2);
    container.appendChild(leg1);
    const leg2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    leg2.setAttribute("x1", cx);
    leg2.setAttribute("y1", y + height - 25);
    leg2.setAttribute("x2", x + width - 15);
    leg2.setAttribute("y2", y + height - 5);
    leg2.setAttribute("stroke", node.style?.stroke || "#000");
    leg2.setAttribute("stroke-width", 2);
    container.appendChild(leg2);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", cx);
      text.setAttribute("y", y + height);
      text.setAttribute("text-anchor", "middle");
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
