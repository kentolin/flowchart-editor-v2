/**
 * ServiceProvider.js - Dependency Injection and Service Registration
 *
 * Registers all application services with the ServiceContainer in correct dependency order.
 * Uses existing ServiceContainer.js with get() method.
 *
 * @module core/container/ServiceProvider
 * @version 5.0.0 - Uses ServiceContainer with get()
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";
import { EventBus } from "../events/EventBus.js";
import { EditorState } from "../state/EditorState.js";
import { StateManager } from "../state/StateManager.js";
import { ShapeRegistry } from "../../shapes/registry/ShapeRegistry.js";
import { Editor } from "../editor/Editor.js";
import { NodeManager } from "../managers/NodeManager.js";
import { EdgeManager } from "../managers/EdgeManager.js";

export class ServiceProvider {
  /**
   * Register all services with the container
   *
   * @param {ServiceContainer} container - DI container
   */
  static register(container) {
    const log = new DebugLogger("ServiceProvider", "#9C27B0");
    log.enter("register");

    // Validate container
    if (!container || typeof container.register !== "function") {
      log.error("register", "Invalid container - missing register() method");
      throw new Error("ServiceProvider: Invalid container provided");
    }

    log.info("register", "Starting service registration in 5 phases...");

    // ========================================================================
    // PHASE 1: Core Infrastructure (No dependencies)
    // ========================================================================
    log.info("register", "━━━ Phase 1: Core Infrastructure ━━━");

    // EventBus - No dependencies
    container.register(
      "eventBus",
      (c) => {
        log.info("register", "  [1/1] Creating EventBus...");
        const eventBus = new EventBus();
        log.info("register", "  ✓ EventBus created");
        return eventBus;
      },
      { singleton: true, description: "Global event bus for pub/sub" }
    );

    log.info("register", "✓ Phase 1 complete: EventBus");

    // ========================================================================
    // PHASE 2: State Management Layer
    // ========================================================================
    log.info("register", "━━━ Phase 2: State Management ━━━");

    // EditorState - Depends on EventBus
    container.register(
      "editorState",
      (c) => {
        log.info("register", "  [1/2] Creating EditorState...");
        const eventBus = c.get("eventBus");
        const editorState = new EditorState(eventBus);
        log.info("register", "  ✓ EditorState created (Pure Storage)");
        return editorState;
      },
      { singleton: true, description: "Low-level state storage" }
    );

    // StateManager - Depends on EditorState (wraps it)
    container.register(
      "stateManager",
      (c) => {
        log.info("register", "  [2/2] Creating StateManager...");
        const editorState = c.get("editorState");
        const stateManager = new StateManager(editorState);
        log.info(
          "register",
          "  ✓ StateManager created (Direct Manipulation API)"
        );
        return stateManager;
      },
      { singleton: true, description: "High-level state management API" }
    );

    log.info("register", "✓ Phase 2 complete: EditorState → StateManager");

    // ========================================================================
    // PHASE 3: Shape System
    // ========================================================================
    log.info("register", "━━━ Phase 3: Shape System ━━━");

    // ShapeRegistry - No dependencies
    container.register(
      "shapeRegistry",
      (c) => {
        log.info("register", "  [1/1] Creating ShapeRegistry...");
        const shapeRegistry = new ShapeRegistry();
        log.info("register", "  ✓ ShapeRegistry created");
        return shapeRegistry;
      },
      { singleton: true, description: "Registry for all shape definitions" }
    );

    log.info("register", "✓ Phase 3 complete: ShapeRegistry");

    // ========================================================================
    // PHASE 4: Editor (Canvas)
    // ========================================================================
    log.info("register", "━━━ Phase 4: Editor ━━━");

    // Editor - Depends on EventBus only
    container.register(
      "editor",
      (c) => {
        log.info("register", "  [1/1] Creating Editor...");
        const eventBus = c.get("eventBus");
        const editor = new Editor(eventBus);
        log.info("register", "  ✓ Editor created");
        return editor;
      },
      { singleton: true, description: "Main SVG canvas editor" }
    );

    log.info("register", "✓ Phase 4 complete: Editor");

    // ========================================================================
    // PHASE 5: Managers (High-level operations)
    // ========================================================================
    log.info("register", "━━━ Phase 5: Managers ━━━");

    // NodeManager - Depends on Editor, ShapeRegistry, EventBus, StateManager
    container.register(
      "nodeManager",
      (c) => {
        log.info("register", "  [1/2] Creating NodeManager...");
        const editor = c.get("editor");
        const shapeRegistry = c.get("shapeRegistry");
        const eventBus = c.get("eventBus");
        const stateManager = c.get("stateManager");

        log.info(
          "register",
          "    Dependencies: Editor, ShapeRegistry, EventBus, StateManager"
        );
        const nodeManager = new NodeManager(
          editor,
          shapeRegistry,
          eventBus,
          stateManager
        );
        log.info("register", "  ✓ NodeManager created (uses StateManager)");
        return nodeManager;
      },
      { singleton: true, description: "Manages node lifecycle and operations" }
    );

    // EdgeManager - Depends on Editor, NodeManager, EventBus, StateManager
    container.register(
      "edgeManager",
      (c) => {
        log.info("register", "  [2/2] Creating EdgeManager...");
        const editor = c.get("editor");
        const nodeManager = c.get("nodeManager");
        const eventBus = c.get("eventBus");
        const stateManager = c.get("stateManager");

        log.info(
          "register",
          "    Dependencies: Editor, NodeManager, EventBus, StateManager"
        );
        const edgeManager = new EdgeManager(
          editor,
          nodeManager,
          eventBus,
          stateManager
        );
        log.info("register", "  ✓ EdgeManager created (uses StateManager)");
        return edgeManager;
      },
      { singleton: true, description: "Manages edge lifecycle and routing" }
    );

    log.info("register", "✓ Phase 5 complete: NodeManager, EdgeManager");

    // ========================================================================
    // REGISTRATION COMPLETE
    // ========================================================================
    log.info("register", "");
    log.info("register", "✅ All services registered successfully!");
    log.info("register", "");
    log.info("register", "Architecture:");
    log.info("register", "  Phase 1: EventBus");
    log.info(
      "register",
      "  Phase 2: EditorState → StateManager (Direct Manipulation)"
    );
    log.info("register", "  Phase 3: ShapeRegistry");
    log.info("register", "  Phase 4: Editor");
    log.info(
      "register",
      "  Phase 5: NodeManager, EdgeManager (use StateManager)"
    );
    log.info("register", "");
    log.info(
      "register",
      "⚠️  CRITICAL: StateManager is the ONLY interface to state"
    );
    log.info(
      "register",
      "⚠️  Use container.get('serviceName') to retrieve services"
    );
    log.info("register", "");

    log.exit("register");
  }

  /**
   * Get all service names
   *
   * @returns {Array<string>}
   */
  static getServiceNames() {
    return [
      "eventBus",
      "editorState",
      "stateManager",
      "shapeRegistry",
      "editor",
      "nodeManager",
      "edgeManager",
    ];
  }

  /**
   * Print dependency graph
   */
  static printDependencies() {
    console.log("========== Service Dependencies ==========");
    console.log("");
    console.log("Phase 1: Core Infrastructure");
    console.log("  eventBus (no dependencies)");
    console.log("");
    console.log("Phase 2: State Management");
    console.log("  editorState → eventBus");
    console.log("  stateManager → editorState (Direct Manipulation)");
    console.log("");
    console.log("Phase 3: Shape System");
    console.log("  shapeRegistry (no dependencies)");
    console.log("");
    console.log("Phase 4: Editor");
    console.log("  editor → eventBus");
    console.log("");
    console.log("Phase 5: Managers");
    console.log(
      "  nodeManager → editor, shapeRegistry, eventBus, stateManager"
    );
    console.log("  edgeManager → editor, nodeManager, eventBus, stateManager");
    console.log("");
    console.log("⚠️  CRITICAL:");
    console.log("  - StateManager directly manipulates EditorState data");
    console.log("  - All components use StateManager, NOT EditorState");
    console.log("  - EditorState = Storage, StateManager = Operations");
    console.log("  - Use container.get('serviceName') to retrieve");
    console.log("=".repeat(42));
  }
}
