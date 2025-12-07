/**
 * CircleShape - Circle shape
 */
export class CircleShape {
  static render(width, height, style) {
    const radius = Math.min(width, height) / 2;
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", width / 2);
    circle.setAttribute("cy", height / 2);
    circle.setAttribute("r", radius);
    circle.setAttribute("fill", style.fill || "#ffffff");
    circle.setAttribute("stroke", style.stroke || "#424242");
    circle.setAttribute("stroke-width", style.strokeWidth || 2);
    return circle;
  }
}

export default CircleShape;
