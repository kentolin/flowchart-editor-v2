/**
 * ServiceProvider.js - Service Registration & Dependency Injection Setup
 *
 * Centralized service provider that registers all application services
 * into the DI container. This separates service registration from
 * application logic.
 *
 * ⚠️ IMPORTANT: ALL IMPORTS MUST BE HERE
 * Add all class imports at the top of this file, not in ServiceContainer or main.js
 *
 * @module core/container/ServiceProvider
 * @version 1.0.0
 *
 * @example
 * import { ServiceContainer } from './ServiceContainer.js';
 * import { ServiceProvider } from './ServiceProvider.js';
 *
 * const container = new ServiceContainer();
 * ServiceProvider.register(container);
 * const eventBus = container.get('eventBus');
 */

// ============================================================================
// ALL IMPORTS - Services, Managers, Views, Controllers
// ============================================================================
// This is the ONLY place where imports should be!

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
import { ShapeBuilder } from "../../shapes/builder/ShapeBuilder.js";

// Managers (Business Logic)
import { NodeManager } from "../managers/NodeManager.js";
import { EdgeManager } from "../managers/EdgeManager.js";

// Controllers (User Interaction)
import { NodeController } from "../controllers/NodeController.js";
import { EdgeController } from "../controllers/EdgeController.js";

// ============================================================================
// ServiceProvider Class
// ============================================================================

/**
 * ServiceProvider Class
 *
 * Static class for registering services with the dependency container.
 * All service registration logic centralized here.
 */
class ServiceProvider {
  /**
   * Register all services with the container
   *
   * Services are registered in dependency order:
   * 1. Core services (no dependencies)
   * 2. State services (depend on core)
   * 3. Shape services (no dependencies)
   * 4. View services (depend on shapes)
   * 5. Managers (depend on views and core)
   * 6. Controllers (depend on managers)
   *
   * @static
   * @param {ServiceContainer} container - Service container
   *
   * @throws {Error} If container is invalid
   *
   * @example
   * const container = new ServiceContainer();
   * ServiceProvider.register(container);
   * console.log('Services registered:', container.getServiceNames());
   */
  static register(container) {
    if (!container || typeof container.register !== "function") {
      throw new Error(
        "ServiceProvider.register: Requires valid ServiceContainer instance"
      );
    }

    try {
      console.log(
        "%c[ServiceProvider] Starting service registration...",
        "color: #0066cc; font-weight: bold"
      );

      // ========================================================================
      // PHASE 1: CORE SERVICES
      // These have NO dependencies
      // ========================================================================

      /**
       * EventBus - Central event system
       * All components communicate through this
       */
      container.register("eventBus", () => {
        console.log("%c  ✓ Registered: eventBus", "color: #00aa00");
        return new EventBus();
      });

      // ========================================================================
      // PHASE 2: STATE SERVICES
      // These depend on: eventBus
      // ========================================================================

      /**
       * EditorState - Core state container
       * Holds all editor state
       */
      container.register(
        "editorState",
        (c) => {
          console.log("%c  ✓ Registered: editorState", "color: #00aa00");
          return new EditorState(c.get("eventBus"));
        },
        { singleton: true }
      );

      /**
       * StateManager - State coordination API
       * High-level API for state operations
       */
      container.register(
        "stateManager",
        (c) => {
          console.log("%c  ✓ Registered: stateManager", "color: #00aa00");
          return new StateManager(c.get("editorState"));
        },
        { singleton: true }
      );

      // ========================================================================
      // PHASE 3: SHAPE SERVICES
      // These have NO dependencies
      // ========================================================================

      /**
       * ShapeRegistry - Shape definitions and factory
       * All available shapes registered here
       */
      container.register("shapeRegistry", () => {
        console.log("%c  ✓ Registered: shapeRegistry", "color: #00aa00");
        return new ShapeRegistry();
      });

      /**
       * ShapeBuilder - Fluent API for shape creation
       * Depends on: shapeRegistry
       */
      container.register(
        "shapeBuilder",
        (c) => {
          console.log("%c  ✓ Registered: shapeBuilder", "color: #00aa00");
          return new ShapeBuilder(c.get("shapeRegistry"));
        },
        { singleton: true }
      );

      // ========================================================================
      // PHASE 4: VIEW SERVICES
      // These depend on: shapeBuilder
      // ========================================================================

      /**
       * EditorView - Main SVG canvas and viewport
       * Root view for all rendering
       */
      container.register(
        "editor",
        (c) => {
          console.log(
            "%c  ✓ Registered: editor (EditorView)",
            "color: #00aa00"
          );
          return new EditorView(c);
        },
        { singleton: true }
      );

      /**
       * NodeView - Node visual rendering
       * Renders node shapes
       */
      container.register(
        "nodeView",
        (c) => {
          console.log("%c  ✓ Registered: nodeView", "color: #00aa00");
          return new NodeView(c.get("shapeBuilder"));
        },
        { singleton: true }
      );

      /**
       * EdgeView - Edge visual rendering
       * Renders connections between nodes
       */
      container.register(
        "edgeView",
        () => {
          console.log("%c  ✓ Registered: edgeView", "color: #00aa00");
          return new EdgeView();
        },
        { singleton: true }
      );

      // ========================================================================
      // PHASE 5: MANAGERS
      // These depend on: views, shapeRegistry, eventBus
      // ========================================================================

      /**
       * NodeManager - Node lifecycle management
       * Manages node creation, deletion, updates
       */
      container.register(
        "nodeManager",
        (c) => {
          console.log("%c  ✓ Registered: nodeManager", "color: #00aa00");
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
       * Manages edge creation, deletion, updates
       */
      container.register(
        "edgeManager",
        (c) => {
          console.log("%c  ✓ Registered: edgeManager", "color: #00aa00");
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
      // These depend on: managers, views, stateManager, eventBus
      // ========================================================================

      /**
       * NodeController - Node interaction coordination
       * Handles user interactions with nodes
       */
      container.register(
        "nodeController",
        (c) => {
          console.log("%c  ✓ Registered: nodeController", "color: #00aa00");
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
       * Handles user interactions with edges
       */
      container.register(
        "edgeController",
        (c) => {
          console.log("%c  ✓ Registered: edgeController", "color: #00aa00");
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

      console.log(
        "%c[ServiceProvider] ✅ All services registered successfully!",
        "color: #00aa00; font-weight: bold"
      );
      return true;
    } catch (error) {
      console.error(
        "%c[ServiceProvider] ❌ Failed to register services:",
        "color: #cc0000; font-weight: bold",
        error
      );
      throw error;
    }
  }

  /**
   * Get list of all service names that should be registered
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
   * Print service dependency information
   *
   * @static
   */
  static printDependencies() {
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

    console.group(
      "%cService Provider - Dependency Graph",
      "color: #0066cc; font-weight: bold"
    );

    for (let phase = 1; phase <= 6; phase++) {
      const services = Object.entries(dependencies).filter(
        ([_, info]) => info.phase === phase
      );
      if (services.length === 0) continue;

      console.group(`%cPhase ${phase}`, "color: #00aa00; font-weight: bold");
      services.forEach(([name, info]) => {
        const deps =
          info.dependencies.length > 0 ? info.dependencies.join(", ") : "none";
        console.log(`  • ${name} → [${deps}]`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ServiceProvider };
