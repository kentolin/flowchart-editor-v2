/**
 * ComponentShape - Rectangle with tabs
 */
export class ComponentShape {
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

    // Left tabs
    const tabWidth = width * 0.15;
    const tabHeight = height * 0.15;
    const tab1Y = height * 0.2;
    const tab2Y = height * 0.5;

    const tab1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tab1.setAttribute("x", -tabWidth);
    tab1.setAttribute("y", tab1Y);
    tab1.setAttribute("width", tabWidth);
    tab1.setAttribute("height", tabHeight);
    tab1.setAttribute("fill", style.fill || "#ffffff");
    tab1.setAttribute("stroke", style.stroke || "#424242");
    tab1.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(tab1);

    const tab2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tab2.setAttribute("x", -tabWidth);
    tab2.setAttribute("y", tab2Y);
    tab2.setAttribute("width", tabWidth);
    tab2.setAttribute("height", tabHeight);
    tab2.setAttribute("fill", style.fill || "#ffffff");
    tab2.setAttribute("stroke", style.stroke || "#424242");
    tab2.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(tab2);

    return g;
  }
}

export default ComponentShape;
