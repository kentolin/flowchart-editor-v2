/**
 * shapes/library/index.js - Barrel export for all shape libraries
 */

// Basic shapes
export {
  CircleShape,
  DiamondShape,
  EllipseShape,
  PolygonShape,
  RectShape,
  StarShape,
  TriangleShape,
} from "./basic/index.js";

// Flowchart shapes
export {
  DataShape,
  DecisionShape,
  DisplayShape,
  DocumentShape,
  ManualInputShape,
  PredefinedProcessShape,
  PreparationShape,
  ProcessShape,
  TerminatorShape,
} from "./flowchart/index.js";

// Network shapes
export {
  CloudShape,
  DatabaseShape,
  FirewallShape,
  RouterShape,
  ServerShape,
  SwitchShape,
  WorkstationShape,
} from "./network/index.js";

// UML shapes
export {
  ActorShape,
  ClassShape,
  ComponentShape,
  InterfaceShape,
  NoteShape,
  PackageShape,
} from "./uml/index.js";

// Container shapes
export { FrameShape, GroupShape, SwimlaneShape } from "./containers/index.js";

// Arrow shapes
export {
  CurvedArrowShape,
  DoubleArrowShape,
  StraightArrowShape,
} from "./arrows/index.js";

// Text shapes
export { CalloutShape, LabelShape, NoteTextShape } from "./text/index.js";
