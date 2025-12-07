/**
 * SwimlaneShape - Rectangle with header
 */
export class SwimlaneShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Main rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", style.fill || "#f5f5f5");
    rect.setAttribute("stroke", style.stroke || "#424242");
    rect.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(rect);

    // Header
    const headerHeight = height * 0.15;
    const header = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    header.setAttribute("width", width);
    header.setAttribute("height", headerHeight);
    header.setAttribute("fill", style.stroke || "#424242");
    header.setAttribute("fill-opacity", "0.1");
    g.appendChild(header);

    return g;
  }
}

export default SwimlaneShape;
