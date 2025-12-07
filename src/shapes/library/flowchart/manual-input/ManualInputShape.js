import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * ManualInputShape - Trapezoid
 */
export class ManualInputShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const topOffset = width * 0.2;
    const pathData = PathGenerator.trapezoid(0, 0, width, height, topOffset);
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default ManualInputShape;
