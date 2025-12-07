/**
 * PackageShape - Rectangle with tab on top
 */
export class PackageShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const tabWidth = width * 0.3;
    const tabHeight = height * 0.15;

    // Tab
    const tab = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tab.setAttribute("width", tabWidth);
    tab.setAttribute("height", tabHeight);
    tab.setAttribute("fill", style.fill || "#ffffff");
    tab.setAttribute("stroke", style.stroke || "#424242");
    tab.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(tab);

    // Main body
    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("y", tabHeight);
    body.setAttribute("width", width);
    body.setAttribute("height", height - tabHeight);
    body.setAttribute("fill", style.fill || "#ffffff");
    body.setAttribute("stroke", style.stroke || "#424242");
    body.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(body);

    return g;
  }
}

export default PackageShape;
