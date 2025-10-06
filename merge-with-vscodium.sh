#!/bin/bash

# AcuxCode + VSCodium Automated Merge Script
# This script combines AcuxCode with VSCodium while automatically removing GitHub Copilot components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ACUXCODE_DIR="/Users/aaravpatel/Desktop/Developer/AcuxAI/AcuxCode"
VSCodium_REPO="https://github.com/VSCodium/vscodium.git"
VSCode_REPO="https://github.com/microsoft/vscode.git"
TARGET_DIR="$ACUXCODE_DIR/vscodium-merged"
BACKUP_DIR="$ACUXCODE_DIR/vscode-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}🚀 AcuxCode + VSCodium Automated Merge Script${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Backup current AcuxCode
echo -e "\n${BLUE}Step 1: Creating backup of current AcuxCode...${NC}"
if [ -d "$ACUXCODE_DIR/vscode" ]; then
    # Use rsync to handle symlinks properly and avoid errors
    rsync -av --exclude='node_modules' --exclude='out' --exclude='.git' "$ACUXCODE_DIR/vscode/" "$BACKUP_DIR/vscode/"
    print_status "Backup created at $BACKUP_DIR"
else
    print_error "AcuxCode vscode directory not found at $ACUXCODE_DIR/vscode"
    exit 1
fi

# Step 2: Clone VSCodium repository
echo -e "\n${BLUE}Step 2: Cloning VSCodium repository...${NC}"
if [ -d "$TARGET_DIR" ]; then
    print_warning "Target directory exists, removing..."
    rm -rf "$TARGET_DIR"
fi

git clone "$VSCodium_REPO" "$TARGET_DIR"
cd "$TARGET_DIR"

# Get the latest VSCode source
echo -e "\n${BLUE}Step 3: Getting VSCode source...${NC}"
git submodule update --init --recursive
if [ -d "vscode" ]; then
    cd vscode
    git fetch origin
    git checkout main
    git pull origin main
    cd ..
    print_status "VSCode source updated"
else
    print_warning "VSCode submodule not found, will use VSCodium's VSCode source"
fi

print_status "VSCodium and VSCode source ready"

# Step 3: Apply VSCodium patches
echo -e "\n${BLUE}Step 4: Applying VSCodium patches...${NC}"
if [ -f "./patch_code.sh" ]; then
    ./patch_code.sh
    print_status "VSCodium patches applied"
else
    print_warning "patch_code.sh not found, skipping patches"
fi

# Step 4: Copy AcuxCode components
echo -e "\n${BLUE}Step 5: Copying AcuxCode components...${NC}"

# Copy AcuxAI sidebar components
ACUXAI_SRC="$ACUXCODE_DIR/vscode/src/vs/workbench/contrib/chat/browser"
ACUXAI_DEST="$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser"

# Create backup of original chat components
mkdir -p "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/backup"
cp "$ACUXAI_DEST/chatViewPane.ts" "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/backup/" 2>/dev/null || true
cp "$ACUXAI_DEST/chat.contribution.ts" "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/backup/" 2>/dev/null || true

# Copy AcuxAI files
cp "$ACUXAI_SRC/acuxAiHeader.ts" "$ACUXAI_DEST/"
cp "$ACUXAI_SRC/acuxAiContextBar.ts" "$ACUXAI_DEST/"
cp "$ACUXAI_SRC/acuxAiChatManager.ts" "$ACUXAI_DEST/"
cp "$ACUXAI_SRC/chatViewPane.ts" "$ACUXAI_DEST/"
cp "$ACUXAI_SRC/chat.contribution.ts" "$ACUXAI_DEST/"

# Copy AcuxAI actions
mkdir -p "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/actions"
cp "$ACUXAI_SRC/actions/acuxAiActions.ts" "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/actions/"

# Copy AcuxAI styles
cp "$ACUXAI_SRC/media/acuxAiSidebar.css" "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/media/"

print_status "AcuxCode components copied"

# Step 5: Remove GitHub Copilot components
echo -e "\n${BLUE}Step 6: Removing GitHub Copilot components...${NC}"

# Remove Copilot-related files
find "$TARGET_DIR/vscode" -name "*copilot*" -type f -delete 2>/dev/null || true
find "$TARGET_DIR/vscode" -name "*Copilot*" -type f -delete 2>/dev/null || true

# Remove Copilot references from source files
find "$TARGET_DIR/vscode/src" -name "*.ts" -type f -exec sed -i '' '/copilot\|Copilot/d' {} \; 2>/dev/null || true
find "$TARGET_DIR/vscode/src" -name "*.js" -type f -exec sed -i '' '/copilot\|Copilot/d' {} \; 2>/dev/null || true

