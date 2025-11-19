/**
 * MenuBar.js - Application menu bar
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";

export class MenuBar {
  constructor(eventBus, stateManager) {
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.container = null;
    this.menus = [];

    this.log.exit("constructor");
  }

  /**
   * Initialize and render menu bar
   * @param {HTMLElement} containerElement - The container to render into
   */
  initialize(containerElement) {
    this.log.enter("initialize");

    if (!containerElement) {
      this.log.error("Container element is required");
      return;
    }

    this.container = containerElement;
    this.render();
    this._setupEventListeners();

    this.log.exit("initialize");
  }

  /**
   * Render menu bar into the container
   */
  render() {
    this.log.enter("render");

    if (!this.container) {
      this.log.error("Container not initialized. Call initialize() first.");
      return;
    }

    // Clear existing content
    this.container.innerHTML = "";
    this.container.className = "menu-bar";

    // Define menu structure
    const menus = this._getMenuDefinitions();

    // Build menus
    this.log.stage(`Building ${menus.length} menus`);
    menus.forEach((menu) => {
      const menuEl = this._createMenu(menu);
      this.container.appendChild(menuEl);
      this.menus.push({
        label: menu.label,
        element: menuEl,
        items: menu.items,
      });
    });

    this.log.exit("render", `Created ${this.menus.length} menus`);
  }

  /**
   * Get menu definitions
   * @private
   * @returns {Array} Menu definitions
   */
  _getMenuDefinitions() {
    return [
      {
        label: "File",
        items: [
          { id: "new", label: "New", shortcut: "Ctrl+N" },
          { id: "open", label: "Open...", shortcut: "Ctrl+O" },
          { id: "save", label: "Save", shortcut: "Ctrl+S" },
          { id: "save-as", label: "Save As...", shortcut: "Ctrl+Shift+S" },
          { type: "separator" },
          {
            label: "Export",
            submenu: [
              { id: "export-json", label: "Export as JSON" },
              { id: "export-svg", label: "Export as SVG" },
              { id: "export-png", label: "Export as PNG" },
              { id: "export-pdf", label: "Export as PDF" },
            ],
          },
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
          { type: "separator" },
          {
            label: "Preferences",
            submenu: [
              {
                label: "Theme",
                submenu: [
                  { id: "theme-light", label: "Light" },
                  { id: "theme-dark", label: "Dark" },
                  { id: "theme-auto", label: "Auto" },
                ],
              },
              { type: "separator" },
              { id: "settings", label: "Settings..." },
            ],
          },
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
          {
            label: "Panels",
            submenu: [
              { id: "toggle-minimap", label: "Mini Map" },
              { id: "toggle-action-log", label: "Action Log" },
              { id: "toggle-layers", label: "Layers Panel" },
            ],
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
            label: "Order",
            submenu: [
              {
                id: "bring-front",
                label: "Bring to Front",
                shortcut: "Ctrl+Shift+]",
              },
              {
                id: "bring-forward",
                label: "Bring Forward",
                shortcut: "Ctrl+]",
              },
              {
                id: "send-backward",
                label: "Send Backward",
                shortcut: "Ctrl+[",
              },
              {
                id: "send-back",
                label: "Send to Back",
                shortcut: "Ctrl+Shift+[",
              },
            ],
          },
          { type: "separator" },
          {
            label: "Align",
            submenu: [
              { id: "align-left", label: "Align Left" },
              { id: "align-center", label: "Align Center" },
              { id: "align-right", label: "Align Right" },
              { type: "separator" },
              { id: "align-top", label: "Align Top" },
              { id: "align-middle", label: "Align Middle" },
              { id: "align-bottom", label: "Align Bottom" },
            ],
          },
          {
            label: "Distribute",
            submenu: [
              { id: "distribute-h", label: "Distribute Horizontally" },
              { id: "distribute-v", label: "Distribute Vertically" },
            ],
          },
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
  }

  /**
   * Create a menu element
   * @private
   * @param {Object} menu - Menu configuration
   * @returns {HTMLElement} Menu element
   */
  _createMenu(menu) {
    this.log.stage(`Creating menu: ${menu.label}`);

    const menuEl = document.createElement("div");
    menuEl.className = "menu-item";
    menuEl.dataset.menu = menu.label.toLowerCase();
    menuEl.textContent = menu.label;

    // Build dropdown recursively
    const dropdown = this._buildDropdown(menu.items);
    menuEl.appendChild(dropdown);

    // ADD TOUCH SUPPORT
    let touchHandled = false;

    menuEl.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        touchHandled = true;
        this._closeAllMenus();
        menuEl.classList.add("open");
      },
      { passive: false }
    );

    // Mouse events for opening/closing
    menuEl.addEventListener("mouseenter", () => {
      if (!touchHandled) {
        this._closeAllMenus();
        menuEl.classList.add("open");
      }
      touchHandled = false; // reset for next interaction
    });

    menuEl.addEventListener("mouseleave", () => {
      if (!touchHandled) {
        menuEl.classList.remove("open");
      }
    });

    this.log.stage(`Created menu: ${menu.label}`);
    return menuEl;
  }

  /**
   * Build dropdown menu recursively
   * @private
   * @param {Array} items - Menu items
   * @returns {HTMLElement} Dropdown element
   */
  _buildDropdown(items = []) {
    const container = document.createElement("div");
    container.className = "menu-dropdown";

    items.forEach((item) => {
      // Handle separator
      if (item.type === "separator") {
        const sep = document.createElement("div");
        sep.className = "menu-separator";
        sep.setAttribute("role", "separator");
        container.appendChild(sep);
        return;
      }

      // Create menu item element
      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.justifyContent = "space-between";
      el.style.alignItems = "center";
      el.textContent = item.label;

      if (item.id) {
        el.dataset.action = item.id;
      }

      if (item.shortcut) {
        const shortcut = document.createElement("span");
        shortcut.className = "menu-shortcut";
        shortcut.textContent = item.shortcut;
        el.appendChild(shortcut);
      }

      // Handle submenu (recursive)
      if (item.submenu) {
        el.className = "submenu";
        const sub = this._buildDropdown(item.submenu);
        sub.classList.add("submenu-dropdown");
        el.appendChild(sub);

        // ADD TOUCH SUPPORT FOR SUBMENUS
        let submenuTouchHandled = false;

        el.addEventListener(
          "touchstart",
          (e) => {
            e.stopPropagation();
            e.preventDefault();
            submenuTouchHandled = true;
            // Toggle submenu
            const isOpen = sub.style.display === "flex";
            sub.style.display = isOpen ? "none" : "flex";
            if (!isOpen) {
              this._adjustSubmenuPosition(sub);
            }
          },
          { passive: false }
        );

        //Adjust position if near right edge
        el.addEventListener("mouseenter", () => {
          if (!submenuTouchHandled) {
            this._adjustSubmenuPosition(sub);
          }
          submenuTouchHandled = false; // reset for next interaction
        });
      }

      // Handle action/click
      else {
        //ADD BOTH CLICK and TOUCH EVENTS

        const handleAction = (e) => {
          e.stopPropagation();
          this._closeAllMenus();

          this.log.stage(`Menu action: ${item.id || item.label}`);

          // Handle checkbox items
          if (item.type === "checkbox") {
            item.checked = !item.checked;
            el.classList.toggle("checked", item.checked);

            const checkmark = el.querySelector(".menu-checkmark");
            if (checkmark) {
              checkmark.textContent = item.checked ? "✓" : "";
            }

            this.eventBus.emit("menu:action", {
              action: item.id,
              checked: item.checked,
            });
          } else {
            this.eventBus.emit("menu:action", { action: item.id });
          }
        };
        el.addEventListener("click", handleAction);
        el.addEventListener("touchend", handleAction, { passive: false });
      }
      container.appendChild(el);
    });
    return container;
  }
  /**
   * Adjust submenu position to prevent overflow
   * @private
   * @param {HTMLElement} submenu - Submenu element
   */
  _adjustSubmenuPosition(submenu) {
    const rect = submenu.getBoundingClientRect();
    const vw = window.innerWidth;

    if (rect.right > vw - 10) {
      submenu.style.left = "auto";
      submenu.style.right = "100%";
    }
  }

  /**
   * Close all open menus
   * @private
   */
  _closeAllMenus() {
    this.container?.querySelectorAll(".menu-item.open").forEach((menu) => {
      menu.classList.remove("open");
    });
  }
  /**   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    this.log.enter("_setupEventListeners");

    // Only keep document click handler
    this._documentClickHandler = () => {
      this._closeAllMenus();
    };
    document.addEventListener("click", this._documentClickHandler);

    this.log.exit("_setupEventListeners", "Event listeners attached");
  }
}
