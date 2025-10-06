# 🚀 AcuxCode + VSCodium Integration Guide

This guide explains how to automatically combine your AcuxCode with VSCodium while removing all GitHub Copilot components, eliminating the need for manual cleanup.

## 🎯 What This Solves

- **Manual Copilot Removal**: No more manually searching and removing GitHub Copilot components
- **Automated Integration**: One script combines AcuxCode with VSCodium
- **Clean Build**: VSCodium's open-source benefits without proprietary Microsoft features
- **AcuxAI Sidebar**: Your custom AI sidebar integrated seamlessly

## 📋 Prerequisites

- macOS/Linux environment
- Git installed
- Node.js and npm installed
- At least 10GB free disk space

## 🚀 Quick Start

### Option 1: Automated Merge (Recommended)

```bash
# Run the automated merge script
./merge-with-vscodium.sh
```

This single command will:
1. ✅ Backup your current AcuxCode
2. ✅ Clone VSCodium repository
3. ✅ Apply VSCodium patches
4. ✅ Copy your AcuxAI components
5. ✅ Remove all GitHub Copilot components
6. ✅ Update product configuration
7. ✅ Install dependencies
8. ✅ Create build scripts

### Option 2: Manual Step-by-Step

If you prefer manual control, follow these steps:

```bash
# 1. Clone VSCodium
git clone https://github.com/VSCodium/vscodium.git vscodium-merged
cd vscodium-merged

# 2. Get VSCode source
git submodule update --init --recursive
cd vscode
git checkout main
git pull origin main
cd ..

# 3. Apply VSCodium patches
./patch_code.sh

# 4. Remove GitHub Copilot
node ../copilot-removal-script.js vscode

# 5. Copy AcuxCode components
# (Copy your AcuxAI files to vscode/src/vs/workbench/contrib/chat/browser/)

# 6. Install and build
cd vscode
npm install
npm run download-builtin-extensions
```

## 🛠️ Available Scripts

### 1. `merge-with-vscodium.sh`
**Main integration script**
- Combines AcuxCode with VSCodium
- Automatically removes GitHub Copilot
- Creates build scripts
- Generates documentation

**Usage:**
```bash
./merge-with-vscodium.sh
```

### 2. `copilot-removal-script.js`
**Standalone Copilot removal tool**
- Removes GitHub Copilot from any VSCode source
- Can be used independently
- Supports dry-run mode

**Usage:**
```bash
# Dry run (see what would be removed)
node copilot-removal-script.js /path/to/vscode --dry-run

# Actually remove Copilot
node copilot-removal-script.js /path/to/vscode

# Verbose output
node copilot-removal-script.js /path/to/vscode --verbose
```

## 📁 Output Structure

After running the merge script, you'll have:

```
vscodium-merged/
├── vscode/                          # VSCode source with VSCodium patches
│   ├── src/vs/workbench/contrib/chat/browser/
│   │   ├── acuxAiHeader.ts         # Your AcuxAI header
│   │   ├── acuxAiContextBar.ts     # Context management
│   │   ├── acuxAiChatManager.ts    # Session management
│   │   ├── chatViewPane.ts         # Main integration
│   │   ├── chat.contribution.ts    # Actions registration
│   │   ├── actions/
│   │   │   └── acuxAiActions.ts    # Command palette actions
│   │   └── media/
│   │       └── acuxAiSidebar.css   # Styling
│   ├── product.json                # AcuxCode branding
│   └── package.json                # Dependencies
├── build-acuxcode.sh               # Build script
├── ACUXCODE_VSCODIUM_MERGE.md     # Integration docs
└── vscode-backup-YYYYMMDD-HHMMSS/ # Your original backup
```

## 🔧 What Gets Removed

The automated process removes:

### Files
- `**/*copilot*` - Any file with "copilot" in the name
- `**/*Copilot*` - Any file with "Copilot" in the name
- Copilot-specific directories

### Code References
- Copilot imports and exports
- Copilot service registrations
- Copilot command palette entries
- Copilot settings and configurations

