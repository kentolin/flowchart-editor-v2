/**
 * EventBus.js - Event-Driven Communication System
 *
 * Pure event system implementing Pub/Sub (Observer) pattern.
 * Enables decoupled communication between components.
 *
 * @module core/events/EventBus
 * @version 1.0.0
 *
 * @example
 * const bus = new EventBus();
 * bus.on('node:created', (node) => console.log(node));
 * bus.emit('node:created', { id: 1, label: 'Process' });
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

/**
 * EventBus Class
 *
 * Pub/Sub event system for component communication.
 * Components can emit events and others can subscribe to them.
 * No component needs to know about other components.
 */
class EventBus {
  /**
   * Initialize the EventBus
   *
   * Creates empty listener maps for regular and one-time subscriptions.
   * Also creates event history for debugging.
   */
  constructor() {
    // Initialize debug logger
    this.log = new DebugLogger("EventBus", "#FF9800");
    this.log.enter("constructor");

    // Regular listeners: Map<eventName, Set<callback>>
    // Multiple handlers can listen to same event
    this.listeners = new Map();

    // One-time listeners: Map<eventName, Set<callback>>
    // Handler is automatically removed after first call
    this.onceListeners = new Map();

    // Event history for debugging (last 100 events)
    this.eventHistory = [];
    this.maxHistorySize = 100;

    this.log.info("constructor", "✓ EventBus initialized");
    this.log.exit("constructor");
  }

  /**
   * Subscribe to an event
   * Handler will be called every time this event is emitted
   *
   * @param {string} eventName - Name of the event (e.g., 'node:created')
   * @param {Function} callback - Handler function(data)
   * @returns {Function} Unsubscribe function - call to remove listener
   *
   * @throws {Error} If eventName is not string or callback is not function
   *
   * @example
   * const unsubscribe = eventBus.on('node:created', (node) => {
   *   console.log('Node created:', node.label);
   *   updateUI(node);
   * });
   *
   * // Later, stop listening:
   * unsubscribe();
   */
  on(eventName, callback) {
    this.log.enter("on", { eventName });

    // Validate inputs
    if (typeof eventName !== "string" || eventName.trim() === "") {
      this.log.error(
        "on",
        `eventName must be non-empty string, got ${typeof eventName}`
      );
      throw new Error(
        `EventBus.on: eventName must be non-empty string, got ${typeof eventName}`
      );
    }
    if (typeof callback !== "function") {
      this.log.error("on", `callback must be function, got ${typeof callback}`);
      throw new Error(
        `EventBus.on: callback must be function, got ${typeof callback}`
      );
    }

    // Create Set for this event if it doesn't exist
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
      this.log.info("on", `Created new listener set for '${eventName}'`);
    }

    // Add the callback to the Set
    this.listeners.get(eventName).add(callback);

    const listenerCount = this.listeners.get(eventName).size;
    this.log.info(
      "on",
      `✓ Subscribed to '${eventName}' (${listenerCount} total listeners)`
    );
    this.log.exit("on");

