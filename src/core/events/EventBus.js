/**
 * EventBus.js - Event-Driven Communication System
 *
 * Pure event system implementing Pub/Sub (Observer) pattern.
 * Enables decoupled communication between components.
 *
 * NO DEPENDENCIES - This is the foundation!
 *
 * @module core/events/EventBus
 * @version 1.0.0
 *
 * @example
 * const bus = new EventBus();
 * bus.on('node:created', (node) => console.log(node));
 * bus.emit('node:created', { id: 1, label: 'Process' });
 */

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
    // Regular listeners: Map<eventName, Set<callback>>
    // Multiple handlers can listen to same event
    this.listeners = new Map();

    // One-time listeners: Map<eventName, Set<callback>>
    // Handler is automatically removed after first call
    this.onceListeners = new Map();

    // Event history for debugging (last 100 events)
    this.eventHistory = [];
    this.maxHistorySize = 100;
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
    // Validate inputs
    if (typeof eventName !== "string" || eventName.trim() === "") {
      throw new Error(
        `EventBus.on: eventName must be non-empty string, got ${typeof eventName}`
      );
    }
    if (typeof callback !== "function") {
      throw new Error(
        `EventBus.on: callback must be function, got ${typeof callback}`
      );
    }

    // Create Set for this event if it doesn't exist
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    // Add the callback to the Set
    this.listeners.get(eventName).add(callback);

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
    if (typeof eventName !== "string" || eventName.trim() === "") {
      throw new Error(
        `EventBus.once: eventName must be non-empty string, got ${typeof eventName}`
      );
    }
    if (typeof callback !== "function") {
      throw new Error(
        `EventBus.once: callback must be function, got ${typeof callback}`
      );
    }

    // Create Set for this event if it doesn't exist
    if (!this.onceListeners.has(eventName)) {
      this.onceListeners.set(eventName, new Set());
    }

    // Add the callback to the Set
    this.onceListeners.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.onceListeners.has(eventName)) {
        this.onceListeners.get(eventName).delete(callback);
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
    // Check if listeners exist for this event
    if (!this.listeners.has(eventName)) {
      return;
    }

    // Remove the callback from the Set
    this.listeners.get(eventName).delete(callback);

    // Clean up: if no more listeners, delete the event entry
    if (this.listeners.get(eventName).size === 0) {
      this.listeners.delete(eventName);
    }
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
    let listenerCount = 0;

    // Call regular listeners
    if (this.listeners.has(eventName)) {
      // Convert Set to Array to avoid modification during iteration
      const callbacks = Array.from(this.listeners.get(eventName));

      callbacks.forEach((callback) => {
        try {
          callback(data);
          listenerCount++;
        } catch (error) {
          // Log error but don't crash - other listeners should still run
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

      callbacks.forEach((callback) => {
        try {
          callback(data);
          listenerCount++;
          // Remove after calling once
          this.onceListeners.get(eventName).delete(callback);
        } catch (error) {
          console.error(
            `EventBus: Error in once listener for '${eventName}':`,
            error
          );
        }
      });

      // Clean up: if no more once listeners, delete the event entry
      if (this.onceListeners.get(eventName).size === 0) {
        this.onceListeners.delete(eventName);
      }
    }

    // Store in history for debugging
    this._addToHistory(eventName, data);

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
    const hasRegular =
      this.listeners.has(eventName) && this.listeners.get(eventName).size > 0;
    const hasOnce =
      this.onceListeners.has(eventName) &&
      this.onceListeners.get(eventName).size > 0;
    return hasRegular || hasOnce;
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
    const regular = this.listeners.get(eventName)?.size || 0;
    const once = this.onceListeners.get(eventName)?.size || 0;
    return regular + once;
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
    if (eventName) {
      // Clear specific event
      this.listeners.delete(eventName);
      this.onceListeners.delete(eventName);
    } else {
      // Clear all events
      this.listeners.clear();
      this.onceListeners.clear();
    }
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
    // Combine keys from both maps and remove duplicates
    const all = new Set([
      ...this.listeners.keys(),
      ...this.onceListeners.keys(),
    ]);
    return Array.from(all);
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
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   *
   * @example
   * eventBus.clearHistory();
   */
  clearHistory() {
    this.eventHistory = [];
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
