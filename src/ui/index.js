/**
 * ui/index.js - Barrel export for all UI components
 */

// Bars
export { MenuBar } from "./bars/MenuBar.js";
export { ToolBar } from "./bars/ToolBar.js";
export { StatusBar } from "./bars/StatusBar.js";

// Panels
export {
  LeftPalette,
  RightInspector,
  LayersPanel,
  MiniMap,
} from "./panels/Panels.js";

// Dialogs
export {
  Dialog,
  ColorPickerDialog,
  ShapePickerDialog,
  ExportDialog,
} from "./dialogs/Dialog.js";

// Overlays
export {
  ContextMenu,
  Tooltip,
  LoadingOverlay,
  Notification,
} from "./dialogs/Dialog.js";
