# CSS Documentation - Medarion Platform

This document provides a comprehensive guide to all centralized CSS classes available in the Medarion platform. All styles are defined in `src/index.css` and should be used consistently across all pages.

## Table of Contents

1. [Hero Sections](#hero-sections)
2. [Containers & Spacing](#containers--spacing)
3. [Cards & Boxes](#cards--boxes)
4. [Typography](#typography)
5. [Grid Layouts](#grid-layouts)
6. [Buttons](#buttons)
7. [Forms](#forms)
8. [Modals](#modals)
9. [Search Components](#search-components)

---

## Hero Sections

### Standard Page Hero

Use `.page-hero` for standard hero sections on pages like About, Contact, Pricing, Terms, Privacy, Documentation.

```html
<div className="page-hero">
  <div aria-hidden className="page-hero-bg">
    <img src="/path/to/image.jpg" alt="" />
    <div className="page-hero-overlay" />
    <div className="page-hero-gradient" />
  </div>
  
  <div className="page-hero-content">
    <div className="page-hero-content-inner">
      <div className="page-hero-accent" />
      <h1 className="page-hero-heading">Page Title</h1>
      <p className="page-hero-subtext">Page description text</p>
    </div>
  </div>
</div>
```

**Classes:**
- `.page-hero` - Main hero container with full-width layout
- `.page-hero-bg` - Background image container
- `.page-hero-overlay` - Dark overlay (50% opacity)
- `.page-hero-gradient` - Color gradient overlay
- `.page-hero-content` - Content container with max-width
- `.page-hero-content-inner` - Inner content wrapper (centered)
- `.page-hero-accent` - Accent line above heading
- `.page-hero-heading` - Main heading (white, large, bold)
- `.page-hero-subtext` - Subtitle text (white, semi-transparent)

### Landing Page Hero

Use `.landing-hero` for the main landing page hero section.

```html
<section className="landing-hero" style={{ backgroundImage: `url('${heroImageUrl}')` }}>
  <div className="landing-hero-overlay" />
  <div className="landing-hero-gradient" />
  <div className="landing-hero-content">
    {/* Content */}
  </div>
</section>
```

**Classes:**
- `.landing-hero` - Landing page hero with fixed background
- `.landing-hero-overlay` - Subtle dark overlay (8% opacity)
- `.landing-hero-gradient` - Bottom fade gradient
- `.landing-hero-content` - Content container

---

## Containers & Spacing

### Content Containers

```html
<div className="content-container">Default (1280px)</div>
<div className="content-container-sm">Small (1024px)</div>
<div className="content-container-lg">Large (1536px)</div>
```

**Classes:**
- `.content-container` - Standard container (max-width: 1280px)
- `.content-container-sm` - Small container (max-width: 1024px)
- `.content-container-lg` - Large container (max-width: 1536px)

### Section Spacing

```html
<section className="section-spacing">Standard spacing</section>
<section className="section-spacing-lg">Large spacing</section>
<section className="section-spacing-xl">Extra large spacing</section>
```

**Classes:**
- `.section-spacing` - Standard padding (3rem top/bottom)
- `.section-spacing-lg` - Large padding (4rem top/bottom)
- `.section-spacing-xl` - Extra large padding (6rem top/bottom)

---

## Cards & Boxes

### Standard Cards

```html
<div className="standard-card">
  {/* Card content */}
</div>

<div className="value-card">
  {/* Value/feature card content */}
</div>
```

**Classes:**
- `.standard-card` - Standard card with shadow and rounded corners
- `.value-card` - Value/feature card with extra padding

### Icon Containers

```html
<div className="card-icon-container">
  <Icon className="h-8 w-8 text-white" />
</div>
```

**Classes:**
- `.card-icon-container` - Icon container with gradient background (64x64px)

### Stats Cards

```html
<div className="stats-card">
  <div className="stats-icon">
    <Icon className="h-10 w-10 text-white" />
  </div>
  <div className="stats-number">35+</div>
  <div className="stats-label">Countries</div>
</div>
```

**Classes:**
- `.stats-card` - Stats card container (centered)
- `.stats-icon` - Icon container (80x80px, hover scale effect)
- `.stats-number` - Large number display
- `.stats-label` - Stats label text

---

## Typography

### Section Headings

```html
<h2 className="section-heading">Section Title</h2>
<p className="section-subheading">Section description</p>
```

**Classes:**
- `.section-heading` - Section heading (2.25rem, bold, dark/light mode aware)
- `.section-subheading` - Section subheading (1.25rem, gray)

---

## Grid Layouts

### Grid Systems

```html
<div className="grid-2-col">Two column grid</div>
<div className="grid-4-col">Four column grid</div>
<div className="dashboard-grid">Dashboard widgets</div>
<div className="kpi-grid">KPI cards</div>
<div className="profile-grid">Profile sections</div>
```

**Classes:**
- `.grid-2-col` - Two column grid (1 column < 768px, 2 columns ≥ 768px)
- `.grid-4-col` - Four column grid (1 column < 768px, 2 columns ≥ 768px, 4 columns ≥ 1024px)
- `.dashboard-grid` - Dashboard layout (1 column < 768px, 2 columns ≥ 768px, 4 columns ≥ 1024px)
- `.kpi-grid` - KPI cards grid (1 column < 768px, 2 columns ≥ 768px, 4 columns ≥ 1024px)
- `.profile-grid` - Profile sections (1 column < 768px, 2 columns ≥ 768px)

---

## Buttons

### Hero Search Button

```html
<input type="text" className="btn-hero-search" placeholder="Search..." />
```

**Classes:**
- `.btn-hero-search` - Large search input for hero sections

### Category Filter Buttons

```html
<button className={`btn-category ${isActive ? 'btn-category-active' : 'btn-category-inactive'}`}>
  Category
</button>
```

**Classes:**
- `.btn-category` - Base category button
- `.btn-category-active` - Active state (primary color)
- `.btn-category-inactive` - Inactive state (hover effect)

---

## Forms

### Form Inputs

```html
<div className="form-group">
  <label className="form-label">Label</label>
  <input type="text" className="form-input" placeholder="Enter value" />
</div>
```

**Classes:**
- `.form-input` - Standard form input
- `.form-label` - Form label
- `.form-group` - Form group container with spacing

---

## Modals

### Modal Structure

```html
<div className="modal-overlay">
  <div className="modal-container">
    <div className="modal-header">
      <h2 className="modal-title">Modal Title</h2>
      <button className="modal-close">×</button>
    </div>
    <div className="modal-body">
      {/* Modal content */}
    </div>
    <div className="modal-footer">
      {/* Action buttons */}
    </div>
  </div>
</div>
```

**Classes:**
- `.modal-overlay` - Modal backdrop overlay
- `.modal-container` - Modal content container
- `.modal-header` - Modal header with title and close
- `.modal-title` - Modal title
- `.modal-close` - Close button
- `.modal-body` - Modal body content
- `.modal-footer` - Modal footer with actions

---

## Search Components

### Search Input with Icon

```html
<div className="search-input-wrapper">
  <Search className="search-input-icon" />
  <input type="text" className="search-input" placeholder="Search..." />
  <button className="search-input-clear">×</button>
</div>
```

**Classes:**
- `.search-input-wrapper` - Search input container
- `.search-input-icon` - Search icon (positioned left)
- `.search-input` - Search input field
- `.search-input-clear` - Clear button (positioned right)

---

## Dashboard & Profile Styles

### Dashboard Container

```html
<div className="dashboard-container">
  <div className="dashboard-section">
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Title</h3>
          <p className="dashboard-card-subtitle">Subtitle</p>
        </div>
      </div>
      {/* Content */}
    </div>
  </div>
</div>
```

**Classes:**
- `.dashboard-container` - Main dashboard container with padding
- `.dashboard-section` - Dashboard section with spacing
- `.dashboard-card` - Dashboard card with border and shadow
- `.dashboard-card-header` - Card header with border
- `.dashboard-card-title` - Card title (1.125rem, semibold)
- `.dashboard-card-subtitle` - Card subtitle (0.875rem, secondary color)

### Profile Container

```html
<div className="profile-container">
  <div className="profile-section">
    <h2 className="profile-section-title">Section Title</h2>
    {/* Content */}
  </div>
</div>
```

**Classes:**
- `.profile-container` - Main profile container with padding
- `.profile-section` - Profile section with border and padding
- `.profile-section-title` - Section title (1.25rem, semibold)

---

## Usage Guidelines

### When to Use Centralized Classes

1. **Always use centralized classes** for:
   - Hero sections
   - Standard cards and containers
   - Forms and inputs
   - Modals
   - Buttons with common patterns

2. **Avoid inline styles** for:
   - Layout positioning (use classes)
   - Colors (use CSS variables)
   - Spacing (use spacing classes)
   - Typography (use typography classes)

3. **Never use responsive classes** like `md:`, `lg:`, `sm:`, `xl:`, `2xl:`
   - All responsive behavior is handled by centralized CSS classes
   - Use `.grid-2-col`, `.grid-4-col`, `.kpi-grid`, etc. instead
   - Text sizes remain constant across all screen sizes

3. **CSS Variables** - Always use CSS variables for colors:
   - `var(--color-primary-teal)` - Primary color
   - `var(--color-text-primary)` - Primary text
   - `var(--color-text-secondary)` - Secondary text
   - `var(--color-background-default)` - Background
   - `var(--color-background-surface)` - Surface background
   - `var(--color-divider-gray)` - Borders/dividers

### Responsive Design

**UNIFIED RESPONSIVE SYSTEM**

All responsive behavior uses a single, unified breakpoint system:

- **Single Breakpoint: 768px**
  - Below 768px: Single column layouts (stacked)
  - Above 768px: Multi-column layouts (side-by-side)
  - Above 1024px: Expanded multi-column layouts (4 columns for grids)

**Key Principles:**
1. **Text sizes remain constant** - No responsive font scaling
2. **Layouts stack on mobile** - Single column below 768px
3. **Consistent spacing** - Same padding/margins across all sizes
4. **No responsive classes** - Use centralized CSS classes instead of `md:`, `lg:`, `sm:`

**Grid Classes:**
- `.grid-2-col` - 1 column on mobile, 2 columns above 768px
- `.grid-4-col` - 1 column on mobile, 2 columns at 768px, 4 columns at 1024px
- `.dashboard-grid` - For dashboard KPIs and widgets
- `.kpi-grid` - For KPI cards (1→2→4 columns)
- `.profile-grid` - For profile sections (1→2 columns)

### Dark Mode

All classes automatically support dark mode through CSS variables. No additional classes needed.

---

## Migration Guide

### Before (Inline Styles)
```html
<div style={{ 
  marginTop: '-100px',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  left: '50%',
  right: '50%',
  width: '100vw',
  paddingTop: '120px',
  paddingBottom: '48px',
  position: 'relative',
}}>
```

### After (Centralized Classes)
```html
<div className="page-hero">
```

### Benefits

1. **Consistency** - All pages use the same styling
2. **Maintainability** - Change styles in one place
3. **Performance** - CSS classes are more efficient
4. **Readability** - Cleaner, more semantic code
5. **Responsive** - Built-in responsive behavior

---

## Adding New Patterns

When adding new common patterns:

1. Add the CSS class to `src/index.css` in the appropriate section
2. Document it in this file
3. Use CSS variables for colors and spacing
4. Ensure responsive behavior
5. Test in both light and dark modes

---

## Questions or Issues?

If you need to add a new pattern or have questions about existing classes, please:
1. Check this documentation first
2. Review `src/index.css` for existing patterns
3. Follow the established patterns and naming conventions

