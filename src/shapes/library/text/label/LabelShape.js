/**
 * LabelShape - Simple text container
 */
export class LabelShape {
  static render(width, height, style) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", "none");
    return rect;
  }
}

export default LabelShape;
