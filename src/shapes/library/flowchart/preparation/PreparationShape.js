/**
 * PreparationShape - Hexagon
 */
export class PreparationShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const offset = width * 0.15;
    const d = `
      M${offset},0
      L${width - offset},0
      L${width},${height / 2}
      L${width - offset},${height}
      L${offset},${height}
      L0,${height / 2}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
    path.setAttribute("d", d);
    path.setAttribute("fill", style.fill || "#ffffff");
    path.setAttribute("stroke", style.stroke || "#424242");
    path.setAttribute("stroke-width", style.strokeWidth || 2);
    return path;
  }
}

export default PreparationShape;
