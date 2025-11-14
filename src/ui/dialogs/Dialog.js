/**
 * UI Dialogs and Overlays
 */

/**
 * Modal Dialog Base Class
 */
export class Dialog {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.overlay = null;
    this.dialog = null;
    this.isOpen = false;
  }

  open() {
    if (this.isOpen) return;

    this.overlay = document.createElement("div");
    this.overlay.className = "dialog-overlay";

    this.dialog = document.createElement("div");
    this.dialog.className = "dialog";

    this.render();

    this.overlay.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    setTimeout(() => this.overlay.classList.add("open"), 10);
    this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;

    this.overlay.classList.remove("open");
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }, 300);

    this.isOpen = false;
    this.eventBus.emit("dialog:closed", { dialog: this.constructor.name });
  }

  render() {
    // Override in subclasses
  }
}

/**
 * ColorPickerDialog
 */
export class ColorPickerDialog extends Dialog {
  constructor(eventBus, options = {}) {
    super(eventBus);
    this.color = options.color || "#000000";
    this.onSelect = options.onSelect || (() => {});
  }

  render() {
    const header = document.createElement("div");
    header.className = "dialog-header";
    header.textContent = "Choose Color";
    this.dialog.appendChild(header);

    const body = document.createElement("div");
    body.className = "dialog-body";

    const input = document.createElement("input");
    input.type = "color";
    input.value = this.color;
    input.className = "color-picker-input";
    body.appendChild(input);

    const presets = [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];
    const presetsEl = document.createElement("div");
    presetsEl.className = "color-presets";
    presets.forEach((color) => {
      const preset = document.createElement("button");
      preset.className = "color-preset";
      preset.style.backgroundColor = color;
      preset.addEventListener("click", () => {
        input.value = color;
      });
      presetsEl.appendChild(preset);
    });
    body.appendChild(presetsEl);

    this.dialog.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "dialog-footer";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.addEventListener("click", () => this.close());
    footer.appendChild(cancelBtn);

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.className = "btn btn-primary";
    okBtn.addEventListener("click", () => {
      this.onSelect(input.value);
      this.close();
    });
    footer.appendChild(okBtn);

    this.dialog.appendChild(footer);
  }
}

/**
 * ShapePickerDialog
 */
export class ShapePickerDialog extends Dialog {
  constructor(eventBus, shapeRegistry, options = {}) {
    super(eventBus);
    this.shapeRegistry = shapeRegistry;
    this.onSelect = options.onSelect || (() => {});
  }

  render() {
    const header = document.createElement("div");
    header.className = "dialog-header";
    header.textContent = "Insert Shape";
    this.dialog.appendChild(header);

    const body = document.createElement("div");
    body.className = "dialog-body";

    const grid = document.createElement("div");
    grid.className = "shape-picker-grid";

    const shapes = ["rect", "circle", "diamond", "triangle", "hexagon", "star"];
    shapes.forEach((shapeId) => {
      const item = document.createElement("button");
      item.className = "shape-picker-item";
      item.textContent = shapeId;
      item.addEventListener("click", () => {
        this.onSelect(shapeId);
        this.close();
      });
      grid.appendChild(item);
    });

    body.appendChild(grid);
    this.dialog.appendChild(body);
  }
}

/**
 * ExportDialog
 */
export class ExportDialog extends Dialog {
  constructor(eventBus, exportManager, options = {}) {
    super(eventBus);
    this.exportManager = exportManager;
  }

  render() {
    const header = document.createElement("div");
    header.className = "dialog-header";
    header.textContent = "Export Diagram";
    this.dialog.appendChild(header);

    const body = document.createElement("div");
    body.className = "dialog-body";

    const formats = [
      { id: "png", name: "PNG Image", icon: "🖼" },
      { id: "svg", name: "SVG Vector", icon: "📐" },
      { id: "pdf", name: "PDF Document", icon: "📄" },
      { id: "json", name: "JSON Data", icon: "📋" },
    ];

    const formatList = document.createElement("div");
    formatList.className = "export-format-list";

    formats.forEach((format) => {
      const item = document.createElement("button");
      item.className = "export-format-item";
      item.innerHTML = `<span class="icon">${format.icon}</span><span>${format.name}</span>`;
      item.addEventListener("click", () => {
        this._export(format.id);
      });
      formatList.appendChild(item);
    });

    body.appendChild(formatList);
    this.dialog.appendChild(body);
  }

