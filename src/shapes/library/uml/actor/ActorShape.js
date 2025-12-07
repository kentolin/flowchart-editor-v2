/**
 * ActorShape - Stick figure
 */
export class ActorShape {
  static render(width, height, style) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const cx = width / 2;
    const headRadius = Math.min(width, height) * 0.15;
    const bodyStart = headRadius * 2.5;
    const bodyEnd = height * 0.6;
    const armY = height * 0.4;
    const legEnd = height;

    // Head
    const head = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    head.setAttribute("cx", cx);
    head.setAttribute("cy", headRadius);
    head.setAttribute("r", headRadius);
    head.setAttribute("fill", "none");
    head.setAttribute("stroke", style.stroke || "#424242");
    head.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(head);

    // Body
    const body = document.createElementNS("http://www.w3.org/2000/svg", "line");
    body.setAttribute("x1", cx);
    body.setAttribute("y1", bodyStart);
    body.setAttribute("x2", cx);
    body.setAttribute("y2", bodyEnd);
    body.setAttribute("stroke", style.stroke || "#424242");
    body.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(body);

    // Arms
    const arms = document.createElementNS("http://www.w3.org/2000/svg", "line");
    arms.setAttribute("x1", 0);
    arms.setAttribute("y1", armY);
    arms.setAttribute("x2", width);
    arms.setAttribute("y2", armY);
    arms.setAttribute("stroke", style.stroke || "#424242");
    arms.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(arms);

    // Left leg
    const leftLeg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    leftLeg.setAttribute("x1", cx);
    leftLeg.setAttribute("y1", bodyEnd);
    leftLeg.setAttribute("x2", width * 0.2);
    leftLeg.setAttribute("y2", legEnd);
    leftLeg.setAttribute("stroke", style.stroke || "#424242");
    leftLeg.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(leftLeg);

    // Right leg
    const rightLeg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    rightLeg.setAttribute("x1", cx);
    rightLeg.setAttribute("y1", bodyEnd);
    rightLeg.setAttribute("x2", width * 0.8);
    rightLeg.setAttribute("y2", legEnd);
    rightLeg.setAttribute("stroke", style.stroke || "#424242");
    rightLeg.setAttribute("stroke-width", style.strokeWidth || 2);
    g.appendChild(rightLeg);

    return g;
  }
}

export default ActorShape;