# Remove Copilot from product.json
if [ -f "$TARGET_DIR/vscode/product.json" ]; then
    # Create a backup
    cp "$TARGET_DIR/vscode/product.json" "$TARGET_DIR/vscode/product.json.backup"
    
    # Remove Copilot references using jq (if available) or sed
    if command -v jq &> /dev/null; then
        jq 'del(.builtInExtensions[] | select(.name | contains("copilot") or contains("Copilot")))' "$TARGET_DIR/vscode/product.json" > "$TARGET_DIR/vscode/product.json.tmp" && mv "$TARGET_DIR/vscode/product.json.tmp" "$TARGET_DIR/vscode/product.json"
    else
        # Fallback to sed for basic removal
        sed -i '' '/copilot\|Copilot/d' "$TARGET_DIR/vscode/product.json"
    fi
fi

# Remove Copilot from package.json scripts
if [ -f "$TARGET_DIR/vscode/package.json" ]; then
    sed -i '' '/copilot\|Copilot/d' "$TARGET_DIR/vscode/package.json"
fi

print_status "GitHub Copilot components removed"

# Step 6: Update product configuration for AcuxCode
echo -e "\n${BLUE}Step 7: Updating product configuration...${NC}"

# Update product.json with AcuxCode branding
cat > "$TARGET_DIR/vscode/product.json" << 'EOF'
{
	"nameShort": "AcuxCode",
	"nameLong": "AcuxCode",
	"applicationName": "acuxcode",
	"dataFolderName": ".acuxcode",
	"win32MutexName": "vscodeoss",
	"licenseName": "MIT",
	"licenseUrl": "https://github.com/microsoft/vscode/blob/main/LICENSE.txt",
	"serverLicenseUrl": "https://github.com/microsoft/vscode/blob/main/LICENSE.txt",
	"serverGreeting": [],
	"serverLicense": [],
	"serverLicensePrompt": "",
	"serverApplicationName": "code-server-oss",
	"serverDataFolderName": ".vscode-server-oss",
	"tunnelApplicationName": "code-tunnel-oss",
	"win32DirName": "AcuxCode",
	"win32NameVersion": "AcuxCode",
	"win32RegValueName": "AcuxCode",
	"win32x64AppId": "{{D77B7E06-80BA-4137-BCF4-654B95CCEBC5}",
	"win32arm64AppId": "{{D1ACE434-89C5-48D1-88D3-E2991DF85475}",
	"win32x64UserAppId": "{{CC6B787D-37A0-49E8-AE24-8559A032BE0C}",
	"win32arm64UserAppId": "{{3AEBF0C8-F733-4AD4-BADE-FDB816D53D7B}",
	"win32AppUserModelId": "Acux.AcuxCode",
	"win32ShellNameShort": "AcuxCode",
	"win32TunnelServiceMutex": "vscodeoss-tunnelservice",
	"win32TunnelMutex": "vscodeoss-tunnel",
	"darwinBundleIdentifier": "com.acux.acuxcode",
	"darwinProfileUUID": "47827DD9-4734-49A0-AF80-7E19B11495CC",
	"darwinProfilePayloadUUID": "CF808BE7-53F3-46C6-A7E2-7EDB98A5E959",
	"linuxIconName": "acuxcode",
	"licenseFileName": "LICENSE.txt",
	"reportIssueUrl": "https://github.com/microsoft/vscode/issues/new",
	"nodejsRepository": "https://nodejs.org",
	"urlProtocol": "acuxcode",
	"webviewContentExternalBaseUrlTemplate": "https://{{uuid}}.vscode-cdn.net/insider/ef65ac1ba57f57f2a3961bfe94aa20481caca4c6/out/vs/workbench/contrib/webview/browser/pre/",
	"extensionsGallery": {
		"serviceUrl": "https://marketplace.visualstudio.com/_apis/public/gallery",
		"itemUrl": "https://marketplace.visualstudio.com/items",
		"resourceUrlTemplate": "https://{publisher}.vscode-unpkg.net/{publisher}/{name}/{version}/{path}",
		"controlUrl": "",
		"recommendationsUrl": ""
	},
	"builtInExtensions": [
		{
			"name": "ms-vscode.js-debug-companion",
			"version": "1.1.3",
			"sha256": "7380a890787452f14b2db7835dfa94de538caf358ebc263f9d46dd68ac52de93",
			"repo": "https://github.com/microsoft/vscode-js-debug-companion",
			"metadata": {
				"id": "99cb0b7f-7354-4278-b8da-6cc79972169d",
				"publisherId": {
					"publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",
					"publisherName": "ms-vscode",
					"displayName": "Microsoft",
					"flags": "verified"
				},
				"publisherDisplayName": "Microsoft"
			}
		},
		{
			"name": "ms-vscode.js-debug",
			"version": "1.105.0",
			"sha256": "0c45b90342e8aafd4ff2963b4006de64208ca58c2fd01fea7a710fe61dcfd12a",
			"repo": "https://github.com/microsoft/vscode-js-debug",
			"metadata": {
				"id": "25629058-ddac-4e17-abba-74678e126c5d",
				"publisherId": {
					"publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",
					"publisherName": "ms-vscode",
					"displayName": "Microsoft",
					"flags": "verified"
				},
				"publisherDisplayName": "Microsoft"
			}
		},
		{
			"name": "ms-vscode.vscode-js-profile-table",
			"version": "1.0.10",
			"sha256": "7361748ddf9fd09d8a2ed1f2a2d7376a2cf9aae708692820b799708385c38e08",
			"repo": "https://github.com/microsoft/vscode-js-profile-visualizer",
			"metadata": {
				"id": "7e52b41b-71ad-457b-ab7e-0620f1fc4feb",
				"publisherId": {
					"publisherId": "5f5636e7-69ed-4afe-b5d6-8d231fb3d3ee",
					"publisherName": "ms-vscode",
					"displayName": "Microsoft",
					"flags": "verified"
				},
				"publisherDisplayName": "Microsoft"
			}
		}
	]
}
EOF

