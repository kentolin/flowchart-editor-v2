/**
 * RouterShape - Rectangle with corner cuts
 */
export class RouterShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const cut = Math.min(width, height) * 0.1;
    const d = `
      M${cut},0
      L${width - cut},0
      L${width},${cut}
      L${width},${height - cut}
      L${width - cut},${height}
      L${cut},${height}
      L0,${height - cut}
      L0,${cut}
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

export default RouterShape;
