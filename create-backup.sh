#!/bin/bash

# AcuxCode Backup Script
# Creates a comprehensive backup before VSCodium integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ACUXCODE_DIR="/Users/aaravpatel/Desktop/Developer/AcuxAI/AcuxCode"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$ACUXCODE_DIR/backup-$TIMESTAMP"
VSCode_DIR="$ACUXCODE_DIR/vscode"

echo -e "${BLUE}🛡️  AcuxCode Backup Script${NC}"
echo "=============================="

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

# Check if VSCode directory exists
if [ ! -d "$VSCode_DIR" ]; then
    print_error "VSCode directory not found at $VSCode_DIR"
    exit 1
fi

# Create backup directory
echo -e "\n${BLUE}Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
print_status "Backup directory created: $BACKUP_DIR"

# Backup VSCode source
echo -e "\n${BLUE}Backing up VSCode source...${NC}"
if [ -d "$VSCode_DIR" ]; then
    # Use rsync to handle symlinks properly
    rsync -av --exclude='node_modules' --exclude='out' --exclude='.git' "$VSCode_DIR/" "$BACKUP_DIR/vscode/"
    print_status "VSCode source backed up"
else
    print_warning "VSCode directory not found, skipping..."
fi

# Backup AcuxCode specific files
echo -e "\n${BLUE}Backing up AcuxCode specific files...${NC}"

# Backup AcuxAI components
ACUXAI_FILES=(
    "vscode/src/vs/workbench/contrib/chat/browser/acuxAiHeader.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/acuxAiContextBar.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/acuxAiChatManager.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/chatViewPane.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/chat.contribution.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/actions/acuxAiActions.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/media/acuxAiSidebar.css"
)

mkdir -p "$BACKUP_DIR/acuxai-components"
for file in "${ACUXAI_FILES[@]}"; do
    if [ -f "$ACUXCODE_DIR/$file" ]; then
        cp "$ACUXCODE_DIR/$file" "$BACKUP_DIR/acuxai-components/"
        print_status "Backed up: $(basename "$file")"
    else
        print_warning "File not found: $file"
    fi
done

# Backup configuration files
echo -e "\n${BLUE}Backing up configuration files...${NC}"
CONFIG_FILES=(
    "vscode/product.json"
    "vscode/package.json"
    "vscode/package-lock.json"
)

mkdir -p "$BACKUP_DIR/config"
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$ACUXCODE_DIR/$file" ]; then
        cp "$ACUXCODE_DIR/$file" "$BACKUP_DIR/config/"
        print_status "Backed up: $(basename "$file")"
    else
        print_warning "Config file not found: $file"
    fi
done

# Backup documentation
echo -e "\n${BLUE}Backing up documentation...${NC}"
DOC_FILES=(
    "ARCHITECTURE.md"
    "IMPLEMENTATION_SUMMARY.md"
    "ACUXAI_SIDEBAR_GUIDE.md"
    "COPILOT_SIDEBAR_EDITING_GUIDE.md"
    "ACUXCODE_SETUP_COMPLETE.md"
    "QUICK_START.md"
    "vscode_fork_commands.txt"
)

mkdir -p "$BACKUP_DIR/docs"
for file in "${DOC_FILES[@]}"; do
    if [ -f "$ACUXCODE_DIR/$file" ]; then
        cp "$ACUXCODE_DIR/$file" "$BACKUP_DIR/docs/"
        print_status "Backed up: $file"
    else
        print_warning "Doc file not found: $file"
    fi
done

# Backup scripts
echo -e "\n${BLUE}Backing up scripts...${NC}"
SCRIPT_FILES=(
    "merge-with-vscodium.sh"
    "copilot-removal-script.js"
    "VSCODIUM_INTEGRATION_GUIDE.md"
)

mkdir -p "$BACKUP_DIR/scripts"
for file in "${SCRIPT_FILES[@]}"; do
    if [ -f "$ACUXCODE_DIR/$file" ]; then
        cp "$ACUXCODE_DIR/$file" "$BACKUP_DIR/scripts/"
        print_status "Backed up: $file"
    else
        print_warning "Script file not found: $file"
    fi
done

# Create backup manifest
echo -e "\n${BLUE}Creating backup manifest...${NC}"
cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# AcuxCode Backup Manifest

**Backup Date:** $(date)
**Backup Location:** $BACKUP_DIR
**Original Location:** $ACUXCODE_DIR

## Contents

