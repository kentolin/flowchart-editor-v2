/**
 * paletteSvgs.js
 * SVG definitions for shape palette icons
 */

export const paletteSvgs = {
  // Basic shapes
  "basic-rect": '<rect x="2" y="10" width="32" height="16" rx="2" ry="2"/>',
  "basic-square": '<rect x="2" y="2" width="32" height="32" rx="2" ry="2"/>',
  "basic-circle": '<circle cx="18" cy="18" r="15"/>',
  "basic-ellipse": '<ellipse cx="18" cy="18" rx="15" ry="10"/>',
  "basic-diamond": '<path d="M18 2 L34 18 L18 34 L2 18 Z"/>',
  "basic-triangle": '<path d="M18 2 L34 30 L2 30 Z"/>',
  "basic-star":
    '<path d="M18 2 L22 14 L34 14 L24 22 L28 34 L18 26 L8 34 L12 22 L2 14 L14 14 Z"/>',
  "basic-polygon": '<polygon points="18,2 32,10 32,26 18,34 4,26 4,10"/>',

  // Flowchart shapes
  "flowchart-process":
    '<rect x="2" y="10" width="32" height="16" rx="2" ry="2"/>',
  "flowchart-decision": '<path d="M18 2 L34 18 L18 34 L2 18 Z"/>',
  "flowchart-terminator": '<rect x="2" y="12" width="32" height="12" rx="6"/>',
  "flowchart-data": '<path d="M6 8 L32 8 L30 28 L4 28 Z"/>',
  "flowchart-document":
    '<path d="M4 4 L32 4 L32 28 Q 24 32 18 28 Q 12 24 4 28 Z"/>',
  "flowchart-preparation":
    '<path d="M8 10 L28 10 L32 18 L28 26 L8 26 L4 18 Z"/>',
  "flowchart-manual-input": '<path d="M2 12 L34 8 L34 28 L2 28 Z"/>',
  "flowchart-display":
    '<path d="M6 10 L30 10 Q 34 18 30 26 L6 26 Q 2 18 6 10"/>',
  "flowchart-predefined-process":
    '<rect x="2" y="10" width="32" height="16" rx="2" ry="2"/><line x1="6" y1="10" x2="6" y2="26"/><line x1="30" y1="10" x2="30" y2="26"/>',

  // Network shapes
  "network-server":
    '<rect x="8" y="4" width="20" height="28" rx="2"/><line x1="8" y1="10" x2="28" y2="10"/><line x1="8" y1="16" x2="28" y2="16"/><line x1="8" y1="22" x2="28" y2="22"/>',
  "network-database":
    '<ellipse cx="18" cy="8" rx="12" ry="4"/><path d="M6 8 L6 28 Q 6 32 18 32 Q 30 32 30 28 L30 8"/><ellipse cx="18" cy="28" rx="12" ry="4"/>',
  "network-cloud":
    '<path d="M8 20 Q 8 14 14 14 Q 14 8 20 8 Q 26 8 28 14 Q 34 14 34 20 Q 34 26 28 26 L8 26 Q 2 26 2 20 Q 2 14 8 14"/>',
  "network-router":
    '<rect x="6" y="12" width="24" height="12" rx="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="24" cy="18" r="2"/>',
  "network-firewall":
    '<rect x="6" y="8" width="24" height="20" rx="2"/><path d="M18 12 L18 24 M12 18 L24 18"/><path d="M14 14 L22 14 M14 22 L22 22"/>',
  "network-workstation":
    '<rect x="6" y="14" width="24" height="16" rx="2"/><rect x="10" y="30" width="16" height="2"/><line x1="18" y1="30" x2="18" y2="32"/>',

  // UML shapes
  "uml-class":
    '<rect x="6" y="6" width="24" height="24" rx="2"/><line x1="6" y1="14" x2="30" y2="14"/><line x1="6" y1="22" x2="30" y2="22"/>',
  "uml-actor":
    '<circle cx="18" cy="8" r="4"/><line x1="18" y1="12" x2="18" y2="22"/><line x1="10" y1="16" x2="26" y2="16"/><line x1="18" y1="22" x2="12" y2="32"/><line x1="18" y1="22" x2="24" y2="32"/>',
  "uml-component":
    '<rect x="8" y="10" width="20" height="16" rx="2"/><rect x="6" y="14" width="4" height="6"/><rect x="6" y="20" width="4" height="6"/>',
  "uml-note":
    '<path d="M6 6 L26 6 L30 10 L30 30 L6 30 Z"/><path d="M26 6 L26 10 L30 10"/>',
  "uml-package": '<path d="M6 10 L14 10 L16 6 L30 6 L30 30 L6 30 Z"/>',
  "uml-interface":
    '<circle cx="18" cy="18" r="12"/><line x1="18" y1="6" x2="18" y2="30"/><line x1="6" y1="18" x2="30" y2="18"/>',

  // Arrow shapes
  "arrow-straight": '<path d="M4 18 L28 18 L24 14 M28 18 L24 22"/>',
  "arrow-curved": '<path d="M4 24 Q 18 8 32 18 L28 16 M32 18 L28 20"/>',
  "arrow-double":
    '<path d="M4 18 L32 18 M8 14 L4 18 L8 22 M28 14 L32 18 L28 22"/>',

  // Parallelogram
  parallelogram: '<path d="M6 8 H32 L26 28 H0 Z"/>',
};

/**
 * Get SVG string for a shape type
 */
export function getPaletteSvg(type) {
  return paletteSvgs[type] || paletteSvgs["rect"];
}
