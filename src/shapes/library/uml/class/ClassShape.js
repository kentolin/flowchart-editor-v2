/**
 * ClassShape - UML class box with sections
 */
export class ClassShape {
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

    // Section dividers
    const section1 = height / 3;
    const section2 = (height * 2) / 3;

    const line1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line1.setAttribute("x1", 0);
    line1.setAttribute("y1", section1);
    line1.setAttribute("x2", width);
    line1.setAttribute("y2", section1);
    line1.setAttribute("stroke", style.stroke || "#424242");
    line1.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(line1);

    const line2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line2.setAttribute("x1", 0);
    line2.setAttribute("y1", section2);
    line2.setAttribute("x2", width);
    line2.setAttribute("y2", section2);
    line2.setAttribute("stroke", style.stroke || "#424242");
    line2.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(line2);

    return g;
  }
}

export default ClassShape;
