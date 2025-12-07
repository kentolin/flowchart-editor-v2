/**
 * NoteTextShape - Note with folded corner
 */
export class NoteTextShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const foldSize = Math.min(width, height) * 0.15;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `
      M0,0
      L${width - foldSize},0
      L${width},${foldSize}
      L${width},${height}
      L0,${height}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
    path.setAttribute("d", d);
    path.setAttribute("fill", style.fill || "#ffffcc");
    path.setAttribute("stroke", style.stroke || "#e0e0e0");
    path.setAttribute("stroke-width", style.strokeWidth || 1);
    g.appendChild(path);

    const fold = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const foldPath = `M${width - foldSize},0 L${
      width - foldSize
    },${foldSize} L${width},${foldSize}`;
    fold.setAttribute("d", foldPath);
    fold.setAttribute("fill", "none");
    fold.setAttribute("stroke", style.stroke || "#e0e0e0");
    fold.setAttribute("stroke-width", style.strokeWidth || 1);
    g.appendChild(fold);

    return g;
  }
}

export default NoteTextShape;
