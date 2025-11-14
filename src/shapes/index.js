/**
 * shapes/index.js - Export all shapes
 *
 * @module shapes/index
 */

// Shape categories
export const SHAPE_CATEGORIES = {
  BASIC: "basic",
  FLOWCHART: "flowchart",
  NETWORK: "network",
  UML: "uml",
  CONTAINER: "container",
  ARROWS: "arrows",
  TEXT: "text",
};

// Shape registry helper
export function getAllShapeClasses() {
  return {
    // Basic
    circle: CircleShape,
    diamond: DiamondShape,
    ellipse: EllipseShape,
    polygon: PolygonShape,
    rect: RectShape,
    star: StarShape,
    triangle: TriangleShape,

    // Flowchart
    data: DataShape,
    decision: DecisionShape,
    display: DisplayShape,
    document: DocumentShape,
    "manual-input": ManualInputShape,
    "predefined-process": PredefinedProcessShape,
    preparation: PreparationShape,
    process: ProcessShape,
    terminator: TerminatorShape,

    // Network
    cloud: CloudShape,
    database: DatabaseShape,
    firewall: FirewallShape,
    router: RouterShape,
    server: ServerShape,
    switch: SwitchShape,
    workstation: WorkstationShape,

    // UML
    actor: ActorShape,
    class: ClassShape,
    component: ComponentShape,
    interface: InterfaceShape,
    note: NoteShape,
    package: PackageShape,

    // Container
    frame: FrameShape,
    group: GroupShape,
    swimlane: SwimlaneShape,

    // Arrows
    "curved-arrow": CurvedArrowShape,
    "double-arrow": DoubleArrowShape,
    "straight-arrow": StraightArrowShape,

    // Text
    callout: CalloutShape,
    label: LabelShape,
    "note-text": NoteTextShape,
  };
}

import {
  CircleShape,
  DiamondShape,
  EllipseShape,
  PolygonShape,
  RectShape,
  StarShape,
  TriangleShape,
} from "./library/index.js";

import {
  DataShape,
  DecisionShape,
  DisplayShape,
  DocumentShape,
  ManualInputShape,
  PredefinedProcessShape,
  PreparationShape,
  ProcessShape,
  TerminatorShape,
} from "./library/index.js";

import {
  CloudShape,
  DatabaseShape,
  FirewallShape,
  RouterShape,
  ServerShape,
  SwitchShape,
  WorkstationShape,
} from "./library/index.js";

import {
  ActorShape,
  ClassShape,
  ComponentShape,
  InterfaceShape,
  NoteShape,
  PackageShape,
} from "./library/index.js";

import { FrameShape, GroupShape, SwimlaneShape } from "./library/index.js";

import {
  CurvedArrowShape,
  DoubleArrowShape,
  StraightArrowShape,
} from "./library/index.js";

import { CalloutShape, LabelShape, NoteTextShape } from "./library/index.js";
