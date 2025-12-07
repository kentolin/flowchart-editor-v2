/**
 * TerminatorShape - Rounded rectangle for start/end
 */
export class TerminatorShape {
  static render(width, height, style) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const radius = height / 2;
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", radius);
    rect.setAttribute("ry", radius);
    rect.setAttribute("fill", style.fill || "#ffffff");
    rect.setAttribute("stroke", style.stroke || "#424242");
    rect.setAttribute("stroke-width", style.strokeWidth || 2);
    return rect;
  }
}

export default TerminatorShape;
