/**
 * ExportManager.js - Handles export to various formats
 *
 * Responsibilities:
 * - Export graph to JSON
 * - Export to image formats (PNG, SVG)
 * - Export to PDF
 * - Generate shareable links
 * - Handle export options and quality settings
 *
 * @module core/managers/ExportManager
 */

export class ExportManager {
  constructor(eventBus, stateManager, nodeManager, edgeManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;

    // Export options
    this.defaultOptions = {
      json: {
        pretty: true,
        includeMetadata: true,
      },
      image: {
        format: "png", // 'png', 'svg', 'jpeg'
        quality: 0.95,
        scale: 2,
        backgroundColor: "#ffffff",
        padding: 20,
      },
      pdf: {
        format: "A4",
        orientation: "landscape",
      },
    };
  }

  /**
   * Export graph to JSON
   * @param {Object} options - Export options
   * @returns {string} - JSON string
   */
  exportJSON(options = {}) {
    const opts = { ...this.defaultOptions.json, ...options };

    try {
      const data = {
        version: "1.0",
        type: "flowchart",
        metadata: opts.includeMetadata
          ? {
              created: new Date().toISOString(),
              editor: "flowchart-editor",
              nodeCount: this.nodeManager.getAllNodes().length,
              edgeCount: this.edgeManager.getAllEdges().length,
            }
          : undefined,
        nodes: this.nodeManager.getAllNodes().map((node) => node.serialize()),
        edges: this.edgeManager.getAllEdges().map((edge) => edge.serialize()),
        settings: this.stateManager.getState(),
      };

      const json = opts.pretty
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

      this.eventBus.emit("export:json:complete", { size: json.length });

      return json;
    } catch (error) {
      console.error("Error exporting JSON:", error);
      this.eventBus.emit("export:error", { format: "json", error });
      throw error;
    }
  }

  /**
   * Export graph to image
   * @param {SVGElement} svgElement - SVG element to export
   * @param {Object} options - Export options
   * @returns {Promise<Blob>} - Image blob
   */
  async exportImage(svgElement, options = {}) {
    const opts = { ...this.defaultOptions.image, ...options };

    try {
      if (opts.format === "svg") {
        return await this._exportSVG(svgElement, opts);
      } else {
        return await this._exportRasterImage(svgElement, opts);
      }
    } catch (error) {
      console.error("Error exporting image:", error);
      this.eventBus.emit("export:error", { format: opts.format, error });
      throw error;
    }
  }

  /**
   * Export to SVG format
   * @private
   */
  async _exportSVG(svgElement, options) {
    // Clone SVG
    const clone = svgElement.cloneNode(true);

    // Get bounds
    const bbox = svgElement.getBBox();

    // Add padding
    const padding = options.padding;
    const width = bbox.width + padding * 2;
    const height = bbox.height + padding * 2;

    // Set viewBox
    clone.setAttribute(
      "viewBox",
      `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`
    );
    clone.setAttribute("width", width);
    clone.setAttribute("height", height);

    // Add background if specified
    if (options.backgroundColor && options.backgroundColor !== "transparent") {
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("x", bbox.x - padding);
      rect.setAttribute("y", bbox.y - padding);
      rect.setAttribute("width", width);
      rect.setAttribute("height", height);
      rect.setAttribute("fill", options.backgroundColor);
      clone.insertBefore(rect, clone.firstChild);
    }

    // Serialize to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);

    // Create blob
    const blob = new Blob([svgString], { type: "image/svg+xml" });

    this.eventBus.emit("export:svg:complete", { size: blob.size });

    return blob;
  }

