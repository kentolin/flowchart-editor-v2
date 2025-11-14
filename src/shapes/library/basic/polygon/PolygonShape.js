/**
 * PolygonShape.js - Configurable polygon shape
 * Supports triangles, pentagons, hexagons, octagons, etc.
 */

export class PolygonShape {
  constructor(config) {
    this.id = config.id || "polygon";
    this.type = "polygon";
    this.sides = config.sides || 6;
    this.rotation = config.rotation || 0;
  }

  render(container, node) {
    const { x, y, width, height } = node;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    const points = [];
    for (let i = 0; i < this.sides; i++) {
      const angle =
        (i * 2 * Math.PI) / this.sides -
        Math.PI / 2 +
        (this.rotation * Math.PI) / 180;
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
    for (let i = 0; i < this.sides; i++) {
      const angle =
        (i * 2 * Math.PI) / this.sides -
        Math.PI / 2 +
        (this.rotation * Math.PI) / 180;
      points.push({
        id: `port-${i}`,
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      });
    }
    return points;
  }
}
