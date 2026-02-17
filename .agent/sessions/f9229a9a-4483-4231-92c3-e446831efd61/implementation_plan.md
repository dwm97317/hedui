# Implementation Plan - Remove Finance Navigation Bar

The user wants to remove the bottom navigation bar from all pages in the finance system (`/finance`). Currently, the navigation bar is shown on the finance home page but hidden on its sub-pages.

## Proposed Changes

### [Component Name]

#### [MODIFY] [App.tsx](file:///www/wwwroot/hedui/App.tsx)

- Update the `isFullScreenPage` logic to include all paths starting with `/finance`.

```diff
   const isFullScreenPage =
     location.pathname === '/login' ||
     (location.pathname.startsWith('/transit/') && location.pathname !== '/transit') ||
     (location.pathname.startsWith('/receiver/') && location.pathname !== '/receiver') ||
     (location.pathname.startsWith('/sender/') && location.pathname !== '/sender') ||
-    (location.pathname.startsWith('/finance/') && location.pathname !== '/finance') ||
+    location.pathname.startsWith('/finance') ||
     (location.pathname.startsWith('/supervisor/') && location.pathname !== '/supervisor') ||
     location.pathname.startsWith('/batch/') ||
     location.pathname.startsWith('/batch-detail/');
```

## Verification Plan

### Manual Verification
- Navigate to `http://localhost:3000/#/finance` and verify the bottom navigation bar is hidden.
- Navigate to other finance pages (e.g., `/finance/bills`) and verify the navigation bar is still hidden.
- Verify the navigation bar still appears on other main pages like `/` (Home).
