/**
 * StarShape.js - Star shape with configurable points
 */

export class StarShape {
  constructor(config) {
    this.id = config.id || "star";
    this.type = "star";
    this.points = config.points || 5;
    this.innerRadius = config.innerRadius || 0.4;
  }

  render(container, node) {
    const { x, y, width, height } = node;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const outerRadiusX = width / 2;
    const outerRadiusY = height / 2;
    const innerRadiusX = outerRadiusX * this.innerRadius;
    const innerRadiusY = outerRadiusY * this.innerRadius;

    const points = [];
    for (let i = 0; i < this.points * 2; i++) {
      const angle = (i * Math.PI) / this.points - Math.PI / 2;
      const isOuter = i % 2 === 0;
      const radiusX = isOuter ? outerRadiusX : innerRadiusX;
      const radiusY = isOuter ? outerRadiusY : innerRadiusY;
      const px = centerX + radiusX * Math.cos(angle);
      const py = centerY + radiusY * Math.sin(angle);
      points.push(`${px},${py}`);
    }

    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute("points", points.join(" "));
    polygon.setAttribute("fill", node.style?.fill || "#ffffff");
    polygon.setAttribute("stroke", node.style?.stroke || "#000000");
    polygon.setAttribute("stroke-width", node.style?.strokeWidth || 2);
    container.appendChild(polygon);

    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", centerX);
      text.setAttribute("y", centerY);
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
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    const points = [];
    for (let i = 0; i < this.points; i++) {
      const angle = (i * 2 * Math.PI) / this.points - Math.PI / 2;
      points.push({
        id: `port-${i}`,
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      });
    }
    return points;
  }
}
