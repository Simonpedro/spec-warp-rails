# Changelog

All notable changes to SpecWarp for Rails will be documented in this file.

## [0.1.0] - 2024-12-05

### Added

- Initial release
- Toggle between Ruby implementation files and their RSpec specs with `Cmd+Shift+Y` / `Ctrl+Shift+Y`
- Support for standard Rails project structure (`app/` ↔ `spec/`)
- Support for Packwerk modular architecture (`packs/<name>/app/` ↔ `packs/<name>/spec/`)
- Support for root `lib/` files (`lib/` ↔ `spec/`)
- Optional spec file creation with RSpec boilerplate template
- Configuration options:
  - `specWarpRails.createFileIfMissing` - Create spec file if missing
  - `specWarpRails.showNotifications` - Toggle notification messages

