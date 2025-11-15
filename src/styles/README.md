# Styles Directory

Modular CSS architecture for the Flowchart Editor.

## Structure

```
styles/
├── README.md              # This file
├── main.css              # Main entry point (imports all)
├── base/                 # Foundation styles
│   ├── variables.css     # CSS custom properties
│   ├── reset.css         # CSS reset & normalization
│   └── theme.css         # Theme utilities & helpers
├── layout/               # Layout structure
│   ├── app-layout.css    # Main app layout
│   ├── left-panel.css    # Left panel layout
│   └── right-panel.css   # Right panel layout
├── components/           # UI components
│   ├── menu.css          # Menu bar
│   ├── toolbar.css       # Tool bar
│   ├── statusbar.css     # Status bar
│   ├── panels.css        # Side panels (palette, inspector, layers)
│   ├── nodes.css         # Canvas nodes
│   └── edges.css         # Canvas edges/connections
├── overlays.css          # Overlay elements (selection, guides, tooltips)
├── dialogs.css           # Dialogs and modals
└── animations.css        # Animation definitions
```

## Usage

### Import All Styles

```html
<link rel="stylesheet" href="src/styles/main.css" />
```

The main.css file automatically imports all modular stylesheets in the correct order.

### Import Specific Modules

```css
/* In your custom CSS */
@import "src/styles/base/variables.css";
@import "src/styles/components/toolbar.css";
```

## CSS Variables

All design tokens are defined in `base/variables.css`:

### Colors

- `--primary-color` - Primary brand color
- `--background` - Main background
- `--surface` - Surface color (cards, panels)
- `--border` - Border color
- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color

### Spacing

- `--spacing-xs` to `--spacing-2xl`

### Typography

- `--font-family`
- `--font-size-xs` to `--font-size-2xl`
- `--font-weight-normal` to `--font-weight-bold`

### Layout

- `--header-height`
- `--toolbar-height`
- `--statusbar-height`
- `--panel-width`
- `--inspector-width`

### Z-Index

- `--z-canvas` to `--z-tooltip`

## Theming

### Light Theme (Default)

```css
:root {
  --background: #fafafa;
  --surface: #ffffff;
  /* ... */
}
```

### Dark Theme

```css
[data-theme="dark"] {
  --background: #121212;
  --surface: #1e1e1e;
  /* ... */
}
```

### Apply Theme

```javascript
document.documentElement.setAttribute("data-theme", "dark");
```

## Utility Classes

### Display

- `.flex`, `.inline-flex`, `.grid`, `.block`, `.hidden`

### Flexbox

- `.flex-row`, `.flex-column`
- `.justify-center`, `.items-center`
- `.flex-1`, `.flex-auto`

### Spacing

- `.p-sm`, `.p-md`, `.p-lg` (padding)
- `.m-sm`, `.m-md`, `.m-lg` (margin)

### Typography

- `.text-xs`, `.text-sm`, `.text-md`, `.text-lg`
- `.font-normal`, `.font-medium`, `.font-bold`
- `.text-center`, `.text-left`, `.text-right`

### Colors

- `.text-primary`, `.text-secondary`
- `.surface`, `.surface-hover`

### Border Radius

- `.rounded-sm`, `.rounded-md`, `.rounded-lg`, `.rounded-full`

### Transitions

- `.transition-fast`, `.transition-base`, `.transition-slow`

### Elevation

- `.elevation-0` to `.elevation-4`

## Animations

### Animation Classes

- `.animate-fade-in`, `.animate-fade-out`
- `.animate-slide-in-left`, `.animate-slide-in-right`
- `.animate-scale-in`, `.animate-scale-out`
- `.animate-spin`, `.animate-pulse`

### Usage

```html
<div class="animate-fade-in">Content</div>
```

## Component Styling

### Menu Bar

```css
.menu-bar {
  /* ... */
}
.menu-item {
  /* ... */
}
.menu-item:hover {
  /* ... */
}
```

### Tool Bar

```css
.tool-bar {
  /* ... */
}
.tool-btn {
  /* ... */
}
.tool-btn.active {
  /* ... */
}
```

### Panels

```css
.side-panel {
  /* ... */
}
.panel-header {
  /* ... */
}
.panel-content {
  /* ... */
}
```

### Canvas Elements

```css
.node {
  /* ... */
}
.node.selected {
  /* ... */
}
.edge {
  /* ... */
}
.edge.selected {
  /* ... */
}
```

## Responsive Design

### Breakpoints

- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

### Mobile Behavior

```css
@media (max-width: 768px) {
  .left-panel {
    position: absolute;
    left: -260px;
  }

  .left-panel.open {
    left: 0;
  }
}
```

## Best Practices

### 1. Use CSS Variables

```css
/* ✅ Good */
.my-component {
  color: var(--text-primary);
  padding: var(--spacing-md);
}

/* ❌ Bad */
.my-component {
  color: #212121;
  padding: 1rem;
}
```

### 2. Use Utility Classes

```html
<!-- ✅ Good -->
<div class="flex items-center gap-sm">
  <!-- ❌ Bad -->
  <div style="display: flex; align-items: center; gap: 0.5rem;"></div>
</div>
```

### 3. Follow BEM Naming

```css
/* ✅ Good */
.panel-header {
}
.panel-header__title {
}
.panel-header--dark {
}

/* ❌ Bad */
.panelHeader {
}
.panel_header {
}
```

### 4. Scope Component Styles

```css
/* ✅ Good */
.toolbar .tool-btn {
}

/* ❌ Bad */
.btn {
} /* Too generic */
```

## Customization

### Override Variables

```css
/* In your custom.css */
:root {
  --primary-color: #ff5722;
  --panel-width: 300px;
}
```

### Extend Components

```css
/* In your custom.css */
@import "src/styles/components/toolbar.css";

.tool-btn.my-custom {
  /* Custom styles */
}
```

## Performance Tips

1. **Minimize imports** - Only import what you need
2. **Use CSS containment** - `contain: layout style paint`
3. **Avoid expensive properties** - `box-shadow`, `filter` on animations
4. **Use transform** - Instead of top/left for animations
5. **Leverage GPU** - `will-change` for frequently animated elements

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## File Sizes

Approximate sizes:

- main.css: ~2KB (just imports)
- base/: ~5KB
- layout/: ~3KB
- components/: ~8KB
- animations.css: ~2KB
- dialogs.css: ~2KB
- overlays.css: ~3KB
- **Total: ~25KB** (minified: ~15KB)

## Maintenance

### Adding New Components

1. Create new file in `components/`
2. Add import to `main.css`
3. Follow existing naming conventions
4. Use CSS variables
5. Update this README

### Modifying Variables

1. Edit `base/variables.css`
2. Test in both light and dark themes
3. Check responsive breakpoints
4. Verify contrast ratios (WCAG AA)

## Migration Guide

### From Old main.css

Old monolithic file → New modular structure

All styles moved to appropriate modules:

- Variables → `base/variables.css`
- Reset → `base/reset.css`
- Layout → `layout/*.css`
- Components → `components/*.css`
- Animations → `animations.css`

No breaking changes - just better organization!
