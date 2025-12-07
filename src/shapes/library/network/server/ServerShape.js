import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * ServerShape - Cylinder representing server
 */
export class ServerShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const topHeight = height * 0.15;
    const pathData = PathGenerator.cylinder(0, 0, width, height, topHeight);
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default ServerShape;
