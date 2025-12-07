/**
 * FrameShape - Thick border frame
 */
export class FrameShape {
  static render(width, height, style) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", style.stroke || "#424242");
    rect.setAttribute("stroke-width", (style.strokeWidth || 2) * 3);
    rect.setAttribute("stroke-dasharray", "10,5");
    return rect;
  }
}

export default FrameShape;
