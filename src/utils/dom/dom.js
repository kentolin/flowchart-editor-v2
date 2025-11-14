/**
 * dom.js - DOM manipulation utilities
 */

export class DOMUtils {
  /**
   * Create SVG element
   */
  static createSVGElement(type, attributes = {}) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      type
    );
    this.setAttributes(element, attributes);
    return element;
  }

  /**
   * Set multiple attributes on element
   */
  static setAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      }
    });
  }

  /**
   * Create element with classes and attributes
   */
  static createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.classes) {
      element.className = Array.isArray(options.classes)
        ? options.classes.join(" ")
        : options.classes;
    }

    if (options.attributes) {
      this.setAttributes(element, options.attributes);
    }

    if (options.text) {
      element.textContent = options.text;
    }

    if (options.html) {
      element.innerHTML = options.html;
    }

    if (options.style) {
      Object.assign(element.style, options.style);
    }

    return element;
  }

  /**
   * Get element position relative to viewport
   */
  static getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Get mouse position relative to element
   */
  static getMousePosition(event, element) {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  /**
   * Add event listener with automatic cleanup
   */
  static addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);

    return () => {
      element.removeEventListener(event, handler, options);
    };
  }

  /**
   * Add multiple event listeners
   */
  static addEventListeners(element, events) {
    const cleanup = [];

    Object.entries(events).forEach(([event, handler]) => {
      const remove = this.addEventListener(element, event, handler);
      cleanup.push(remove);
    });

    return () => cleanup.forEach((fn) => fn());
  }

  /**
   * Query selector with error handling
   */
  static qs(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Query selector all with error handling
   */
  static qsa(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.error(`Invalid selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Remove all children from element
   */
  static removeChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Check if element has class
   */
  static hasClass(element, className) {
    return element.classList.contains(className);
  }

  /**
   * Toggle class on element
   */
  static toggleClass(element, className, force) {
    return element.classList.toggle(className, force);
  }

  /**
   * Add classes to element
   */
  static addClasses(element, ...classes) {
    element.classList.add(...classes);
  }

  /**
   * Remove classes from element
   */
  static removeClasses(element, ...classes) {
    element.classList.remove(...classes);
  }

  /**
   * Get computed style value
   */
  static getStyle(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  /**
   * Set CSS variables
   */
  static setCSSVariables(element, variables) {
    Object.entries(variables).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }

  /**
   * Animate element
   */
  static animate(element, keyframes, options) {
    return element.animate(keyframes, options);
  }

  /**
   * Fade in element
   */
  static fadeIn(element, duration = 300) {
    element.style.opacity = "0";
    element.style.display = "block";

    return this.animate(element, [{ opacity: 0 }, { opacity: 1 }], {
      duration,
      fill: "forwards",
    });
  }

  /**
   * Fade out element
   */
  static fadeOut(element, duration = 300) {
    const animation = this.animate(element, [{ opacity: 1 }, { opacity: 0 }], {
      duration,
      fill: "forwards",
    });

    animation.onfinish = () => {
      element.style.display = "none";
    };

    return animation;
  }

  /**
   * Download file
   */
  static downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  }

  /**
   * Load image
   */
  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Debounce function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Request animation frame with fallback
   */
  static requestAnimationFrame(callback) {
    return window.requestAnimationFrame(callback);
  }

  /**
   * Cancel animation frame
   */
  static cancelAnimationFrame(id) {
    window.cancelAnimationFrame(id);
  }

  /**
   * Get viewport dimensions
   */
  static getViewportSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * Check if element is in viewport
   */
  static isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  /**
   * Scroll element into view smoothly
   */
  static scrollIntoView(element, options = {}) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      ...options,
    });
  }

  /**
   * Get scroll position
   */
  static getScrollPosition(element = window) {
    if (element === window) {
      return {
        x: window.pageXOffset,
        y: window.pageYOffset,
      };
    }
    return {
      x: element.scrollLeft,
      y: element.scrollTop,
    };
  }

  /**
   * Set scroll position
   */
  static setScrollPosition(x, y, element = window) {
    if (element === window) {
      window.scrollTo(x, y);
    } else {
      element.scrollLeft = x;
      element.scrollTop = y;
    }
  }
}
