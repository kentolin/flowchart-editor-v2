/**
 * CalloutShape - Speech bubble
 */
export class CalloutShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const tailHeight = height * 0.2;
    const bodyHeight = height - tailHeight;

    // Body
    const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("width", width);
    body.setAttribute("height", bodyHeight);
    body.setAttribute("rx", 5);
    body.setAttribute("ry", 5);
    body.setAttribute("fill", style.fill || "#ffffff");
    body.setAttribute("stroke", style.stroke || "#424242");
    body.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(body);

    // Tail
    const tail = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const tailX = width * 0.2;
    const d = `
      M${tailX},${bodyHeight}
      L${tailX + 10},${height}
      L${tailX + 20},${bodyHeight}
      Z
    `
      .replace(/\s+/g, " ")
      .trim();
    tail.setAttribute("d", d);
    tail.setAttribute("fill", style.fill || "#ffffff");
    tail.setAttribute("stroke", style.stroke || "#424242");
    tail.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(tail);

    return g;
  }
}

export default CalloutShape;