print_status "Product configuration updated for AcuxCode"

# Step 7: Install dependencies and build
echo -e "\n${BLUE}Step 8: Installing dependencies and building...${NC}"
cd "$TARGET_DIR/vscode"

# Install dependencies
npm install

# Download built-in extensions (without Copilot)
npm run download-builtin-extensions

print_status "Dependencies installed and extensions downloaded"

# Step 8: Create build script
echo -e "\n${BLUE}Step 9: Creating build script...${NC}"
cat > "$TARGET_DIR/build-acuxcode.sh" << 'EOF'
#!/bin/bash

# AcuxCode Build Script
set -e

echo "🚀 Building AcuxCode..."

cd vscode

# Start watch mode for development
echo "Starting watch mode..."
npm run watch &
WATCH_PID=$!

# Wait for initial compilation
echo "Waiting for initial compilation..."
sleep 30

# Launch AcuxCode
echo "Launching AcuxCode..."
./scripts/code.sh

# Cleanup on exit
trap "kill $WATCH_PID 2>/dev/null || true" EXIT
EOF

chmod +x "$TARGET_DIR/build-acuxcode.sh"

print_status "Build script created"

# Step 9: Create documentation
echo -e "\n${BLUE}Step 10: Creating documentation...${NC}"
cat > "$TARGET_DIR/ACUXCODE_VSCODIUM_MERGE.md" << 'EOF'
# AcuxCode + VSCodium Integration

This directory contains AcuxCode integrated with VSCodium, with GitHub Copilot components automatically removed.

## What's Included

- ✅ AcuxAI Sidebar with modern UI
- ✅ Model selection (Claude, GPT-4, Gemini, etc.)
- ✅ Context management (files, selection, open files)
- ✅ Chat session management
- ✅ Command palette integration
- ✅ VSCodium's open-source benefits
- ❌ GitHub Copilot (automatically removed)

## Quick Start

1. **Build and Run:**
   ```bash
   ./build-acuxcode.sh
   ```

2. **Development Mode:**
   ```bash
   cd vscode
   npm run watch
   # In another terminal:
   ./scripts/code.sh
   ```

## Key Features

### AcuxAI Sidebar
- Modern, clean interface
- Multiple AI model support
- Context-aware conversations
- Session management
- Theme integration

### VSCodium Benefits
- Open source
- No telemetry
- No proprietary Microsoft features
- Community-driven

## File Structure

```
vscodium-merged/
├── vscode/                          # VSCode source with VSCodium patches
│   ├── src/vs/workbench/contrib/chat/browser/
│   │   ├── acuxAiHeader.ts         # AcuxAI header component
│   │   ├── acuxAiContextBar.ts     # Context management
│   │   ├── acuxAiChatManager.ts    # Session management
│   │   ├── chatViewPane.ts         # Main integration
│   │   ├── chat.contribution.ts    # Actions registration
│   │   ├── actions/
│   │   │   └── acuxAiActions.ts    # Command palette actions
│   │   └── media/
│   │       └── acuxAiSidebar.css   # Styling
│   └── product.json                # AcuxCode branding
├── build-acuxcode.sh               # Build script
└── ACUXCODE_VSCODIUM_MERGE.md     # This file
```

## Customization

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

### Styling
Edit `vscode/src/vs/workbench/contrib/chat/browser/media/acuxAiSidebar.css`

### Actions
Add new actions in `vscode/src/vs/workbench/contrib/chat/browser/actions/acuxAiActions.ts`

## Troubleshooting

1. **Build fails:** Check that all dependencies are installed
2. **AcuxAI sidebar not showing:** Ensure watch mode is running
3. **Styling issues:** Check CSS file is properly loaded

## Backup

Original AcuxCode is backed up at: `../vscode-backup-YYYYMMDD-HHMMSS/`

## License

This integration combines:
- VSCodium (MIT License)
- AcuxCode customizations (MIT License)
- VSCode source (MIT License)
EOF

print_status "Documentation created"

# Final summary
echo -e "\n${GREEN}🎉 Merge Complete!${NC}"
echo "=================="
echo -e "✅ AcuxCode + VSCodium integration ready"
echo -e "✅ GitHub Copilot automatically removed"
echo -e "✅ AcuxAI sidebar integrated"
echo -e "✅ Build scripts created"
echo -e "✅ Documentation provided"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. cd $TARGET_DIR"
echo "2. ./build-acuxcode.sh"
echo ""
echo -e "${YELLOW}Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}Target directory: $TARGET_DIR${NC}"