### VSCode Source
- Complete VSCode source code with AcuxCode modifications
- Location: \`vscode/\`

### AcuxAI Components
- \`acuxAiHeader.ts\` - Header component with model selector
- \`acuxAiContextBar.ts\` - Context management bar
- \`acuxAiChatManager.ts\` - Chat session manager
- \`chatViewPane.ts\` - Main integration file
- \`chat.contribution.ts\` - Actions registration
- \`actions/acuxAiActions.ts\` - Command palette actions
- \`media/acuxAiSidebar.css\` - Styling

### Configuration Files
- \`product.json\` - AcuxCode branding and configuration
- \`package.json\` - Dependencies and scripts
- \`package-lock.json\` - Locked dependency versions

### Documentation
- Architecture documentation
- Implementation guides
- Setup instructions
- Quick start guide

### Scripts
- VSCodium integration script
- Copilot removal script
- Integration guide

## Restoration

To restore from this backup:

1. **Full Restore:**
   \`\`\`bash
   cp -r $BACKUP_DIR/vscode $ACUXCODE_DIR/
   \`\`\`

2. **Component Restore:**
   \`\`\`bash
   cp -r $BACKUP_DIR/acuxai-components/* $ACUXCODE_DIR/vscode/src/vs/workbench/contrib/chat/browser/
   \`\`\`

3. **Config Restore:**
   \`\`\`bash
   cp $BACKUP_DIR/config/* $ACUXCODE_DIR/vscode/
   \`\`\`

## Verification

After restoration, verify:
- AcuxAI sidebar appears in activity bar
- All components load without errors
- Build process completes successfully
- No missing dependencies

## Backup Size

\`\`\`bash
du -sh $BACKUP_DIR
\`\`\`

## Git Status

\`\`\`bash
cd $ACUXCODE_DIR
git status
git log --oneline -10
\`\`\`
EOF

print_status "Backup manifest created"

# Get backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
print_status "Backup size: $BACKUP_SIZE"

# Create restore script
echo -e "\n${BLUE}Creating restore script...${NC}"
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/bin/bash

# AcuxCode Restore Script
# Restores AcuxCode from backup

set -e

BACKUP_DIR="$(dirname "$0")"
ACUXCODE_DIR="/Users/aaravpatel/Desktop/Developer/AcuxAI/AcuxCode"

echo "🔄 Restoring AcuxCode from backup..."
echo "Backup: $BACKUP_DIR"
echo "Target: $ACUXCODE_DIR"

# Confirm restoration
read -p "This will overwrite current AcuxCode. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restoration cancelled."
    exit 1
fi

# Restore VSCode source
if [ -d "$BACKUP_DIR/vscode" ]; then
    echo "Restoring VSCode source..."
    rm -rf "$ACUXCODE_DIR/vscode"
    cp -r "$BACKUP_DIR/vscode" "$ACUXCODE_DIR/"
    echo "✅ VSCode source restored"
fi

# Restore AcuxAI components
if [ -d "$BACKUP_DIR/acuxai-components" ]; then
    echo "Restoring AcuxAI components..."
    cp -r "$BACKUP_DIR/acuxai-components"/* "$ACUXCODE_DIR/vscode/src/vs/workbench/contrib/chat/browser/"
    echo "✅ AcuxAI components restored"
fi

# Restore configuration
if [ -d "$BACKUP_DIR/config" ]; then
    echo "Restoring configuration..."
    cp "$BACKUP_DIR/config"/* "$ACUXCODE_DIR/vscode/"
    echo "✅ Configuration restored"
fi

echo "🎉 Restoration complete!"
echo "Run 'cd $ACUXCODE_DIR/vscode && npm install && npm run watch' to start development"
EOF

chmod +x "$BACKUP_DIR/restore.sh"
print_status "Restore script created"

# Create quick verification script
cat > "$BACKUP_DIR/verify.sh" << 'EOF'
#!/bin/bash

# AcuxCode Backup Verification Script

BACKUP_DIR="$(dirname "$0")"

echo "🔍 Verifying AcuxCode backup..."

# Check critical files
CRITICAL_FILES=(
    "vscode/src/vs/workbench/contrib/chat/browser/acuxAiHeader.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/acuxAiContextBar.ts"
    "vscode/src/vs/workbench/contrib/chat/browser/acuxAiChatManager.ts"
    "vscode/product.json"
    "acuxai-components/acuxAiHeader.ts"
    "config/product.json"
)

echo "Checking critical files..."
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$BACKUP_DIR/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (MISSING)"
    fi
done

# Check backup size
echo ""
echo "Backup size:"
du -sh "$BACKUP_DIR"

# Check file counts
echo ""
echo "File counts:"
echo "VSCode files: $(find "$BACKUP_DIR/vscode" -type f 2>/dev/null | wc -l)"
echo "AcuxAI components: $(find "$BACKUP_DIR/acuxai-components" -type f 2>/dev/null | wc -l)"
echo "Config files: $(find "$BACKUP_DIR/config" -type f 2>/dev/null | wc -l)"
echo "Documentation: $(find "$BACKUP_DIR/docs" -type f 2>/dev/null | wc -l)"

echo ""
echo "✅ Backup verification complete!"
EOF

chmod +x "$BACKUP_DIR/verify.sh"
print_status "Verification script created"

# Run verification
echo -e "\n${BLUE}Running backup verification...${NC}"
"$BACKUP_DIR/verify.sh"

# Final summary
echo -e "\n${GREEN}🎉 Backup Complete!${NC}"
echo "=================="
echo -e "✅ Backup created: $BACKUP_DIR"
echo -e "✅ Size: $BACKUP_SIZE"
echo -e "✅ Restore script: $BACKUP_DIR/restore.sh"
echo -e "✅ Verification: $BACKUP_DIR/verify.sh"
echo ""
echo -e "${BLUE}To restore from this backup:${NC}"
echo "cd $BACKUP_DIR && ./restore.sh"
echo ""
echo -e "${YELLOW}You can now safely run the VSCodium integration!${NC}"
echo "Run: ./merge-with-vscodium.sh"
