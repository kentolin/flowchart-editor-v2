/**
 * DisplayShape - Curved sides rectangle
 */
export class DisplayShape {
  static render(width, height, style) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const curve = width * 0.1;
    const d = `
      M${curve},0
      L${width - curve},0
      Q${width},0 ${width},${height / 2}
      Q${width},${height} ${width - curve},${height}
      L${curve},${height}
      Q0,${height} 0,${height / 2}
      Q0,0 ${curve},0
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

export default DisplayShape;
