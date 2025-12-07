/**
 * WorkstationShape - Monitor shape
 */
export class WorkstationShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Monitor screen
    const screenHeight = height * 0.7;
    const screen = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    screen.setAttribute("width", width);
    screen.setAttribute("height", screenHeight);
    screen.setAttribute("fill", style.fill || "#ffffff");
    screen.setAttribute("stroke", style.stroke || "#424242");
    screen.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(screen);

    // Stand
    const standWidth = width * 0.4;
    const standHeight = height - screenHeight;
    const stand = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    stand.setAttribute("x", (width - standWidth) / 2);
    stand.setAttribute("y", screenHeight);
    stand.setAttribute("width", standWidth);
    stand.setAttribute("height", standHeight);
    stand.setAttribute("fill", style.fill || "#ffffff");
    stand.setAttribute("stroke", style.stroke || "#424242");
    stand.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(stand);

    return g;
  }
}

export default WorkstationShape;
