/**
 * LeftPalette.js - Left Panel Shape Library
 *
 * Features:
 * - Categorized shape library
 * - Search functionality
 * - Drag-and-drop support
 * - Collapsible categories
 * - Visual shape previews
 * - Comprehensive debug logging
 * - Hybrid icon loading (iconSvg → cache → paletteSvgs → generic)
 */

import { DebugLogger } from "../../utils/debug/DebugLogger.js";
import { getPaletteSvg } from "./paletteSvgs.js";

export class LeftPalette {
  constructor(shapeRegistry, eventBus) {
    this.shapeRegistry = shapeRegistry;
    this.eventBus = eventBus;
    this.log = DebugLogger.for(this);
    this.log.enter("constructor");

    this.container = null;
    this.searchInput = null;
    this.categoriesContainer = null;

    // Restore collapse state from localStorage
    this.collapsedState = JSON.parse(
      localStorage.getItem("shapePanelState") || "{}"
    );

    // Cache for loaded SVG icons from preview.svg files
    this.iconCache = new Map();

    this.log.exit("constructor");
  }

  /**
   * Initialize the left palette
   */
  async initialize(containerElement) {
    this.log.enter("initialize");

    if (!containerElement) {
      this.log.error("Container element is required");
      this.log.exit("initialize");
      return;
    }

    this.container = containerElement;

    try {
      // Preload icons from preview.svg files (async, non-blocking)
      this.preloadIcons().catch((error) => {
        this.log.warn("Icon preloading failed, using fallbacks", error);
      });

      this.render();
      this.attachEventListeners();
      this.setupDropZone();
      this.log.exit("initialize");
    } catch (error) {
      this.log.error("Initialization failed", error);
      throw error;
    }
  }

  /**
   * Preload all shape icons from preview.svg files
   * This runs asynchronously and doesn't block initialization
   */
  async preloadIcons() {
    this.log.enter("preloadIcons");

    const allDefinitions = this.shapeRegistry.getAllDefinitions();
    const loadPromises = [];

    for (const shapeDef of allDefinitions) {
      // Skip if iconSvg already exists in definition
      if (shapeDef.iconSvg) {
        this.iconCache.set(shapeDef.type, shapeDef.iconSvg);
        this.log.info(`Cached iconSvg from definition for ${shapeDef.type}`);
        continue;
      }

      // If preview.svg exists, load it
      if (shapeDef.preview) {
        const promise = this.loadPreviewSvg(shapeDef.type, shapeDef.preview);
        loadPromises.push(promise);
      }
    }

    await Promise.all(loadPromises);
    this.log.info(`Preloaded ${this.iconCache.size} icons total`);
    this.log.exit("preloadIcons");
  }

  /**
   * Load preview.svg file and cache its content
   */
  async loadPreviewSvg(type, previewPath) {
    try {
      this.log.info(`Loading preview.svg for ${type} from ${previewPath}`);

      const response = await fetch(previewPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const svgText = await response.text();

      // Parse SVG and extract inner content
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = svgDoc.documentElement;

      // Check for parsing errors
      const parserError = svgDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("SVG parsing error");
      }

      // Get inner HTML (the actual shape elements)
      const innerSvg = svgElement.innerHTML;

      if (innerSvg && innerSvg.trim().length > 0) {
        this.iconCache.set(type, innerSvg);
        this.log.info(`Successfully loaded and cached preview.svg for ${type}`);
      } else {
        this.log.warn(`Empty content in preview.svg for ${type}`);
      }
    } catch (error) {
      this.log.warn(`Failed to load preview.svg for ${type}: ${error.message}`);
      // Fallback will be used in createShapeSVG
    }
  }

  /**
   * Render the palette structure
   */
  render() {
    this.log.enter("render");

    if (!this.container) {
      this.log.error("Container not found");
      this.log.exit("render");
      return;
    }

    this.container.innerHTML = "";

    // Header with search
    const header = this.createHeader();
    this.container.appendChild(header);

    // Categories container
    this.categoriesContainer = document.createElement("div");
    this.categoriesContainer.className = "palette-categories";
    this.container.appendChild(this.categoriesContainer);

    // Render all categories
    this.renderCategories();

    this.log.exit("render");
  }

  /**
   * Create the header with search
   */
  createHeader() {
    this.log.enter("createHeader");

    const header = document.createElement("div");
    header.className = "palette-header";

    // Search input
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Search shapes...";
    this.searchInput.className = "palette-search";

    header.appendChild(this.searchInput);

    this.log.exit("createHeader");
    return header;
  }

  /**
   * Render all shape categories
   */
  renderCategories() {
    this.log.enter("renderCategories");

    // Get all categories from ShapeRegistry
    const categoryNames = this.shapeRegistry.getCategories();
    this.log.info(`Found ${categoryNames.length} categories`, categoryNames);

    this.categoriesContainer.innerHTML = "";

    categoryNames.forEach((categoryName) => {
      const section = this.createCategorySection(categoryName);
      this.categoriesContainer.appendChild(section);
    });

    this.log.exit("renderCategories");
  }

