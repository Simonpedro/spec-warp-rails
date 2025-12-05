# SpecWarp for Rails - Product Requirements Document

## Overview

**Extension ID:** `spec-warp-rails`  
**Name:** SpecWarp for Rails  
**Tagline:** "Jump instantly between Ruby files and their specs in Rails projects."

SpecWarp for Rails is a VS Code/Cursor extension that enables developers to quickly toggle between Ruby implementation files and their corresponding RSpec test files using a single keyboard shortcut (`Cmd+Shift+Y` on macOS, `Ctrl+Shift+Y` on Windows/Linux).

## Problem Statement

Rails developers frequently need to navigate between implementation files and their corresponding spec files. This is a common workflow that requires:
1. Manually constructing the spec file path
2. Using file search or explorer navigation
3. Remembering the exact location of spec files, especially in complex project structures with packs

This friction interrupts the development flow and slows down test-driven development practices.

## Goals

1. **Instant Navigation**: Provide one-command navigation between Ruby files and their specs
2. **Universal Support**: Work seamlessly with both standard Rails structure and packwerk-based modular architectures
3. **Zero Configuration**: Work out-of-the-box for standard Rails conventions
4. **Intelligent Path Resolution**: Handle edge cases and different file structures gracefully

## User Stories

### Primary User Story
As a Rails developer, I want to press `Cmd+Shift+Y` to instantly jump between a Ruby file and its corresponding spec file, so that I can quickly switch between implementation and tests without manual navigation.

### Supporting User Stories
- As a developer working with packs, I want the extension to correctly resolve spec paths within pack directories
- As a developer, I want the extension to automatically create the spec file with RSpec boilerplate if it doesn't exist
- As a developer, I want clear feedback when a corresponding file cannot be found

## Technical Requirements

### File Path Mapping Rules

#### Standard Rails Structure
- **Implementation → Spec:**
  - `app/models/donor.rb` → `spec/models/donor_spec.rb`
  - `app/controllers/users_controller.rb` → `spec/controllers/users_controller_spec.rb`
  - `app/lib/helpers.rb` → `spec/lib/helpers_spec.rb`
  - `lib/my_gem.rb` → `spec/my_gem_spec.rb`

- **Spec → Implementation:**
  - `spec/models/donor_spec.rb` → `app/models/donor.rb`
  - `spec/controllers/users_controller_spec.rb` → `app/controllers/users_controller_spec.rb`
  - `spec/lib/helpers_spec.rb` → `app/lib/helpers.rb`

**Pattern:** Replace `app/` with `spec/` (or vice versa) and insert `_spec` before `.rb` extension.

#### Packwerk Structure
- **Implementation → Spec:**
  - `packs/donor_sync/app/lib/donor_sync.rb` → `packs/donor_sync/spec/lib/donor_sync_spec.rb`
  - `packs/manufacturing/app/services/processor.rb` → `packs/manufacturing/spec/services/processor_spec.rb`
  - `packs/helm/app/models/equipment.rb` → `packs/helm/spec/models/equipment_spec.rb`

- **Spec → Implementation:**
  - `packs/donor_sync/spec/lib/donor_sync_spec.rb` → `packs/donor_sync/app/lib/donor_sync.rb`
  - `packs/manufacturing/spec/services/processor_spec.rb` → `packs/manufacturing/app/services/processor.rb`

**Pattern:** Within a pack directory, replace `app/` with `spec/` (or vice versa) and insert `_spec` before `.rb` extension, maintaining the pack structure.

### Path Resolution Algorithm

1. **Detect File Type:**
   - Check if current file is a Ruby file (`.rb` extension)
   - Check if current file is a spec file (contains `_spec.rb` or is in `spec/` directory)

2. **Determine Project Structure:**
   - Check if file is in a pack: path contains `packs/<pack_name>/`
   - Check if file is in standard Rails structure: path contains `app/` or `spec/` at root level

3. **Calculate Target Path:**
   - **From Implementation to Spec:**
     - If in pack: `packs/<pack_name>/app/<path>` → `packs/<pack_name>/spec/<path>` (insert `_spec` before `.rb`)
     - If standard: `app/<path>` → `spec/<path>` (insert `_spec` before `.rb`)
     - If in `lib/`: `lib/<path>` → `spec/<path>` (insert `_spec` before `.rb`)
   
   - **From Spec to Implementation:**
     - If in pack: `packs/<pack_name>/spec/<path>` → `packs/<pack_name>/app/<path>` (remove `_spec` before `.rb`)
     - If standard: `spec/<path>` → `app/<path>` (remove `_spec` before `.rb`)

4. **Handle Edge Cases:**
   - Files already named with `_spec` in implementation (should not double-insert)
   - Files in `spec/` without `_spec` suffix (should still work)
   - Nested directories and namespaced modules

### Keyboard Shortcut

- **macOS:** `Cmd+Shift+Y`
- **Windows/Linux:** `Ctrl+Shift+Y`

The shortcut should be configurable via VS Code settings.

## Functional Requirements

### Core Features

1. **Toggle Command**
   - Command ID: `spec-warp-rails.toggle`
   - Command Name: "SpecWarp: Toggle between file and spec"
   - Behavior:
     - If target file exists: Open it in the current editor
     - If target spec file doesn't exist: Automatically create it with RSpec boilerplate and open it

2. **File Detection**
   - Only activate when current file is a Ruby file (`.rb` extension)
   - Work from both implementation and spec files
   - Handle files in any directory structure (app, lib, packs, etc.)

3. **Path Resolution**
   - Correctly identify pack structure vs standard Rails structure
   - Handle nested directories and namespaced modules
   - Preserve directory structure when toggling

