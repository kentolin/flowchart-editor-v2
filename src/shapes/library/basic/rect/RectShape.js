/**
 * RectShape - Rectangle shape
 * Simple rectangle with optional rounded corners
 */
export class RectShape {
  /**
   * Render rectangle
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {Object} style - Style object {fill, stroke, strokeWidth}
   * @returns {SVGElement} - Rect SVG element
   */
  static render(width, height, style) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", style.fill || "#ffffff");
    rect.setAttribute("stroke", style.stroke || "#424242");
    rect.setAttribute("stroke-width", style.strokeWidth || 2);
    rect.setAttribute("rx", style.cornerRadius || 0);
    rect.setAttribute("ry", style.cornerRadius || 0);
    return rect;
  }
}

export default RectShape;
