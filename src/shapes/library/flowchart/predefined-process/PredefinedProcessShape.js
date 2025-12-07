/**
 * PredefinedProcessShape - Rectangle with side lines
 */
export class PredefinedProcessShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Main rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", style.fill || "#ffffff");
    rect.setAttribute("stroke", style.stroke || "#424242");
    rect.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(rect);

    // Left line
    const leftLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    const lineOffset = width * 0.1;
    leftLine.setAttribute("x1", lineOffset);
    leftLine.setAttribute("y1", 0);
    leftLine.setAttribute("x2", lineOffset);
    leftLine.setAttribute("y2", height);
    leftLine.setAttribute("stroke", style.stroke || "#424242");
    leftLine.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(leftLine);

    // Right line
    const rightLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    rightLine.setAttribute("x1", width - lineOffset);
    rightLine.setAttribute("y1", 0);
    rightLine.setAttribute("x2", width - lineOffset);
    rightLine.setAttribute("y2", height);
    rightLine.setAttribute("stroke", style.stroke || "#424242");
    rightLine.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(rightLine);

    return g;
  }
}

export default PredefinedProcessShape;
