import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * DecisionShape - Diamond for decision nodes
 */
export class DecisionShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pathData = PathGenerator.diamond(0, 0, width, height);
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default DecisionShape;
