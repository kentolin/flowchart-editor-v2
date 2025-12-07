import { PathGenerator } from "../../../helpers/PathGenerator.js";

/**
 * DocumentShape - Document with wavy bottom
 */
export class DocumentShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const waveHeight = height * 0.1;
    const pathData = PathGenerator.document(0, 0, width, height, waveHeight);
    path.setAttribute("d", pathData);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default DocumentShape;
