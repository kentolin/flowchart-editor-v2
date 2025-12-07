/**
 * DoubleArrowShape - Bidirectional arrow
 */
export class DoubleArrowShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const bodyHeight = height / 3;
    const headWidth = width * 0.2;
    const cy = height / 2;
    const d = `
      M0,${cy}
      L${headWidth},0
      L${headWidth},${cy - bodyHeight / 2}
      L${width - headWidth},${cy - bodyHeight / 2}
      L${width - headWidth},0
      L${width},${cy}
      L${width - headWidth},${height}
      L${width - headWidth},${cy + bodyHeight / 2}
      L${headWidth},${cy + bodyHeight / 2}
      L${headWidth},${height}
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

export default DoubleArrowShape;
