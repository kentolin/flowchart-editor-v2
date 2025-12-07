/**
 * GroupShape - Dashed rectangle
 */
export class GroupShape {
  static render(width, height, style) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", style.fill || "rgba(200, 200, 200, 0.1)");
    rect.setAttribute("stroke", style.stroke || "#999999");
    rect.setAttribute("stroke-width", style.strokeWidth || 2);
    rect.setAttribute("stroke-dasharray", "5,5");
    return rect;
  }
}

export default GroupShape;