  /**
   * Create a category section
   */
  createCategorySection(categoryName) {
    this.log.enter("createCategorySection");
    this.log.info(`Creating category: ${categoryName}`);

    // Get shapes for this category
    const shapes = this.shapeRegistry.getCategoryShapes(categoryName);

    const section = document.createElement("div");
    section.className = "shape-category";

    // Category Header with triangle
    const header = document.createElement("div");
    header.className = "category-header";

    const triangle = document.createElement("span");
    triangle.className = `triangle ${
      this.collapsedState[categoryName] ? "" : "open"
    }`;

    const title = document.createTextNode(
      this.formatCategoryName(categoryName)
    );

    header.appendChild(triangle);
    header.appendChild(title);

    // Shape Grid
    const grid = document.createElement("div");
    grid.className = "shape-grid";
    if (this.collapsedState[categoryName]) {
      grid.classList.add("collapsed");
    }

    // Render shapes
    shapes.forEach((shapeData) => {
      const shapeItem = this.createShapeItem(shapeData);
      grid.appendChild(shapeItem);
    });

    // Toggle collapse
    header.addEventListener("click", () => {
      this.toggleCategory(categoryName, triangle, grid, shapes);
    });

    section.appendChild(header);
    section.appendChild(grid);

    this.log.exit("createCategorySection");
    return section;
  }

