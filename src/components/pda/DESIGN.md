# Design System: Hedui PDA
**Module:** PDA Workflow

## 1. Visual Theme & Atmosphere
**Vibe:** Utilitarian, High-Contrast, Touch-First, Fast.
The PDA interface is designed for speed and accuracy in a warehouse environment. It prioritizes maximizing screen real estate for data entry and status verification. The atmosphere is "Industrial Precision."

## 2. Color Palette & Roles
*   **Action Blue (#2563EB / --color-primary):** Used for primary scan actions and active states.
*   **Alert Orange (#F97316 / --color-cta):** Used for critical alerts and "Verify" calls to action.
*   **Success Green (#10B981):** Used for verified/passed statuses.
*   **Error Red (#EF4444):** Used for anomalies and stop signals.
*   **Surface White (#FFFFFF):** High readability background for lists.
*   **Canvas Blue (#EFF6FF / --color-background):** Subtle background for the app shell.

## 3. Typography Rules
*   **Headers:** Fira Code, Bold (700). Used for barcodes and section titles.
*   **Body:** Fira Sans, Regular (400). Used for metadata.
*   **Data:** Fira Code, Medium (500). Used for weights and IDs.

## 4. Component Stylings
*   **Scanner Input:** Giant, full-width, high height (56px+), prominent borders.
*   **Action Buttons:** Pill-shaped or large rounded rects (12px radius), minimal shadows to avoid visual clutter on low-end screens.
*   **List Items:** Card-like separation, clearly distinct "tappable" areas.
*   **Status Tags:** Large, legible badges with icons.

## 5. Layout Principles
*   **Thumb Zone:** Primary actions (Complete, Skip) placed at the absolute bottom.
*   **Readability:** scanning results take up the majority of the screen (flex-grow).
*   **Input First:** The input field is always visible and accessible.
