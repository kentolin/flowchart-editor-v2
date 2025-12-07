/**
 * SwitchShape - Rectangle with ports
 */
export class SwitchShape {
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

    // Bottom ports
    const portCount = 4;
    const portSpacing = width / (portCount + 1);
    const portSize = 4;
    for (let i = 1; i <= portCount; i++) {
      const port = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      port.setAttribute("x", i * portSpacing - portSize / 2);
      port.setAttribute("y", height - portSize - 2);
      port.setAttribute("width", portSize);
      port.setAttribute("height", portSize);
      port.setAttribute("fill", style.stroke || "#424242");
      g.appendChild(port);
    }

    return g;
  }
}

export default SwitchShape;
