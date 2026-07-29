---
name: Academic Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e5'
  on-secondary-container: '#626567'
  tertiary: '#003d27'
  on-tertiary: '#ffffff'
  tertiary-container: '#00563a'
  on-tertiary-container: '#3fd298'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#e0e3e5'
  secondary-fixed-dim: '#c4c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style
The design system is anchored in the concept of "Academic Precision"—a balance between institutional reliability and modern administrative efficiency. The brand personality is authoritative yet accessible, designed to reduce the cognitive load of school administrators, teachers, and parents.

The visual style follows a **Corporate / Modern** aesthetic. It prioritizes clarity through generous whitespace, high-contrast typography, and a structured information hierarchy. By utilizing subtle depth and soft geometry, the UI feels welcoming and "friendly" to non-technical users while maintaining the "institutional" gravity required for educational management.

## Colors
The palette is built on a foundation of "Trustworthy Blues" to instill confidence. 
- **Primary:** A deep, authoritative Navy Blue used for navigation, primary actions, and branding.
- **Secondary/Surface:** Clean whites and ultra-light cool grays facilitate a "paper-like" digital environment that feels organized.
- **Accent:** A vibrant Emerald Green is reserved exclusively for high-priority Call-to-Actions (CTAs), signifying growth and positive completion (e.g., "Submit Grades," "Enroll Student").
- **Neutrals:** Professional Slate grays are used for secondary text and borders to maintain high legibility without the harshness of pure black.

## Typography
This design system utilizes a dual-font strategy. **Manrope** is used for headings to provide a refined, modern, and slightly geometric character that distinguishes the interface from generic enterprise software. **Inter** is employed for all body text, data tables, and labels due to its exceptional legibility and systematic performance in dense information environments.

Scale is used to denote hierarchy; larger headlines are reserved for dashboard overviews, while smaller, semi-bold Inter labels are used for form fields and data headers.

## Layout & Spacing
The layout utilizes a **Fixed Grid** model for desktop dashboards (max-width 1440px) to ensure data density remains manageable and readable. A 12-column system is standard, with 24px gutters providing ample "breathing room" between functional modules.

Spacing follows an 8pt rhythm. Small increments (8px, 16px) are used for internal component padding, while larger increments (40px, 64px) are used to separate distinct logical sections of a page. Consistent horizontal margins of 32px ensure content does not feel cramped against the browser edges.

## Elevation & Depth
Elevation is achieved through **Tonal Layers** and **Ambient Shadows**. 
- **Level 0 (Background):** The base canvas uses the secondary surface color (light gray/white).
- **Level 1 (Cards):** White surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) to separate content modules from the background.
- **Level 2 (Modals/Popovers):** Higher contrast shadows with a slightly larger blur radius to indicate temporary interaction layers.

Shadows should be tinted with the primary blue (e.g., #1E40AF at 5% opacity) rather than pure black to maintain the professional, clean aesthetic.

## Shapes
The shape language uses **Rounded** corners to bridge the gap between "Institutional" (sharp/rigid) and "User-friendly" (soft/organic). 

Standard UI elements like buttons and input fields utilize a 0.5rem (8px) radius. Larger containers, such as dashboard cards and modals, use a 1rem (16px) radius. This softening of the interface reduces the perceived complexity of dense data views and makes the software feel more approachable for daily use.

## Components
- **Buttons:** Primary buttons use the primary blue; "Action" buttons (like 'Save' or 'Apply') use the emerald green accent. Secondary buttons use a ghost style (border only) or a subtle gray fill.
- **Input Fields:** Use a 1px solid border in light gray, which transitions to the primary blue on focus. Labels sit clearly above the field in `label-caps` style.
- **Cards:** The primary container for all data. Cards should have a white background, 16px rounded corners, and Level 1 elevation.
- **Chips:** Used for status indicators (e.g., "Present," "Overdue," "Paid"). These use low-saturation background tints with high-saturation text of the same hue.
- **Data Tables:** Clean, without vertical borders. Use horizontal dividers only. Header rows should have a subtle gray background to anchor the data.
- **Sidebar:** A dark-themed (Primary Blue) vertical navigation bar provides a strong anchor for the application, using white icons for high contrast.