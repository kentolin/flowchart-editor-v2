import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * TriangleShape - Triangle pointing up
 */
export class TriangleShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pathData = PathGenerator.triangle(0, 0, width, height, "up");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default TriangleShape;