    // Return unsubscribe function for convenience
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event that only fires once
   * Handler is automatically removed after first emission
   *
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Handler function(data)
   * @returns {Function} Unsubscribe function
   *
   * @throws {Error} If eventName is not string or callback is not function
   *
   * @example
   * eventBus.once('app:ready', () => {
   *   console.log('Application initialized');
   *   // This will only run once, even if event fires multiple times
   * });
   */
  once(eventName, callback) {
    this.log.enter("once", { eventName });

    if (typeof eventName !== "string" || eventName.trim() === "") {
      this.log.error(
        "once",
        `eventName must be non-empty string, got ${typeof eventName}`
      );
      throw new Error(
        `EventBus.once: eventName must be non-empty string, got ${typeof eventName}`
      );
    }
    if (typeof callback !== "function") {
      this.log.error(
        "once",
        `callback must be function, got ${typeof callback}`
      );
      throw new Error(
        `EventBus.once: callback must be function, got ${typeof callback}`
      );
    }

    // Create Set for this event if it doesn't exist
    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, new Set());
      this.log.info("once", `Created new once-listener set for '${eventName}'`);
    }

    // Add the callback to the Set
    this.onceListeners.get(eventName).add(callback);

    const listenerCount = this.onceListeners.get(eventName).size;
    this.log.info(
      "once",
      `✓ Subscribed to '${eventName}' (one-time, ${listenerCount} total once-listeners)`
    );
    this.log.exit("once");

    // Return unsubscribe function
    return () => {
      if (this.onceListeners.has(eventName)) {
        this.onceListeners.get(eventName).delete(callback);
        this.log.info("once", `Unsubscribed once-listener from '${eventName}'`);
      }
    };
  }

  /**
   * Unsubscribe from an event
   * Removes a specific listener from an event
   *
   * @param {string} eventName - Name of the event
   * @param {Function} callback - The exact handler function to remove
   *
   * Note: The callback must be the exact same function reference
   *
   * @example
   * const handler = (data) => console.log(data);
   * eventBus.on('myEvent', handler);
   *
   * // Remove this specific handler
   * eventBus.off('myEvent', handler);
   */
  off(eventName, callback) {
    this.log.enter("off", { eventName });

    // Check if listeners exist for this event
    if (!this.listeners.has(eventName)) {
      this.log.warn("off", `No listeners found for event '${eventName}'`);
      this.log.exit("off");
      return;
    }

    // Get current count before removal
    const beforeCount = this.listeners.get(eventName).size;

    // Remove the callback from the Set
    this.listeners.get(eventName).delete(callback);

    const afterCount = this.listeners.get(eventName).size;

    // Clean up: if no more listeners, delete the event entry
    if (this.listeners.get(eventName).size === 0) {
      this.listeners.delete(eventName);
      this.log.info(
        "off",
        `✓ Unsubscribed from '${eventName}' and removed event (was last listener)`
      );
    } else {
      if (beforeCount > afterCount) {
        this.log.info(
          "off",
          `✓ Unsubscribed from '${eventName}' (${afterCount} remaining)`
        );
      } else {
        this.log.warn("off", `Handler not found for '${eventName}'`);
      }
    }

    this.log.exit("off");
  }

  /**
   * Emit an event
   * Calls all listeners registered for this event with provided data
   *
   * @param {string} eventName - Name of the event to emit
   * @param {*} data - Any data to pass to listeners
   * @returns {number} Number of listeners that were called
   *
   * Note: Listeners are called synchronously in order
   * If a listener throws error, others still get called
   *
   * @example
   * const count = eventBus.emit('node:created', {
   *   id: 'node_1',
   *   type: 'rect',
   *   label: 'Process'
   * });
   *
   * console.log(`${count} listeners were notified`);
   */
  emit(eventName, data) {
    this.log.enter("emit", { eventName, hasData: data !== undefined });

    let listenerCount = 0;

    // Call regular listeners
    if (this.listeners.has(eventName)) {
      // Convert Set to Array to avoid modification during iteration
      const callbacks = Array.from(this.listeners.get(eventName));

      this.log.info(
        "emit",
        `Calling ${callbacks.length} regular listener(s) for '${eventName}'`
      );

      callbacks.forEach((callback, index) => {
        try {
          callback(data);
          listenerCount++;
        } catch (error) {
          // Log error but don't crash - other listeners should still run
          this.log.error(
            "emit",
            `Error in listener #${index + 1} for '${eventName}':`,
            error
          );
          console.error(
            `EventBus: Error in listener for '${eventName}':`,
            error
          );
        }
      });
    }

    // Call one-time listeners and remove them
    if (this.onceListeners.has(eventName)) {
      const callbacks = Array.from(this.onceListeners.get(eventName));

      this.log.info(
        "emit",
        `Calling ${callbacks.length} once-listener(s) for '${eventName}'`
      );

      callbacks.forEach((callback, index) => {
        try {
          callback(data);
          listenerCount++;
          // Remove after calling once
          this.onceListeners.get(eventName).delete(callback);
        } catch (error) {
          this.log.error(
            "emit",
            `Error in once-listener #${index + 1} for '${eventName}':`,
            error
          );
          console.error(
            `EventBus: Error in once listener for '${eventName}':`,
            error
          );
        }
      });

      // Clean up: if no more once listeners, delete the event entry
      if (this.onceListeners.get(eventName).size === 0) {
        this.onceListeners.delete(eventName);
        this.log.info(
          "emit",
          `Removed once-listener set for '${eventName}' (all fired)`
        );
      }
    }

    // Store in history for debugging
    this._addToHistory(eventName, data);

    if (listenerCount === 0) {
      this.log.warn("emit", `No listeners responded to '${eventName}'`);
    } else {
      this.log.info(
        "emit",
        `✓ Event '${eventName}' emitted to ${listenerCount} listener(s)`
      );
    }

    this.log.exit("emit");
    return listenerCount;
  }

  /**
   * Check if an event has any listeners
   *
   * @param {string} eventName - Name of the event to check
   * @returns {boolean} True if there are listeners for this event
   *
   * @example
   * if (eventBus.hasListeners('node:created')) {
   *   console.log('Someone is listening for node creation');
   * }
   */
  hasListeners(eventName) {
    this.log.enter("hasListeners", { eventName });

    const hasRegular =
      this.listeners.has(eventName) && this.listeners.get(eventName).size > 0;
    const hasOnce =
      this.onceListeners.has(eventName) &&
      this.onceListeners.get(eventName).size > 0;

    const result = hasRegular || hasOnce;

    this.log.info("hasListeners", `'${eventName}' has listeners: ${result}`);
    this.log.exit("hasListeners");

    return result;
  }

  /**
   * Get the count of listeners for an event
   *
   * @param {string} eventName - Name of the event
   * @returns {number} Total number of listeners (regular + once)
   *
   * @example
   * const count = eventBus.listenerCount('node:created');
   * console.log(`${count} listeners subscribed`);
   */
  listenerCount(eventName) {
    this.log.enter("listenerCount", { eventName });

    const regular = this.listeners.get(eventName)?.size || 0;
    const once = this.onceListeners.get(eventName)?.size || 0;
    const total = regular + once;

    this.log.info(
      "listenerCount",
      `'${eventName}' has ${total} listener(s) (${regular} regular, ${once} once)`
    );
    this.log.exit("listenerCount");

    return total;
  }

  /**
   * Remove all listeners for a specific event, or all events
   *
   * @param {string} [eventName] - Event name to clear
   *                                If undefined, clears all events
   *
   * @example
   * // Clear specific event
   * eventBus.removeAllListeners('node:created');
   *
   * // Clear everything
   * eventBus.removeAllListeners();
   */
  removeAllListeners(eventName) {
    this.log.enter("removeAllListeners", { eventName: eventName || "ALL" });

    if (eventName) {
      // Clear specific event
      const regularCount = this.listeners.get(eventName)?.size || 0;
      const onceCount = this.onceListeners.get(eventName)?.size || 0;
      const total = regularCount + onceCount;

      this.listeners.delete(eventName);
      this.onceListeners.delete(eventName);

      this.log.info(
        "removeAllListeners",
        `✓ Removed ${total} listener(s) from '${eventName}'`
      );
    } else {
      // Clear all events
      const regularEvents = this.listeners.size;
      const onceEvents = this.onceListeners.size;
      const totalListeners =
        Array.from(this.listeners.values()).reduce(
          (sum, set) => sum + set.size,
          0
        ) +
        Array.from(this.onceListeners.values()).reduce(
          (sum, set) => sum + set.size,
          0
        );

      this.listeners.clear();
      this.onceListeners.clear();

      this.log.info(
        "removeAllListeners",
        `✓ Cleared all events (${
          regularEvents + onceEvents
        } event types, ${totalListeners} total listeners)`
      );
    }

    this.log.exit("removeAllListeners");
  }

  /**
   * Get all event names that have listeners
   *
   * @returns {string[]} Array of event names
   *
   * @example
   * const events = eventBus.eventNames();
   * console.log('Active events:', events);
   * // Output: ['node:created', 'node:deleted', 'selection:changed']
   */
  eventNames() {
    this.log.enter("eventNames");

    // Combine keys from both maps and remove duplicates
    const all = new Set([
      ...this.listeners.keys(),
      ...this.onceListeners.keys(),
    ]);
    const names = Array.from(all);

    this.log.info("eventNames", `Found ${names.length} active event types`);
    this.log.exit("eventNames");

    return names;
  }

  /**
   * Get event history for debugging
   * Shows last N events that were emitted
   *
   * @returns {Array} Array of recent events with timestamps
   *
   * @example
   * const history = eventBus.getHistory();
   * console.table(history);
   */
  getHistory() {
    this.log.enter("getHistory");

    const historySize = this.eventHistory.length;
    this.log.info(
      "getHistory",
      `Returning ${historySize} event(s) from history`
    );
    this.log.exit("getHistory");

    return [...this.eventHistory];
  }

  /**
   * Clear event history
   *
   * @example
   * eventBus.clearHistory();
   */
  clearHistory() {
    this.log.enter("clearHistory");

    const previousSize = this.eventHistory.length;
    this.eventHistory = [];

    this.log.info(
      "clearHistory",
      `✓ Cleared ${previousSize} event(s) from history`
    );
    this.log.exit("clearHistory");
  }

  /**
   * Get debug information about all listeners
   * Shows which events have listeners and how many
   *
   * @returns {Object} Debug info with event names and listener counts
   *
   * @example
   * console.log(eventBus.debugInfo());
   * // {
   * //   'node:created': 3,
   * //   'node:deleted': 2,
   * //   'selection:changed': 5
   * // }
   */
  debugInfo() {
    this.log.enter("debugInfo");

    const info = {};

    // Regular listeners
    for (const [eventName, listeners] of this.listeners.entries()) {
      info[eventName] = info[eventName] || 0;
      info[eventName] += listeners.size;
    }

    // Once listeners
    for (const [eventName, listeners] of this.onceListeners.entries()) {
      info[eventName] = info[eventName] || 0;
      info[eventName] += listeners.size;
    }

    this.log.info(
      "debugInfo",
      `Generated debug info for ${Object.keys(info).length} event types`
    );
    this.log.exit("debugInfo");

    return info;
  }

  /**
   * Print debug info in human-readable format
   * Shows all events and listener counts
   *
   * @example
   * eventBus.printDebugInfo();
   *
   * Output:
   * ============ EventBus Debug Info ============
   * Active Events: 3
   *
   * Events:
   *   1. node:created (3 listeners)
   *   2. node:deleted (2 listeners)
   *   3. selection:changed (5 listeners)
   * ==========================================
   */
  printDebugInfo() {
    this.log.enter("printDebugInfo");

    const info = this.debugInfo();
    const events = this.eventNames();

    console.log("============ EventBus Debug Info ============");
    console.log(`Active Events: ${events.length}`);
    console.log("");
    console.log("Events:");
    events.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name} (${info[name]} listeners)`);
    });
    console.log("==========================================");

    this.log.info("printDebugInfo", "Debug info printed to console");
    this.log.exit("printDebugInfo");
  }

  /**
   * Store event in history for debugging
   * Keeps last N events for inspection
   *
   * @private
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  _addToHistory(eventName, data) {
    this.eventHistory.push({
      timestamp: new Date().toISOString(),
      event: eventName,
      data: data,
    });

    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

// Export for use in other modules
export { EventBus };
