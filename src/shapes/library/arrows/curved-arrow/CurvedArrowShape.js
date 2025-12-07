/**
 * CurvedArrowShape - Curved arrow pointing right
 */
export class CurvedArrowShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const bodyHeight = height / 3;
    const headWidth = width * 0.2;
    const d = `
      M0,${height / 2}
      Q${width / 2},0 ${width - headWidth},${height / 2 - bodyHeight / 2}
      L${width - headWidth},0
      L${width},${height / 2}
      L${width - headWidth},${height}
      L${width - headWidth},${height / 2 + bodyHeight / 2}
      Q${width / 2},${height} 0,${height / 2}
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

export default CurvedArrowShape;