  /**
   * Create a shape item element
   */
  createShapeItem(shapeData) {
    this.log.enter("createShapeItem");

    const { type, definition } = shapeData;

    const item = document.createElement("div");
    item.className = "shape-item";
    item.setAttribute("draggable", "true");
    item.dataset.shapeType = type;

    // Add tooltip
    if (definition.name) {
      item.title = definition.name;
    }

    // Create SVG preview
    const svg = this.createShapeSVG(type, definition);
    item.appendChild(svg);

    // Click → emit shape:selected event
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleShapeClick(type, definition);
    });

    // Drag → setup drag data
    item.addEventListener("dragstart", (e) => {
      this.handleDragStart(e, type, definition);
    });

    this.log.exit("createShapeItem");
    return item;
  }

  /**
   * Create SVG element for shape with hybrid fallback
   * Priority: iconSvg → iconCache → paletteSvgs → generic
   */
  createShapeSVG(type, definition) {
    this.log.enter("createShapeSVG");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 36 36");
    svg.setAttribute("width", "36");
    svg.setAttribute("height", "36");

    let iconSource = "unknown";

    // Priority 1: iconSvg from config.json (definition)
    if (definition.iconSvg) {
      svg.innerHTML = definition.iconSvg;
      iconSource = "definition.iconSvg";
    }
    // Priority 2: Pre-loaded preview.svg from cache
    else if (this.iconCache.has(type)) {
      svg.innerHTML = this.iconCache.get(type);
      iconSource = "iconCache (preview.svg)";
    }
    // Priority 3: Static paletteSvgs.js
    else if (getPaletteSvg(type)) {
      svg.innerHTML = getPaletteSvg(type);
      iconSource = "paletteSvgs.js";
    }
    // Priority 4: Generic fallback icon
    else {
      this.createGenericIcon(svg, type, definition);
      iconSource = "generic fallback";
    }

    this.log.info(`Icon for '${type}' loaded from: ${iconSource}`);
    this.log.exit("createShapeSVG");
    return svg;
  }

  /**
   * Create a generic icon for unknown shapes
   */
  createGenericIcon(svg, type, definition) {
    this.log.enter("createGenericIcon");
    this.log.warn(`Creating generic icon for '${type}'`);

    // Generic rounded rectangle with question mark
    svg.innerHTML = `
      <rect x="2" y="10" width="32" height="16" rx="2" ry="2" 
            fill="none" stroke="#999" stroke-width="1.4"/>
      <text x="18" y="22" text-anchor="middle" 
            font-size="14" font-weight="bold" fill="#999">?</text>
    `;

    this.log.exit("createGenericIcon");
  }

  /**
   * Toggle category collapse
   */
  toggleCategory(categoryName, triangleElement, gridElement, shapes) {
    this.log.enter("toggleCategory");
    this.log.info(`Toggling category: ${categoryName}`);

    const isCollapsed = gridElement.classList.toggle("collapsed");
    triangleElement.classList.toggle("open", !isCollapsed);

    this.collapsedState[categoryName] = isCollapsed;
    localStorage.setItem(
      "shapePanelState",
      JSON.stringify(this.collapsedState)
    );

    this.log.info(
      `Category ${categoryName} ${isCollapsed ? "collapsed" : "expanded"}`
    );
    this.log.exit("toggleCategory");
  }

  /**
   * Handle shape click
   */
  handleShapeClick(type, definition) {
    this.log.enter("handleShapeClick");
    this.log.info(`Shape clicked: ${type}`);

    // Emit event for selection
    this.eventBus.emit("shape:selected", {
      type,
      definition,
    });

    this.log.exit("handleShapeClick");
  }

  /**
   * Handle drag start
   */
  handleDragStart(event, type, definition) {
    this.log.enter("handleDragStart");
    this.log.info(`Drag started: ${type}`);

    event.dataTransfer.setData("shape-id", type);
    event.dataTransfer.setData("application/x-shape-type", type);
    event.dataTransfer.effectAllowed = "move";

    // Create ghost element with SVG preview
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    ghost.style.left = "-9999px";
    ghost.style.width = "48px";
    ghost.style.height = "48px";
    ghost.style.opacity = "0.7";
    ghost.style.pointerEvents = "none";

    const svg = this.createShapeSVG(type, definition);
    svg.setAttribute("width", "48");
    svg.setAttribute("height", "48");
    svg.style.fill = "none";
    svg.style.stroke = "#0078d7";
    svg.style.strokeWidth = "1.8";
    svg.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.25))";

    ghost.appendChild(svg);
    document.body.appendChild(ghost);
    event.dataTransfer.setDragImage(ghost, 24, 24);

    // Clean up ghost after a short delay
    setTimeout(() => ghost.remove(), 0);

    // Emit event
    this.eventBus.emit("shape:dragStart", { type, definition });

    this.log.exit("handleDragStart");
  }

  /**
   * Setup drop zone on editor
   */
  setupDropZone() {
    this.log.enter("setupDropZone");

    const editor =
      document.getElementById("flowchart") ||
      document.getElementById("editor-container") ||
      document.querySelector(".editor-container");

    if (!editor) {
      this.log.warn("Editor container not found for drop zone");
      this.log.exit("setupDropZone");
      return;
    }

    editor.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    editor.addEventListener("drop", (e) => {
      e.preventDefault();
      const shapeId = e.dataTransfer.getData("shape-id");

      if (!shapeId) {
        this.log.warn("No shape-id in drop data");
        return;
      }
      // Convert client coordinates to canvas coordinates
      const rect = editor.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.log.info(`Shape dropped: ${shapeId}`, {
        x,
        y,
      });

      // Emit drop event
      this.eventBus.emit("shape:dropped", {
        type: shapeId,
        x: x,
        y: y,
      });
    });

    this.log.info("Drop zone configured on editor");
    this.log.exit("setupDropZone");
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.log.enter("attachEventListeners");

    // Search functionality
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value);
      });
    }

    this.log.exit("attachEventListeners");
  }

  /**
   * Handle search input
   */
  handleSearch(query) {
    this.log.enter("handleSearch");
    this.log.info(`Search query: "${query}"`);

    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      // Show all categories
      this.renderCategories();
      this.log.exit("handleSearch");
      return;
    }

    // Use ShapeRegistry's search method
    const searchResults = this.shapeRegistry.search(lowerQuery);

    this.log.info(`Found ${searchResults.length} matching shapes`);

    // Render search results
    this.renderSearchResults(searchResults);

    this.log.exit("handleSearch");
  }

  /**
   * Render search results
   */
  renderSearchResults(results) {
    this.log.enter("renderSearchResults");

    this.categoriesContainer.innerHTML = "";

    if (results.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "no-results";
      noResults.textContent = "No shapes found";
      this.categoriesContainer.appendChild(noResults);
      this.log.info("No search results found");
      this.log.exit("renderSearchResults");
      return;
    }

    // Create search results section
    const section = document.createElement("div");
    section.className = "shape-category";

    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = `Search Results (${results.length})`;

    const grid = document.createElement("div");
    grid.className = "shape-grid"; // Not collapsed

    results.forEach((result) => {
      const shapeData = {
        type: result.type,
        definition: result.definition,
        class: this.shapeRegistry.getShapeClass(result.type),
      };
      const shapeItem = this.createShapeItem(shapeData);
      grid.appendChild(shapeItem);
    });

    section.appendChild(header);
    section.appendChild(grid);
    this.categoriesContainer.appendChild(section);

    this.log.exit("renderSearchResults");
  }

  /**
   * Format category name for display
   */
  formatCategoryName(name) {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Refresh the palette (reload shapes from registry)
   */
  refresh() {
    this.log.enter("refresh");
    this.log.info("Refreshing palette");
    this.renderCategories();
    this.log.exit("refresh");
  }

  /**
   * Clear icon cache and reload
   */
  async refreshWithReload() {
    this.log.enter("refreshWithReload");
    this.log.info("Clearing cache and reloading icons");

    this.iconCache.clear();
    await this.preloadIcons();
    this.renderCategories();

    this.log.exit("refreshWithReload");
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    this.log.enter("getCacheStats");

    const stats = {
      cachedIcons: this.iconCache.size,
      categories: this.shapeRegistry.getCategories().length,
      totalShapes: this.shapeRegistry.getAllDefinitions().length,
      collapsedCategories: Object.keys(this.collapsedState).filter(
        (key) => this.collapsedState[key]
      ).length,
    };

    this.log.info("Cache statistics", stats);
    this.log.exit("getCacheStats");
    return stats;
  }

  /**
   * Destroy the palette
   */
  destroy() {
    this.log.enter("destroy");
    this.log.info("Destroying palette");

    if (this.container) {
      this.container.innerHTML = "";
    }

    this.container = null;
    this.searchInput = null;
    this.categoriesContainer = null;
    this.iconCache.clear();

    this.log.exit("destroy");
  }
}
