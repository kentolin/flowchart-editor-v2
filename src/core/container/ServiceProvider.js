// Core Event System
import { EventBus } from "../events/EventBus.js";

// State Management
import { EditorState } from "../state/EditorState.js";
import { StateManager } from "../state/StateManager.js";

// Views (Rendering)
import { EditorView } from "../views/EditorView.js";
import { NodeView } from "../views/NodeView.js";
import { EdgeView } from "../views/EdgeView.js";

// Shape System
import { ShapeRegistry } from "../../shapes/registry/ShapeRegistry.js";
import { ShapeBuilder } from "../../shapes/base/ShapeBuilder.js";
import { ShapeLoader } from "../../shapes/loader/ShapeLoader.js";

// Managers (Business Logic)
import { NodeManager } from "../managers/NodeManager.js";
import { EdgeManager } from "../managers/EdgeManager.js";

// Controllers (User Interaction)
import { NodeController } from "../controllers/NodeController.js";
import { EdgeController } from "../controllers/EdgeController.js";

// Debugging & Logging
import { DebugLogger } from "../../utils/debug/DebugLogger.js";

/**
 * ServiceProvider
 *
 * Responsible for registering all services into the ServiceContainer.
 * Organizes services into phases to manage dependencies effectively.
 */

export class ServiceProvider {
  /**
   * Register all services into the provided ServiceContainer
   *
   * @static
   * @param {ServiceContainer} container - The service container to register services into
   */
  static register(container) {
    const log = new DebugLogger("ServiceProvider");

    if (!container || typeof container.register !== "function") {
      const errorMsg =
        "ServiceProvider.register: Requires valid ServiceContainer instance";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      log.stage("Starting service registration...");

      // ========================================================================
      // PHASE 1: CORE SERVICES
      // ========================================================================
      log.info("Registering Phase 1: Core Services");

      /**
       * EventBus - Central event system
       * All components communicate through this
       */
      container.register("eventBus", () => {
        log.info(" ✓ Instance created: eventBus");
        return new EventBus();
      });

      // ========================================================================
      // PHASE 2: STATE SERVICES
      // ========================================================================
      log.info("Registering Phase 2: State Services");

      /**
       * EditorState - Core state container
       */
      container.register(
        "editorState",
        (c) => {
          log.info(" ✓ Instance created: editorState");
          return new EditorState(c.get("eventBus"));
        },
        { singleton: true }
      );

      /**
       * StateManager - State coordination API
       */
      container.register(
        "stateManager",
        (c) => {
          log.info(" ✓ Instance created: stateManager");
          return new StateManager(c.get("editorState"));
        },
        { singleton: true }
      );

      // ========================================================================
      // PHASE 3: SHAPE SERVICES
      // ========================================================================
      log.info("Registering Phase 3: Shape Services");

      /**
       * ShapeRegistry - Shape definitions and factory
       */
      container.register("shapeRegistry", () => {
        log.info(" ✓ Instance created: shapeRegistry");
        return new ShapeRegistry();
      });

      /**
       * ShapeBuilder - Fluent API for shape creation
       */
      container.register(
        "shapeBuilder",
        (c) => {
          log.info(" ✓ Instance created: shapeBuilder");
          return new ShapeBuilder(c.get("shapeRegistry"));
        },
        { singleton: true }
      );

      // ========================================================================
      // PHASE 4: VIEW SERVICES
      // ========================================================================
      log.info("Registering Phase 4: View Services");

      /**
       * EditorView - Main SVG canvas and viewport
       */
      container.register(
        "editor",
        (c) => {
          log.info(" ✓ Instance created: editor (EditorView)");
          return new EditorView(c);
        },
        { singleton: true }
      );

      /**
       * NodeView - Node visual rendering
       */
      container.register(
        "nodeView",
        (c) => {
          log.info(" ✓ Instance created: nodeView");
          return new NodeView(c.get("shapeBuilder"));
        },
        { singleton: true }
      );

      /**
       * EdgeView - Edge visual rendering
       */
      container.register(
        "edgeView",
        () => {
          log.info(" ✓ Instance created: edgeView");
          return new EdgeView();
        },
        { singleton: true }
      );

      // ========================================================================
      // PHASE 5: MANAGERS
      // ========================================================================
      log.info("Registering Phase 5: Managers");

      /**
       * NodeManager - Node lifecycle management
       */
      container.register(
        "nodeManager",
        (c) => {
          log.info(" ✓ Instance created: nodeManager");
          return new NodeManager(
            c.get("editor"),
            c.get("shapeRegistry"),
            c.get("eventBus")
          );
        },
        { singleton: true }
      );

      /**
       * EdgeManager - Edge lifecycle management
       */
      container.register(
        "edgeManager",
        (c) => {
          log.info(" ✓ Instance created: edgeManager");
          return new EdgeManager(
            c.get("editor"),
            c.get("nodeManager"),
            c.get("eventBus")
          );
        },
        { singleton: true }
      );

      // ========================================================================
      // PHASE 6: CONTROLLERS
      // ========================================================================
      log.info("Registering Phase 6: Controllers");

      /**
       * NodeController - Node interaction coordination
       */
      container.register(
        "nodeController",
        (c) => {
          log.info(" ✓ Instance created: nodeController");
          return new NodeController(
            c.get("nodeManager"),
            c.get("nodeView"),
            c.get("editor"),
            c.get("stateManager"),
            c.get("eventBus")
          );
        },
        { singleton: true }
      );

      /**
       * EdgeController - Edge interaction coordination
       */
      container.register(
        "edgeController",
        (c) => {
          log.info(" ✓ Instance created: edgeController");
          return new EdgeController(
            c.get("edgeManager"),
            c.get("edgeView"),
            c.get("nodeManager"),
            c.get("editor"),
            c.get("stateManager"),
            c.get("eventBus")
          );
        },
        { singleton: true }
      );

      log.info("✅ All services registered successfully!");
      return true;
    } catch (error) {
      log.error(" ❌ Failed to register services:", error);
      throw error;
    }
  }

