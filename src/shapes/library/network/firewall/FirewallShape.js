/**
 * FirewallShape - Brick pattern rectangle
 */
export class FirewallShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Background rect
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", style.fill || "#ffffff");
    rect.setAttribute("stroke", style.stroke || "#424242");
    rect.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(rect);

    // Brick pattern
    const rows = 4;
    const rowHeight = height / rows;
    for (let i = 1; i < rows; i++) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", 0);
      line.setAttribute("y1", i * rowHeight);
      line.setAttribute("x2", width);
      line.setAttribute("y2", i * rowHeight);
      line.setAttribute("stroke", style.stroke || "#424242");
      line.setAttribute("stroke-width", 1);
      g.appendChild(line);
    }

    return g;
  }
}

export default FirewallShape;
