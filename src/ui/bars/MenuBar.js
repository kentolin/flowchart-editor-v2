/**
 * MenuBar.js - Application menu bar
 */

export class MenuBar {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = null;
    this.menus = [];
  }

  initialize(containerElement) {
    this.container = containerElement;
    this.render();
  }

  render() {
    this.container.innerHTML = "";
    this.container.className = "flowchart-menubar";

    const menus = [
      {
        label: "File",
        items: [
          { id: "new", label: "New", shortcut: "Ctrl+N" },
          { id: "open", label: "Open...", shortcut: "Ctrl+O" },
          { id: "save", label: "Save", shortcut: "Ctrl+S" },
          { id: "save-as", label: "Save As...", shortcut: "Ctrl+Shift+S" },
          { type: "separator" },
          { id: "export-png", label: "Export as PNG..." },
          { id: "export-svg", label: "Export as SVG..." },
          { id: "export-pdf", label: "Export as PDF..." },
          { type: "separator" },
          { id: "print", label: "Print...", shortcut: "Ctrl+P" },
        ],
      },
      {
        label: "Edit",
        items: [
          { id: "undo", label: "Undo", shortcut: "Ctrl+Z" },
          { id: "redo", label: "Redo", shortcut: "Ctrl+Shift+Z" },
          { type: "separator" },
          { id: "cut", label: "Cut", shortcut: "Ctrl+X" },
          { id: "copy", label: "Copy", shortcut: "Ctrl+C" },
          { id: "paste", label: "Paste", shortcut: "Ctrl+V" },
          { id: "duplicate", label: "Duplicate", shortcut: "Ctrl+D" },
          { type: "separator" },
          { id: "select-all", label: "Select All", shortcut: "Ctrl+A" },
          { id: "delete", label: "Delete", shortcut: "Del" },
        ],
      },
      {
        label: "View",
        items: [
          { id: "zoom-in", label: "Zoom In", shortcut: "Ctrl++" },
          { id: "zoom-out", label: "Zoom Out", shortcut: "Ctrl+-" },
          { id: "zoom-reset", label: "Zoom to 100%", shortcut: "Ctrl+0" },
          { id: "fit-to-screen", label: "Fit to Screen", shortcut: "Ctrl+1" },
          { type: "separator" },
          {
            id: "show-grid",
            label: "Show Grid",
            type: "checkbox",
            checked: true,
          },
          {
            id: "snap-to-grid",
            label: "Snap to Grid",
            type: "checkbox",
            checked: true,
          },
          {
            id: "show-rulers",
            label: "Show Rulers",
            type: "checkbox",
            checked: false,
          },
          { type: "separator" },
          { id: "fullscreen", label: "Full Screen", shortcut: "F11" },
        ],
      },
      {
        label: "Insert",
        items: [
          { id: "insert-shape", label: "Shape..." },
          { id: "insert-text", label: "Text Box" },
          { id: "insert-connector", label: "Connector" },
          { type: "separator" },
          { id: "insert-image", label: "Image..." },
          { id: "insert-icon", label: "Icon..." },
        ],
      },
      {
        label: "Arrange",
        items: [
          {
            id: "bring-front",
            label: "Bring to Front",
            shortcut: "Ctrl+Shift+]",
          },
          { id: "bring-forward", label: "Bring Forward", shortcut: "Ctrl+]" },
          { id: "send-backward", label: "Send Backward", shortcut: "Ctrl+[" },
          { id: "send-back", label: "Send to Back", shortcut: "Ctrl+Shift+[" },
          { type: "separator" },
          { id: "align-left", label: "Align Left" },
          { id: "align-center", label: "Align Center" },
          { id: "align-right", label: "Align Right" },
          { id: "align-top", label: "Align Top" },
          { id: "align-middle", label: "Align Middle" },
          { id: "align-bottom", label: "Align Bottom" },
          { type: "separator" },
          { id: "distribute-h", label: "Distribute Horizontally" },
          { id: "distribute-v", label: "Distribute Vertically" },
          { type: "separator" },
          { id: "group", label: "Group", shortcut: "Ctrl+G" },
          { id: "ungroup", label: "Ungroup", shortcut: "Ctrl+Shift+G" },
        ],
      },
      {
        label: "Help",
        items: [
          { id: "help-docs", label: "Documentation" },
          { id: "help-shortcuts", label: "Keyboard Shortcuts" },
          { type: "separator" },
          { id: "about", label: "About" },
        ],
      },
    ];

    menus.forEach((menu) => {
      const menuEl = this._createMenu(menu);
      this.container.appendChild(menuEl);
      this.menus.push({
        label: menu.label,
        element: menuEl,
        items: menu.items,
      });
    });

    this._setupEventListeners();
  }

  _createMenu(menu) {
    const menuEl = document.createElement("div");
    menuEl.className = "menu";

    const trigger = document.createElement("button");
    trigger.className = "menu-trigger";
    trigger.textContent = menu.label;
    menuEl.appendChild(trigger);

    const dropdown = document.createElement("div");
    dropdown.className = "menu-dropdown";

    menu.items.forEach((item) => {
      if (item.type === "separator") {
        const sep = document.createElement("div");
        sep.className = "menu-separator";
        dropdown.appendChild(sep);
      } else {
        const itemEl = this._createMenuItem(item);
        dropdown.appendChild(itemEl);
      }
    });

    menuEl.appendChild(dropdown);

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this._toggleMenu(menuEl);
    });

    return menuEl;
  }

  _createMenuItem(item) {
    const itemEl = document.createElement("button");
    itemEl.className = "menu-item";
    itemEl.dataset.action = item.id;

    const label = document.createElement("span");
    label.className = "menu-item-label";
    label.textContent = item.label;
    itemEl.appendChild(label);

    if (item.shortcut) {
      const shortcut = document.createElement("span");
      shortcut.className = "menu-item-shortcut";
      shortcut.textContent = item.shortcut;
      itemEl.appendChild(shortcut);
    }

    if (item.type === "checkbox") {
      itemEl.classList.add("menu-item-checkbox");
      if (item.checked) {
        itemEl.classList.add("checked");
      }
    }

    itemEl.addEventListener("click", () => {
      if (item.type === "checkbox") {
        itemEl.classList.toggle("checked");
        const checked = itemEl.classList.contains("checked");
        this.eventBus.emit("menu:action", { action: item.id, checked });
      } else {
        this.eventBus.emit("menu:action", { action: item.id });
      }
      this._closeAllMenus();
    });

    return itemEl;
  }

  _toggleMenu(menuEl) {
    const isOpen = menuEl.classList.contains("open");
    this._closeAllMenus();
    if (!isOpen) {
      menuEl.classList.add("open");
    }
  }

  _closeAllMenus() {
    this.container.querySelectorAll(".menu.open").forEach((menu) => {
      menu.classList.remove("open");
    });
  }

  _setupEventListeners() {
    document.addEventListener("click", () => {
      this._closeAllMenus();
    });

    this.eventBus.on("history:changed", ({ canUndo, canRedo }) => {
      this._setMenuItemEnabled("undo", canUndo);
      this._setMenuItemEnabled("redo", canRedo);
    });

    this.eventBus.on("selection:changed", ({ nodes, edges }) => {
      const hasSelection = nodes.length > 0 || edges.length > 0;
      this._setMenuItemEnabled("cut", hasSelection);
      this._setMenuItemEnabled("copy", hasSelection);
      this._setMenuItemEnabled("duplicate", hasSelection);
      this._setMenuItemEnabled("delete", hasSelection);
      this._setMenuItemEnabled("bring-front", hasSelection);
      this._setMenuItemEnabled("bring-forward", hasSelection);
      this._setMenuItemEnabled("send-backward", hasSelection);
      this._setMenuItemEnabled("send-back", hasSelection);

      const multipleSelected = nodes.length > 1;
      this._setMenuItemEnabled("align-left", multipleSelected);
      this._setMenuItemEnabled("align-center", multipleSelected);
      this._setMenuItemEnabled("align-right", multipleSelected);
      this._setMenuItemEnabled("align-top", multipleSelected);
      this._setMenuItemEnabled("align-middle", multipleSelected);
      this._setMenuItemEnabled("align-bottom", multipleSelected);
      this._setMenuItemEnabled("distribute-h", multipleSelected);
      this._setMenuItemEnabled("distribute-v", multipleSelected);
      this._setMenuItemEnabled("group", multipleSelected);
    });
  }

  _setMenuItemEnabled(action, enabled) {
    const item = this.container.querySelector(`[data-action="${action}"]`);
    if (item) {
      item.disabled = !enabled;
      item.classList.toggle("disabled", !enabled);
    }
  }

  addMenuItem(menuLabel, item, position) {
    const menu = this.menus.find((m) => m.label === menuLabel);
    if (menu) {
      const dropdown = menu.element.querySelector(".menu-dropdown");
      const itemEl = this._createMenuItem(item);
      if (position !== undefined) {
        const children = Array.from(dropdown.children);
        dropdown.insertBefore(itemEl, children[position]);
      } else {
        dropdown.appendChild(itemEl);
      }
    }
  }

  destroy() {
    this.menus = [];
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}
