import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * StraightArrowShape - Right-pointing arrow
 */
export class StraightArrowShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const headWidth = width * 0.2;
    const pathData = PathGenerator.arrow(
      0,
      0,
      width,
      height,
      headWidth,
      "right"
    );
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default StraightArrowShape;
