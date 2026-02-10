# Site Documentation

## 1. Vision
Hedui is a logistics management platform enabling real-time parcel tracking, weight verification, and anomaly detection across three key roles: Sender, Transit, and Receiver. The design prioritizes speed, accuracy, and ease of use in warehouse environments, with a special focus on PDA-based workflows.

## 2. Infrastructure
- **Stitch Project ID:** (To be generated)
- **Supabase:** Backend database and auth.
- **Vite/React:** Frontend framework.

## 3. Design System
See `src/components/pda/DESIGN.md` for the visual language (Industrial Precision).
Key principles: Utilitarian, High-Contrast, Touch-First.

## 4. Sitemap
- [ ] /index.html (Main Application - Responsive Desktop/Mobile)
- [ ] /pda.html (PDA Workflow - Specialized Verification Interface)
- [ ] /admin.html (Admin Dashboard - User & Batch Management)

## 5. Roadmap
1. **PDA Workflow:** Implement the high-efficiency scanning interface first.
2. **Main App:** Port the existing React scanner/editor to the new design system.
3. **Admin:** Create a clean, data-dense dashboard for managers.

## 6. Creative Freedom
- Explore a "Dark Mode" for night-shift warehouse operations.
- Consider audio feedback designs for scan success/failure (visualized).
