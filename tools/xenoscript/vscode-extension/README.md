# XenoScript for VS Code

Syntax highlighting and language support for XenoScript (`.xeno`) files.

## Features

- Syntax highlighting for XenoScript declarations, keywords, and values
- Bracket matching and auto-closing
- Comment toggling (`Cmd+/` or `Ctrl+/`)
- Code folding

## Installation

### Local Development

1. Open VS Code
2. Run the extension in development mode:

```bash
code --extensionDevelopmentPath=/path/to/tools/xenoscript/vscode-extension
```

Or use the VS Code command palette:
1. `Cmd+Shift+P` → "Developer: Install Extension from Location..."
2. Select this `vscode-extension` folder

### Symlink to Extensions Folder

For persistent local use:

```bash
# macOS/Linux
ln -s /path/to/tools/xenoscript/vscode-extension ~/.vscode/extensions/xenoscript

# Then restart VS Code
```

## Syntax Highlighting

The extension highlights:

| Element | Example | Color |
|---------|---------|-------|
| Keywords | `node`, `relation`, `constraint` | Purple/keyword |
| Type names | `MyNode` after `node` | Cyan/type |
| Properties | `about:`, `focus:`, `from:` | Variable color |
| Strings | `"hello"` | Green/string |
| Numbers | `42`, `3.14` | Orange/numeric |
| Booleans | `true`, `false`, `null` | Blue/constant |
| Comments | `# comment` | Gray |
| Operators | `→`, `->`, `=` | Operator color |

## Example

```xenoscript
# This is a comment
node MyProject {
  about: "a semantic graph"
  status: "active"
  horizon: 3
}

relation { from: MyProject, to: SubTask, type: spawned }
```
