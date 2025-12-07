import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * PolygonShape - Regular polygon (hexagon by default)
 */
export class PolygonShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2;
    const sides = style.sides || 6;
    const pathData = PathGenerator.polygon(cx, cy, radius, sides, 0);
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default PolygonShape;