  _export(format) {
    this.eventBus.emit("export:start", { format });
    this.close();
  }
}

/**
 * ContextMenu
 */
export class ContextMenu {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.menu = null;
    this.isOpen = false;
  }

  open(x, y, items) {
    this.close();

    this.menu = document.createElement("div");
    this.menu.className = "context-menu";
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;

    items.forEach((item) => {
      if (item.type === "separator") {
        const sep = document.createElement("div");
        sep.className = "context-menu-separator";
        this.menu.appendChild(sep);
      } else {
        const menuItem = document.createElement("button");
        menuItem.className = "context-menu-item";
        menuItem.textContent = item.label;
        if (item.icon) {
          const icon = document.createElement("span");
          icon.className = "menu-icon";
          icon.textContent = item.icon;
          menuItem.prepend(icon);
        }
        if (item.shortcut) {
          const shortcut = document.createElement("span");
          shortcut.className = "menu-shortcut";
          shortcut.textContent = item.shortcut;
          menuItem.appendChild(shortcut);
        }
        menuItem.addEventListener("click", () => {
          if (item.action) item.action();
          this.close();
        });
        this.menu.appendChild(menuItem);
      }
    });

    document.body.appendChild(this.menu);

    document.addEventListener("click", () => this.close(), { once: true });
    document.addEventListener("contextmenu", () => this.close(), {
      once: true,
    });

    this.isOpen = true;
  }

  close() {
    if (this.menu && this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }
    this.menu = null;
    this.isOpen = false;
  }
}

/**
 * Tooltip
 */
export class Tooltip {
  constructor() {
    this.tooltip = null;
    this.hideTimeout = null;
  }

  show(text, x, y, delay = 500) {
    this.hide();

    this.hideTimeout = setTimeout(() => {
      this.tooltip = document.createElement("div");
      this.tooltip.className = "tooltip";
      this.tooltip.textContent = text;
      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `${y + 20}px`;

      document.body.appendChild(this.tooltip);

      setTimeout(() => this.tooltip.classList.add("visible"), 10);
    }, delay);
  }

  hide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.tooltip) {
      this.tooltip.classList.remove("visible");
      setTimeout(() => {
        if (this.tooltip && this.tooltip.parentNode) {
          this.tooltip.parentNode.removeChild(this.tooltip);
        }
        this.tooltip = null;
      }, 200);
    }
  }
}

/**
 * LoadingOverlay
 */
export class LoadingOverlay {
  constructor() {
    this.overlay = null;
  }

  show(message = "Loading...") {
    this.hide();

    this.overlay = document.createElement("div");
    this.overlay.className = "loading-overlay";

    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    this.overlay.appendChild(spinner);

    const text = document.createElement("div");
    text.className = "loading-text";
    text.textContent = message;
    this.overlay.appendChild(text);

    document.body.appendChild(this.overlay);

    setTimeout(() => this.overlay.classList.add("visible"), 10);
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove("visible");
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
      }, 300);
    }
  }
}

/**
 * Notification
 */
export class Notification {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "notification-container";
      document.body.appendChild(this.container);
    }
  }

  show(message, type = "info", duration = 3000) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;

    const icon = this._getIcon(type);
    if (icon) {
      const iconEl = document.createElement("span");
      iconEl.className = "notification-icon";
      iconEl.textContent = icon;
      notification.appendChild(iconEl);
    }

    const text = document.createElement("span");
    text.className = "notification-text";
    text.textContent = message;
    notification.appendChild(text);

    const close = document.createElement("button");
    close.className = "notification-close";
    close.textContent = "×";
    close.addEventListener("click", () => this._remove(notification));
    notification.appendChild(close);

    this.container.appendChild(notification);

    setTimeout(() => notification.classList.add("visible"), 10);

    if (duration > 0) {
      setTimeout(() => this._remove(notification), duration);
    }
  }

  _getIcon(type) {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
    };
    return icons[type] || "";
  }

  _remove(notification) {
    notification.classList.remove("visible");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}
