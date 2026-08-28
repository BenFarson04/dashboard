# Dashboard v2 CSS - Developer Quick Reference

## Quick Start

### Enable v2 Design
```javascript
import ThemeSwitcher from './utils/themeSwitcher';
ThemeSwitcher.setTheme('v2');
```

### CSS Class
Add `.dashboard-v2` to any element to apply v2 styling:
```javascript
document.documentElement.classList.add('dashboard-v2');
```

---

## CSS Custom Properties

### Colors
```css
--page-bg: #0f1118           /* Page background */
--surface: #161b22           /* Card backgrounds */
--surface-raised: #21262d    /* Elevated surfaces */
--surface-inset: #0d1117     /* Input backgrounds */
--surface-interactive: #262c36
--border-subtle: #30363d
--border-strong: #444c56
--text-primary: #e6edf3
--text-secondary: #8b949e
--text-muted: #6e7681
--accent: #58a6ff
```

### Spacing
```css
--space-4: 8px      /* Standard */
--space-5: 12px     /* Medium */
--space-6: 16px     /* Default */
--space-8: 24px     /* Large */
```

### Radii
```css
--radius-md: 6px    /* Buttons, inputs */
--radius-lg: 8px    /* Cards */
--radius-xl: 12px   /* Modals */
```

---

## Component Selectors

### Sidebar
```css
.dashboard-v2 [class*="sidebar"]
.dashboard-v2 nav[aria-label="Primary"]
```

### Cards
```css
.dashboard-v2 .interactive-card
.dashboard-v2 [class*="Card"]
```

### Briefing
```css
.dashboard-v2 section[aria-labelledby="briefing-title"]
.dashboard-v2 [class*="DailyBriefing"]
```

### Grid
```css
.dashboard-v2 [data-testid="dashboard-grid"]
```

### Buttons
```css
.dashboard-v2 .interactive-button
.dashboard-v2 [class*="variant-primary"]
```

---

## Common Customizations

### Change Accent Color
```css
:root.dashboard-v2 {
  --accent: #your-color;
  --accent-hover: #lighter-shade;
  --accent-active: #darker-shade;
}
```

### Adjust Default Spacing
```css
:root.dashboard-v2 {
  --space-6: 18px;  /* Increase default from 16px */
  --space-5: 14px;  /* Increase medium from 12px */
}
```

### Make Borders More Visible
```css
:root.dashboard-v2 {
  --border-subtle: #404854;  /* Darker */
}
```

### Tighter Sidebar
```css
.dashboard-v2 .sidebar {
  width: 220px;  /* was 240px */
}
```

---

## CSS Specificity Notes

The v2 CSS uses:
- `.dashboard-v2` class selector on `:root`
- Descendant selectors for component styling
- CSS custom properties for theming

Specificity is intentionally moderate to override Tailwind while remaining editable.

---

## Motion/Animation

### Standard Timing
```css
--motion-fast: 100ms       /* Quick interactions */
--motion-medium: 150ms     /* Standard transitions */
--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1)
```

### Apply to Custom Elements
```css
.my-element {
  transition: all var(--motion-medium) var(--ease-standard);
}
```

---

## Responsive Breakpoints

| Screen | Columns | Grid Template |
|--------|---------|---------------|
| <768px | 1 | 1fr |
| 768px+ | 2 | repeat(auto-fit, minmax(350px, 1fr)) |
| 1024px+ | 3 | repeat(3, 1fr) |
| 1400px+ | 4 | repeat(4, 1fr) |

---

## Useful Selectors

### All Interactive Rows
```css
.dashboard-v2 .interactive-row
```

### All Badges
```css
.dashboard-v2 [class*="Badge"]
```

### Focus States
```css
.dashboard-v2 :focus-visible
```

### Hover States
```css
.dashboard-v2 .interactive-card:hover
.dashboard-v2 .interactive-row:hover
```

---

## Testing Checklist

- [ ] Sidebar width is 240px
- [ ] Card radius is 8px
- [ ] Default padding is 16px
- [ ] Text hierarchy is clear
- [ ] Grid shows 3 columns on desktop
- [ ] Briefing spans full width
- [ ] Accent color is #58a6ff
- [ ] Shadows are subtle
- [ ] Hover states work
- [ ] Focus states are visible

---

## Debugging Tips

### Check if v2 is Active
```javascript
document.documentElement.classList.contains('dashboard-v2')
// or
ThemeSwitcher.getTheme() === 'v2'
```

### See Current Colors
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--accent')
```

### View All CSS Variables
```javascript
const styles = getComputedStyle(document.documentElement);
[...styles].filter(s => s.startsWith('--')).forEach(s => {
  console.log(s, styles.getPropertyValue(s));
});
```

---

## Common Issues and Fixes

### Colors Look Wrong
- Check if `.dashboard-v2` class is on `<html>`
- Verify CSS file is imported
- Check browser dev tools for CSS conflicts

### Spacing Looks Off
- Verify `--space-*` variables are set
- Check Tailwind classes aren't conflicting
- Look for inline styles overriding CSS

### Grid Not Responsive
- Confirm media queries are working
- Check viewport meta tag
- Verify browser width is correct

### Animations Stuttering
- Check `prefers-reduced-motion` setting
- Verify GPU acceleration is enabled
- Check for other animations interfering

---

## CSS Architecture

### Layers (Cascade Order)
1. CSS Reset / Global
2. Design System (variables)
3. Layout (grid, sidebar, header)
4. Components (cards, buttons, badges)
5. Utilities (spacing, alignment)
6. States (hover, focus, active)
7. Responsive overrides

### Organization in File
```
1. Design System (50 lines)
   - Variables
   - Colors
   - Typography
   
2. Global Styles (30 lines)
   - Layout
   - Scrollbars
   
3. Layout System (80 lines)
   - Sidebar
   - Header
   - Main content
   
4. Cards (40 lines)
   - Card styling
   - Briefing special treatment
   
5. Grid System (30 lines)
   - Grid layout
   - Responsive
   
6. Interactive Elements (100 lines)
   - Buttons
   - Rows
   - Inputs
   
7. Typography (40 lines)
   - Hierarchy
   - Sizes
   
8. Utilities (40 lines)
   - Spacing
   - Alignment
   
9. Media Queries (30 lines)
   - Mobile
   - Responsive
```

---

## Performance Notes

### CSS Size
- Uncompressed: ~18 kB
- Minified: ~10 kB
- Gzipped: ~2 kB

### Optimization Done
- No unnecessary selectors
- Efficient attribute selectors
- Minimal nesting
- No unused properties
- Hardware acceleration via transform/opacity

### Further Optimization Ideas
- Split into modules (sidebar.css, cards.css, etc)
- Lazy-load v2 CSS only when needed
- Split dark/light themes into separate files
- Tree-shake unused CSS in production

---

## Browser DevTools Tips

### View All v2 CSS
Chrome DevTools → Elements → Find `.dashboard-v2` → View styles

### Override Variables
```javascript
document.documentElement.style.setProperty('--accent', '#ff0000')
```

### Check Computed Values
```javascript
getComputedStyle(element).getPropertyValue('--space-6')
```

### Measure Elements
DevTools → Inspect → Measure tool shows padding/margin

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.0 | 2026-08-28 | ✅ Initial Release |

---

**Last Updated:** 2026-08-28  
**Status:** Complete  
**Ready for:** Development, Testing, Customization
