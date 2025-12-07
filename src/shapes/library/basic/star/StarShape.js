import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * StarShape - 5-pointed star
 */
export class StarShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadius = outerRadius * 0.4;
    const points = style.points || 5;
    const pathData = PathGenerator.star(
      cx,
      cy,
      outerRadius,
      innerRadius,
      points,
      -90
    );
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default StarShape;
