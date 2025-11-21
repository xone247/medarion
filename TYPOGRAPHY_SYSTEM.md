# Global Typography System - ImagineAI.me

## Overview
The entire application uses ImagineAI.me's typography system as the base theme. All font sizes, weights, and line heights match ImagineAI exactly.

## Global Implementation

### 1. Base Typography (Applies to ALL `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<p>` tags)
- **H1**: 64px / 70.4px line-height / 400 weight / -1.92px letter-spacing
- **H2**: 36px / 54px line-height / 400 weight
- **H3**: 24px / 28.8px line-height / 400 weight
- **H4**: 20px / 30px line-height / 400 weight
- **Paragraphs**: 20px / 30px line-height
- **Base Body**: 16px / 24px line-height

### 2. Tailwind Class Overrides (Applies to ALL components)
All Tailwind text-* classes are globally overridden with `!important`:
- `text-xs`: 12px / 18px
- `text-sm`: 14px / 21px
- `text-base`: 16px / 24px
- `text-lg`: 18px / 27px
- `text-xl`: 20px / 30px
- `text-2xl`: 24px / 28.8px (H3) / 400 weight
- `text-3xl`: 36px / 54px (H2) / 400 weight
- `text-4xl+`: 64px / 70.4px (H1) / 400 weight / -1.92px letter-spacing

### 3. Font Weight Overrides
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 500
- `font-bold`: 600

### 4. Responsive Breakpoints
Mobile (< 768px):
- H1: 40px / 44px / -1.2px letter-spacing
- H2: 28px / 42px
- H3: 20px / 24px
- Paragraphs: 18px / 27px

## Coverage

✅ **Frontend Pages**
- Landing page
- Blog pages
- About, Contact, Pricing
- All module pages (Companies, Deals, Clinical Trials, etc.)

✅ **Admin Dashboard**
- All admin pages
- All dashboard components
- All modals and forms

✅ **All Components**
- Headers, footers
- Cards, buttons
- Forms, inputs
- Charts, widgets
- Modals, dropdowns

✅ **Automatic Application**
- No manual updates needed
- All existing code automatically uses new typography
- All new components automatically inherit

## Files Modified

1. `src/index.css` - Global CSS overrides with !important
2. `tailwind.config.js` - Default font sizes in Tailwind config
3. `src/pages/CluelyLanding.tsx` - Updated to use new typography classes

## Notes

- Newsletter email templates use inline styles (separate from web typography)
- Chart components (Recharts) use fontSize props for axes (intentional)
- All web components automatically inherit ImagineAI typography

