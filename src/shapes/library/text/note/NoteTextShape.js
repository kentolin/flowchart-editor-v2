export class NoteTextShape {
  constructor(config) {
    this.id = "note";
    this.type = "note";
  }
  render(container, node) {
    const { x, y, width, height } = node;
    const fold = 15;
    const path = `M ${x} ${y} L ${x + width - fold} ${y} L ${x + width} ${
      y + fold
    } L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rect.setAttribute("d", path);
    rect.setAttribute("fill", node.style?.fill || "#fff9c4");
    rect.setAttribute("stroke", node.style?.stroke || "#fbc02d");
    rect.setAttribute("stroke-width", 2);
    container.appendChild(rect);
    const foldPath = `M ${x + width - fold} ${y} L ${x + width - fold} ${
      y + fold
    } L ${x + width} ${y + fold}`;
    const foldEl = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    foldEl.setAttribute("d", foldPath);
    foldEl.setAttribute("fill", "#f9a825");
    foldEl.setAttribute("stroke", "#fbc02d");
    foldEl.setAttribute("stroke-width", 2);
    container.appendChild(foldEl);
    if (node.label) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", x + 10);
      text.setAttribute("y", y + 25);
      text.setAttribute("font-size", "14");
      text.textContent = node.label;
      container.appendChild(text);
    }
    return container;
  }
  getConnectionPoints(node) {
    const { x, y, width, height } = node;
    return [
      { id: "top", x: x + width / 2, y: y },
      { id: "right", x: x + width, y: y + height / 2 },
      { id: "bottom", x: x + width / 2, y: y + height },
      { id: "left", x: x, y: y + height / 2 },
    ];
  }
}
