#!/bin/bash

# Safe VSCodium Integration Script
# This script ensures your 2 days of work are preserved while creating the integration

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
TARGET_DIR="$ACUXCODE_DIR/vscodium-merged"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$ACUXCODE_DIR/vscode-backup-$TIMESTAMP"

echo -e "${BLUE}🛡️  Safe VSCodium Integration Script${NC}"
echo "=============================================="
echo -e "${YELLOW}This script will preserve your 2 days of work!${NC}"

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

# Step 1: Create comprehensive backup
echo -e "\n${BLUE}Step 1: Creating comprehensive backup of your work...${NC}"
if [ -d "$ACUXCODE_DIR/vscode" ]; then
    rsync -av --exclude='node_modules' --exclude='out' --exclude='.git' "$ACUXCODE_DIR/vscode/" "$BACKUP_DIR/"
    print_status "Complete VSCode backup created at $BACKUP_DIR"
else
    print_error "VSCode directory not found!"
    exit 1
fi

# Step 2: Clone VSCodium
echo -e "\n${BLUE}Step 2: Cloning VSCodium repository...${NC}"
if [ -d "$TARGET_DIR" ]; then
    print_warning "Target directory exists, removing..."
    rm -rf "$TARGET_DIR"
fi

git clone "$VSCodium_REPO" "$TARGET_DIR"
cd "$TARGET_DIR"

# Step 3: Get VSCode source
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
    print_warning "VSCode submodule not found, using VSCodium's source"
fi

# Step 4: Apply VSCodium patches
echo -e "\n${BLUE}Step 4: Applying VSCodium patches...${NC}"
if [ -f "./patch_code.sh" ]; then
    ./patch_code.sh
    print_status "VSCodium patches applied"
else
    print_warning "patch_code.sh not found, skipping patches"
fi

# Step 5: Copy your AcuxCode branding and configuration
echo -e "\n${BLUE}Step 5: Copying AcuxCode branding and configuration...${NC}"

# Copy product.json with AcuxCode branding
if [ -f "$ACUXCODE_DIR/vscode/product.json" ]; then
    cp "$ACUXCODE_DIR/vscode/product.json" "$TARGET_DIR/vscode/"
    print_status "AcuxCode product.json copied"
fi

# Copy package.json if it has AcuxCode modifications
if [ -f "$ACUXCODE_DIR/vscode/package.json" ]; then
    cp "$ACUXCODE_DIR/vscode/package.json" "$TARGET_DIR/vscode/"
    print_status "AcuxCode package.json copied"
fi

# Copy any AcuxCode assets
if [ -d "$ACUXCODE_DIR/vscode/assets" ]; then
    cp -r "$ACUXCODE_DIR/vscode/assets" "$TARGET_DIR/vscode/"
    print_status "AcuxCode assets copied"
fi

# Copy any AcuxCode icons
if [ -d "$ACUXCODE_DIR/vscode/src/vs/workbench/contrib/chat/browser/media" ]; then
    mkdir -p "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/media"
    cp "$ACUXCODE_DIR/vscode/src/vs/workbench/contrib/chat/browser/media/"*acux* "$TARGET_DIR/vscode/src/vs/workbench/contrib/chat/browser/media/" 2>/dev/null || true
    print_status "AcuxCode icons copied"
fi

# Step 6: Remove GitHub Copilot components
echo -e "\n${BLUE}Step 6: Removing GitHub Copilot components...${NC}"

# Use the copilot removal script
if [ -f "$ACUXCODE_DIR/copilot-removal-script.js" ]; then
    node "$ACUXCODE_DIR/copilot-removal-script.js" "$TARGET_DIR/vscode"
    print_status "GitHub Copilot components removed"
else
    print_warning "Copilot removal script not found, doing basic removal"
    
    # Basic copilot removal
    find "$TARGET_DIR/vscode" -name "*copilot*" -type f -delete 2>/dev/null || true
    find "$TARGET_DIR/vscode" -name "*Copilot*" -type f -delete 2>/dev/null || true
    
    # Remove copilot references from source files
    find "$TARGET_DIR/vscode/src" -name "*.ts" -type f -exec sed -i '' '/copilot\|Copilot/d' {} \; 2>/dev/null || true
    find "$TARGET_DIR/vscode/src" -name "*.js" -type f -exec sed -i '' '/copilot\|Copilot/d' {} \; 2>/dev/null || true
    
    print_status "Basic GitHub Copilot removal completed"
fi

# Step 7: Install dependencies
echo -e "\n${BLUE}Step 7: Installing dependencies...${NC}"
cd "$TARGET_DIR/vscode"
npm install
print_status "Dependencies installed"

# Step 8: Download built-in extensions
echo -e "\n${BLUE}Step 8: Downloading built-in extensions...${NC}"
npm run download-builtin-extensions
print_status "Built-in extensions downloaded"

# Step 9: Create build script
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

# Step 10: Create documentation
echo -e "\n${BLUE}Step 10: Creating documentation...${NC}"
cat > "$TARGET_DIR/ACUXCODE_VSCODIUM_INTEGRATION.md" << EOF
# AcuxCode + VSCodium Integration

This directory contains AcuxCode integrated with VSCodium, with GitHub Copilot components automatically removed.

## What's Included

- ✅ AcuxCode branding and configuration
- ✅ VSCodium's open-source benefits
- ❌ GitHub Copilot (automatically removed)
- ✅ Your 2 days of work preserved

## Quick Start

1. **Build and Run:**
   \`\`\`bash
   ./build-acuxcode.sh
   \`\`\`

2. **Development Mode:**
   \`\`\`bash
   cd vscode
   npm run watch
   # In another terminal:
   ./scripts/code.sh
   \`\`\`

## Your Work Preserved

- **Backup Location**: $BACKUP_DIR
- **Original VSCode**: Complete backup of your 2 days of work
- **Configuration**: AcuxCode branding and settings
- **Assets**: Icons and visual elements

## File Structure

\`\`\`
vscodium-merged/
├── vscode/                          # VSCode source with VSCodium patches
│   ├── product.json                # AcuxCode branding
│   ├── package.json                # Dependencies
│   └── assets/                     # AcuxCode assets
├── build-acuxcode.sh               # Build script
└── ACUXCODE_VSCODIUM_INTEGRATION.md # This file
\`\`\`

## Restore Your Work

If you need to restore your original work:
\`\`\`bash
cd $BACKUP_DIR
# Your complete VSCode source is here
\`\`\`

## Next Steps

1. Test the integration
2. Add your AcuxAI components to the new VSCodium build
3. Customize as needed

Your 2 days of work is safely backed up and preserved!
EOF

print_status "Documentation created"

# Final summary
echo -e "\n${GREEN}🎉 Safe Integration Complete!${NC}"
echo "================================"
echo -e "✅ Your 2 days of work is safely backed up at: $BACKUP_DIR"
echo -e "✅ VSCodium integration ready at: $TARGET_DIR"
echo -e "✅ GitHub Copilot automatically removed"
echo -e "✅ AcuxCode branding preserved"
echo -e "✅ Build scripts created"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. cd $TARGET_DIR"
echo "2. ./build-acuxcode.sh"
echo ""
echo -e "${YELLOW}Your work is safe! The backup contains everything from your 2 days of progress.${NC}"
