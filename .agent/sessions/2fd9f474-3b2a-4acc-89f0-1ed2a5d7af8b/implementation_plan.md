## Phase 5: Project Consolidation (Migration to Root)

Replace the legacy root project with the modern `PDA-APP-UI` to simplify the build process.

### [File Migration] Project Root
- **Backup**: Move legacy root files (`src`, `package.json`, `index.html`, etc.) to `legacy-pda-backup/`.
- **Migration**: Move all contents of `PDA-APP-UI/` to the project root `/www/wwwroot/hedui/`.
- **Cleanup**: Remove the empty `PDA-APP-UI/` directory.

### [CI/CD] GitHub Actions
- [MODIFY] [.github/workflows/build_apk.yml](file:///www/wwwroot/hedui/.github/workflows/build_apk.yml)
    - Remove `cd PDA-APP-UI` commands.
    - Update paths for `dist` and `npm build` to point to the root.

## Verification Plan

### Automated Tests
- Trigger a GitHub Action run and verify the APK is built successfully.

### Manual Verification
1.  Check that `npm run dev` works from the root.
2.  Verify that the Android project still points to the correct assets.