### Error Handling

1. **Spec File Not Found:**
   - Automatically create the spec file with RSpec boilerplate template
   - Show brief notification confirming file creation (configurable)
   
2. **Implementation File Not Found:**
   - Show informative notification: "Implementation file not found: <path>"

2. **Invalid File Type:**
   - Only activate for `.rb` files
   - Silently ignore non-Ruby files

3. **Ambiguous Paths:**
   - Handle edge cases gracefully
   - Log warnings for debugging

## Technical Implementation

### VS Code Extension Structure

```
spec-warp-rails/
├── package.json          # Extension manifest
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── pathResolver.ts   # Path resolution logic
│   └── commands.ts       # Command registration
├── README.md
└── CHANGELOG.md
```

### Key Dependencies

- `vscode` API (built-in)
- No external dependencies required

### Core Functions

1. **`resolveSpecPath(implementationPath: string): string`**
   - Takes implementation file path
   - Returns corresponding spec path

2. **`resolveImplementationPath(specPath: string): string`**
   - Takes spec file path
   - Returns corresponding implementation path

3. **`isPackFile(filePath: string): boolean`**
   - Detects if file is within a pack directory

4. **`extractPackName(filePath: string): string | null`**
   - Extracts pack name from path if in pack

5. **`toggleToSpec()`**
   - Main command handler
   - Gets active editor
   - Resolves target path
   - Opens target file

### Configuration Options

```json
{
  "specWarpRails.autoCreateSpec": true,
  "specWarpRails.showNotifications": true,
  "specWarpRails.customSpecPattern": null
}
```

- `autoCreateSpec`: When true (default), automatically creates spec files with RSpec boilerplate when they don't exist

## User Experience

### Workflow

1. Developer opens `app/models/donor.rb`
2. Presses `Cmd+Shift+Y`
3. Extension opens `spec/models/donor_spec.rb` in the same editor
4. Presses `Cmd+Shift+Y` again
5. Extension opens `app/models/donor.rb` again

### Visual Feedback

- Smooth transition between files (VS Code default behavior)
- Notification if target file doesn't exist (optional, configurable)
- Status bar indicator (future enhancement)

## Testing Strategy

### Test Cases

1. **Standard Rails Files:**
   - `app/models/user.rb` ↔ `spec/models/user_spec.rb`
   - `app/controllers/api/v1/users_controller.rb` ↔ `spec/controllers/api/v1/users_controller_spec.rb`
   - `lib/utils/helper.rb` ↔ `spec/utils/helper_spec.rb`

2. **Pack Files:**
   - `packs/donor_sync/app/lib/donor_sync.rb` ↔ `packs/donor_sync/spec/lib/donor_sync_spec.rb`
   - `packs/manufacturing/app/services/processor.rb` ↔ `packs/manufacturing/spec/services/processor_spec.rb`
   - `packs/helm/app/models/equipment.rb` ↔ `packs/helm/spec/models/equipment_spec.rb`

3. **Edge Cases:**
   - Files with `_spec` in name (not at end): `app/models/user_spec_helper.rb`
   - Nested namespaces: `app/lib/donor_sync/group_i/demographics.rb`
   - Files in root `lib/` directory
   - Files already in `spec/` directory without `_spec` suffix

4. **Error Cases:**
   - Non-Ruby files (should not activate)
   - Files outside standard structure
   - Missing target files

## Future Enhancements (Out of Scope for MVP)

1. **Template Customization:**
   - Custom RSpec template for created spec files
   - Support for different test frameworks

2. **Multiple Spec Files:**
   - Handle projects with multiple spec directories
   - Quick picker to choose which spec to open

3. **Test Runner Integration:**
   - Run tests for current file
   - Run tests for current line

4. **Status Bar:**
   - Show current file type (implementation/spec)
   - Quick toggle button

5. **Custom Patterns:**
   - Support for non-standard project structures
   - Configurable path mappings

## Success Metrics

1. **Adoption:**
   - Number of installations
   - Active users

2. **Usage:**
   - Command invocation frequency
   - Error rate (file not found)

3. **User Satisfaction:**
   - Extension rating
   - User feedback

## Open Questions

1. Should the extension support other test frameworks (Minitest, TestUnit)?
2. How should we handle files that don't follow Rails conventions?
3. Should we support jumping to related files (e.g., from model to factory)?
4. Should we support custom keyboard shortcuts per project?

## References

- VS Code Extension API: https://code.visualstudio.com/api
- Rails Testing Guide: https://guides.rubyonrails.org/testing.html
- Packwerk: https://github.com/Shopify/packwerk

## Appendix: Example Path Mappings

### Standard Rails
```
app/models/donor.rb                    ↔ spec/models/donor_spec.rb
app/controllers/users_controller.rb    ↔ spec/controllers/users_controller_spec.rb
app/services/processor.rb              ↔ spec/services/processor_spec.rb
app/lib/helpers.rb                     ↔ spec/lib/helpers_spec.rb
lib/my_gem.rb                          ↔ spec/my_gem_spec.rb
```

### Packwerk
```
packs/donor_sync/app/lib/donor_sync.rb
  ↔ packs/donor_sync/spec/lib/donor_sync_spec.rb

packs/manufacturing/app/services/processor.rb
  ↔ packs/manufacturing/spec/services/processor_spec.rb

packs/helm/app/models/equipment.rb
  ↔ packs/helm/spec/models/equipment_spec.rb

packs/donor_sync/app/lib/donor_sync/group_i/demographics.rb
  ↔ packs/donor_sync/spec/lib/donor_sync/group_i/demographics_spec.rb
```