  /**
   * Get a list of all registered service names
   *
   * @static
   * @returns {string[]} Array of service names
   */
  static getServiceNames() {
    return [
      // Core
      "eventBus",
      // State
      "editorState",
      "stateManager",
      // Shapes
      "shapeRegistry",
      "shapeBuilder",
      // Views
      "editor",
      "nodeView",
      "edgeView",
      // Managers
      "nodeManager",
      "edgeManager",
      // Controllers
      "nodeController",
      "edgeController",
    ];
  }

  /**
   * Print the dependency graph of all services to the debug log
   *
   * @static
   */
  static printDependencies() {
    const log = new DebugLogger("ServiceProvider");

    const dependencies = {
      eventBus: {
        dependencies: [],
        phase: 1,
      },
      editorState: {
        dependencies: ["eventBus"],
        phase: 2,
      },
      stateManager: {
        dependencies: ["editorState"],
        phase: 2,
      },
      shapeRegistry: {
        dependencies: [],
        phase: 3,
      },
      shapeBuilder: {
        dependencies: ["shapeRegistry"],
        phase: 3,
      },
      editor: {
        dependencies: ["container"],
        phase: 4,
      },
      nodeView: {
        dependencies: ["shapeBuilder"],
        phase: 4,
      },
      edgeView: {
        dependencies: [],
        phase: 4,
      },
      nodeManager: {
        dependencies: ["editor", "shapeRegistry", "eventBus"],
        phase: 5,
      },
      edgeManager: {
        dependencies: ["editor", "nodeManager", "eventBus"],
        phase: 5,
      },
      nodeController: {
        dependencies: [
          "nodeManager",
          "nodeView",
          "editor",
          "stateManager",
          "eventBus",
        ],
        phase: 6,
      },
      edgeController: {
        dependencies: [
          "edgeManager",
          "edgeView",
          "nodeManager",
          "editor",
          "stateManager",
          "eventBus",
        ],
        phase: 6,
      },
    };

    log.group("Service Provider - Dependency Graph");

    for (let phase = 1; phase <= 6; phase++) {
      const services = Object.entries(dependencies).filter(
        ([_, info]) => info.phase === phase
      );
      if (services.length === 0) continue;

      log.group(`Phase ${phase}`);

      services.forEach(([name, info]) => {
        const deps =
          info.dependencies.length > 0 ? info.dependencies.join(", ") : "none";
        log.info(`  • ${name} → [${deps}]`);
      });
      log.groupEnd();
    }

    log.groupEnd();
  }
}