  /**
   * Export to raster image (PNG/JPEG)
   * @private
   */
  async _exportRasterImage(svgElement, options) {
    // Get SVG string
    const svgBlob = await this._exportSVG(svgElement, options);
    const svgUrl = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas
        const canvas = document.createElement("canvas");
        const bbox = svgElement.getBBox();
        const padding = options.padding;
        const width = (bbox.width + padding * 2) * options.scale;
        const height = (bbox.height + padding * 2) * options.scale;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        // Fill background
        if (
          options.backgroundColor &&
          options.backgroundColor !== "transparent"
        ) {
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(svgUrl);

            this.eventBus.emit(`export:${options.format}:complete`, {
              size: blob.size,
              width,
              height,
            });

            resolve(blob);
          },
          `image/${options.format}`,
          options.quality
        );
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(svgUrl);
        reject(error);
      };

      img.src = svgUrl;
    });
  }

  /**
   * Download blob as file
   * @param {Blob} blob - Data to download
   * @param {string} filename - File name
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    this.eventBus.emit("export:download", { filename, size: blob.size });
  }

  /**
   * Export and download as JSON
   * @param {string} filename - File name
   * @param {Object} options - Export options
   */
  downloadJSON(filename = "flowchart.json", options = {}) {
    const json = this.exportJSON(options);
    const blob = new Blob([json], { type: "application/json" });
    this.downloadBlob(blob, filename);
  }

  /**
   * Export and download as image
   * @param {SVGElement} svgElement - SVG to export
   * @param {string} filename - File name
   * @param {Object} options - Export options
   */
  async downloadImage(svgElement, filename, options = {}) {
    const blob = await this.exportImage(svgElement, options);
    this.downloadBlob(blob, filename);
  }

  /**
   * Import graph from JSON
   * @param {string} json - JSON string
   * @returns {Object} - Imported data
   */
  importJSON(json) {
    try {
      const data = JSON.parse(json);

      // Validate format
      if (!data.nodes || !data.edges) {
        throw new Error("Invalid flowchart data");
      }

      // Check version compatibility
      if (data.version && data.version !== "1.0") {
        console.warn(
          `Importing from version ${data.version}, current version is 1.0`
        );
      }

      this.eventBus.emit("export:import:start", {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
      });

      return data;
    } catch (error) {
      console.error("Error importing JSON:", error);
      this.eventBus.emit("export:error", {
        format: "json",
        error,
        operation: "import",
      });
      throw error;
    }
  }

  /**
   * Import from file
   * @param {File} file - File to import
   * @returns {Promise<Object>} - Imported data
   */
  async importFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = this.importJSON(e.target.result);
          this.eventBus.emit("export:import:complete", {
            filename: file.name,
            size: file.size,
          });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Copy to clipboard
   * @param {string} format - Format to copy ('json', 'svg')
   * @param {SVGElement} svgElement - SVG element (for svg format)
   */
  async copyToClipboard(format = "json", svgElement = null) {
    try {
      let data;

      if (format === "json") {
        data = this.exportJSON();
        await navigator.clipboard.writeText(data);
      } else if (format === "svg" && svgElement) {
        const blob = await this._exportSVG(
          svgElement,
          this.defaultOptions.image
        );
        const text = await blob.text();
        await navigator.clipboard.writeText(text);
      }

      this.eventBus.emit("export:clipboard:success", { format });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      this.eventBus.emit("export:error", {
        format,
        error,
        operation: "clipboard",
      });
    }
  }

  /**
   * Generate shareable data URL
   * @returns {string} - Data URL
   */
  generateDataURL() {
    const json = this.exportJSON({ pretty: false });
    const encoded = btoa(encodeURIComponent(json));
    return `data:application/json;base64,${encoded}`;
  }

  /**
   * Parse data URL
   * @param {string} dataURL - Data URL
   * @returns {Object} - Parsed data
   */
  parseDataURL(dataURL) {
    try {
      const base64 = dataURL.replace("data:application/json;base64,", "");
      const json = decodeURIComponent(atob(base64));
      return this.importJSON(json);
    } catch (error) {
      console.error("Error parsing data URL:", error);
      throw error;
    }
  }

  /**
   * Get export statistics
   * @returns {Object}
   */
  getExportStats() {
    const nodes = this.nodeManager.getAllNodes();
    const edges = this.edgeManager.getAllEdges();

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      estimatedJSONSize: JSON.stringify({
        nodes: nodes.map((n) => n.serialize()),
        edges: edges.map((e) => e.serialize()),
      }).length,
    };
  }

  /**
   * Set default export options
   * @param {string} format - Format type
   * @param {Object} options - Options to set
   */
  setDefaultOptions(format, options) {
    if (this.defaultOptions[format]) {
      this.defaultOptions[format] = {
        ...this.defaultOptions[format],
        ...options,
      };
    }
  }

  /**
   * Get default export options
   * @param {string} format - Format type
   * @returns {Object}
   */
  getDefaultOptions(format) {
    return { ...this.defaultOptions[format] };
  }

  /**
   * Serialize export settings
   * @returns {Object}
   */
  serialize() {
    return {
      defaultOptions: this.defaultOptions,
    };
  }

  /**
   * Restore export settings
   * @param {Object} data - Serialized export data
   */
  deserialize(data) {
    if (data.defaultOptions) {
      this.defaultOptions = {
        ...this.defaultOptions,
        ...data.defaultOptions,
      };
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Nothing to clean up
  }
}
