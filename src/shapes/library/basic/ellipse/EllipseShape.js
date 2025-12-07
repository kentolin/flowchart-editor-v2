/**
 * EllipseShape - Ellipse shape
 */
export class EllipseShape {
  static render(width, height, style) {
    const ellipse = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "ellipse"
    );
    ellipse.setAttribute("cx", width / 2);
    ellipse.setAttribute("cy", height / 2);
    ellipse.setAttribute("rx", width / 2);
    ellipse.setAttribute("ry", height / 2);
    ellipse.setAttribute("fill", style.fill || "#ffffff");
    ellipse.setAttribute("stroke", style.stroke || "#424242");
    ellipse.setAttribute("stroke-width", style.strokeWidth || 2);
    return ellipse;
  }
}

export default EllipseShape;