### Extensions
- GitHub Copilot extension
- GitHub Copilot Chat extension
- Any other Copilot-related extensions

### Build Configuration
- Copilot build scripts
- Copilot webpack entries
- Copilot test configurations

## 🎨 What Gets Added

Your AcuxCode components:

### AcuxAI Sidebar
- Modern header with model selector
- Context management bar
- Chat session manager
- Command palette integration
- Custom styling

### Product Branding
- AcuxCode name and branding
- Custom bundle identifier
- AcuxCode-specific configurations

## 🚀 Building and Running

After the merge is complete:

```bash
cd vscodium-merged

# Quick start
./build-acuxcode.sh

# Or manual build
cd vscode
npm run watch &
./scripts/code.sh
```

## 🔍 Verification

To verify the integration worked:

1. **Check AcuxAI Sidebar**: Look for the AcuxAI icon in the activity bar
2. **Verify No Copilot**: Search for "copilot" in the codebase - should find nothing
3. **Test Build**: Ensure the build completes without errors
4. **Check Extensions**: Verify no Copilot extensions are installed

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
cd vscode
rm -rf node_modules out
npm install
npm run compile
```

### AcuxAI Sidebar Not Showing
```bash
# Check if watch mode is running
ps aux | grep "npm run watch"

# Restart watch mode
cd vscode
npm run watch
```

### Copilot Still Present
```bash
# Run the removal script again
node ../copilot-removal-script.js vscode --verbose
```

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Advanced Usage

### Custom Copilot Removal

If you need to customize what gets removed:

```javascript
// Edit copilot-removal-script.js
const COPILOT_PATTERNS = [
    /copilot/gi,
    /Copilot/gi,
    /your-custom-pattern/gi  // Add your patterns
];
```

### Selective Integration

To integrate only specific AcuxCode components:

```bash
# Copy only what you need
cp vscode/src/vs/workbench/contrib/chat/browser/acuxAiHeader.ts \
   vscodium-merged/vscode/src/vs/workbench/contrib/chat/browser/
```

### Custom Build Configuration

Edit the build script to add your custom build steps:

```bash
# Edit build-acuxcode.sh
# Add your custom build commands
```

## 🔄 Updating

To update with newer VSCodium versions:

```bash
cd vscodium-merged
git pull origin main
cd vscode
git pull origin main
cd ..
./patch_code.sh
node ../copilot-removal-script.js vscode
# Re-copy your AcuxCode components
```

## 📝 Customization

### Adding New Models
Edit `vscode/src/vs/workbench/contrib/chat/browser/chatViewPane.ts`:

```typescript
{ 
  id: 'new-model', 
  name: 'New Model', 
  description: 'Description',
  contextWindow: '100K',
  speed: 'Fast'
}
```

### Styling Changes
Edit `vscode/src/vs/workbench/contrib/chat/browser/media/acuxAiSidebar.css`

### New Actions
Add to `vscode/src/vs/workbench/contrib/chat/browser/actions/acuxAiActions.ts`

## 🎯 Benefits

### VSCodium Benefits
- ✅ Open source (MIT License)
- ✅ No telemetry or tracking
- ✅ No proprietary Microsoft features
- ✅ Community-driven development
- ✅ Regular updates from VSCode

### AcuxCode Benefits
- ✅ Your custom AI sidebar
- ✅ Multiple AI model support
- ✅ Modern, clean interface
- ✅ Context-aware conversations
- ✅ Session management

### Automation Benefits
- ✅ No manual Copilot removal
- ✅ One-command integration
- ✅ Automated backup
- ✅ Build script generation
- ✅ Comprehensive documentation

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check the backup directory for your original files
4. Run with `--verbose` flag for detailed output

## 🎉 Success!

After running the integration, you'll have:
- A clean VSCodium build without GitHub Copilot
- Your AcuxAI sidebar fully integrated
- Automated build and development scripts
- Complete documentation and backup

Your AcuxCode is now ready for development and distribution! 🚀
