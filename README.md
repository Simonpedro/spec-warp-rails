# SpecWarp for Rails

Jump instantly between Ruby files and their specs in Rails projects.

## Features

- **One-keystroke toggle** between implementation files and their RSpec specs
- **Works with standard Rails** structure (`app/` ↔ `spec/`)
- **Packwerk support** for modular monolith architectures (`packs/<name>/app/` ↔ `packs/<name>/spec/`)
- **Optional spec file creation** with RSpec boilerplate when the spec doesn't exist

## Usage

1. Open a Ruby file (`.rb`)
2. Press `Cmd+Shift+Y` (macOS) or `Ctrl+Shift+Y` (Windows/Linux)
3. The corresponding spec or implementation file opens instantly

### Example Mappings

| Implementation | Spec |
|----------------|------|
| `app/models/user.rb` | `spec/models/user_spec.rb` |
| `app/controllers/api/v1/users_controller.rb` | `spec/controllers/api/v1/users_controller_spec.rb` |
| `lib/my_gem.rb` | `spec/my_gem_spec.rb` |
| `packs/auth/app/services/login.rb` | `packs/auth/spec/services/login_spec.rb` |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `specWarpRails.autoCreateSpec` | `true` | Automatically create spec file with RSpec boilerplate if it doesn't exist |
| `specWarpRails.showNotifications` | `true` | Show notifications when files are created or not found |

## Installation

### From VSIX

1. Download the `.vsix` file
2. In VS Code/Cursor: `Extensions` → `...` → `Install from VSIX...`

### Build from Source

```bash
pnpm install --ignore-scripts
pnpm run compile
```

To create a VSIX package:

```bash
npx vsce package
```

## Development

```bash
# Install dependencies
pnpm install --ignore-scripts

# Compile TypeScript
pnpm run compile

# Watch mode
pnpm run watch

# Run tests
pnpm run test
```

### Testing the Extension

1. Open this project in VS Code/Cursor
2. Press `F5` to launch the Extension Development Host
3. Open a Ruby file and press `Cmd+Shift+Y`

## License

ISC

