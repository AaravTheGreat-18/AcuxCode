#!/usr/bin/env node

/**
 * GitHub Copilot Removal Script
 * Automatically removes GitHub Copilot components from VSCode source
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const VSCode_DIR = process.argv[2] || './vscode';
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Copilot-related patterns to remove
const COPILOT_PATTERNS = [
    /copilot/gi,
    /Copilot/gi,
    /github.*copilot/gi,
    /copilot.*github/gi
];

// Files to completely remove
const FILES_TO_REMOVE = [
    '**/*copilot*',
    '**/*Copilot*',
    '**/copilot*',
    '**/Copilot*'
];

// Directories to clean
const DIRS_TO_CLEAN = [
    'extensions/github-copilot',
    'extensions/github-copilot-chat',
    'src/vs/workbench/contrib/copilot',
    'src/vs/workbench/services/copilot'
];

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        warning: '\x1b[33m',
        error: '\x1b[31m',
        reset: '\x1b[0m'
    };
    
    const prefix = {
        info: 'ℹ️ ',
        success: '✅ ',
        warning: '⚠️ ',
        error: '❌ '
    };
    
    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function findFiles(dir, pattern) {
    const results = [];
    
    function search(currentDir) {
        try {
            const files = fs.readdirSync(currentDir);
            
            for (const file of files) {
                const fullPath = path.join(currentDir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    search(fullPath);
                } else if (pattern.test(file)) {
                    results.push(fullPath);
                }
            }
        } catch (err) {
            // Skip directories we can't read
        }
    }
    
    search(dir);
    return results;
}

function removeCopilotFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let modified = content;
        let hasChanges = false;
        
        // Remove lines containing copilot patterns
        const lines = content.split('\n');
        const filteredLines = lines.filter(line => {
            const shouldKeep = !COPILOT_PATTERNS.some(pattern => pattern.test(line));
            if (!shouldKeep) {
                hasChanges = true;
                if (VERBOSE) {
                    log(`Removing line: ${line.trim()}`, 'warning');
                }
            }
            return shouldKeep;
        });
        
        if (hasChanges) {
            modified = filteredLines.join('\n');
            
            if (!DRY_RUN) {
                fs.writeFileSync(filePath, modified, 'utf8');
                log(`Cleaned: ${path.relative(VSCode_DIR, filePath)}`, 'success');
            } else {
                log(`Would clean: ${path.relative(VSCode_DIR, filePath)}`, 'info');
            }
        }
        
        return hasChanges;
    } catch (err) {
        log(`Error processing ${filePath}: ${err.message}`, 'error');
        return false;
    }
}

function removeCopilotFromJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        let hasChanges = false;
        
        // Remove copilot references from builtInExtensions
        if (data.builtInExtensions && Array.isArray(data.builtInExtensions)) {
            const originalLength = data.builtInExtensions.length;
            data.builtInExtensions = data.builtInExtensions.filter(ext => {
                const name = ext.name || '';
                const shouldKeep = !COPILOT_PATTERNS.some(pattern => pattern.test(name));
                if (!shouldKeep) {
                    hasChanges = true;
                    if (VERBOSE) {
                        log(`Removing extension: ${name}`, 'warning');
                    }
                }
                return shouldKeep;
            });
            
            if (data.builtInExtensions.length !== originalLength) {
                log(`Removed ${originalLength - data.builtInExtensions.length} copilot extensions`, 'success');
            }
        }
        
        // Remove copilot references from scripts
        if (data.scripts) {
            for (const [key, value] of Object.entries(data.scripts)) {
                if (typeof value === 'string' && COPILOT_PATTERNS.some(pattern => pattern.test(value))) {
                    delete data.scripts[key];
                    hasChanges = true;
                    if (VERBOSE) {
                        log(`Removing script: ${key}`, 'warning');
                    }
                }
            }
        }
        
        if (hasChanges) {
            if (!DRY_RUN) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                log(`Cleaned JSON: ${path.relative(VSCode_DIR, filePath)}`, 'success');
            } else {
                log(`Would clean JSON: ${path.relative(VSCode_DIR, filePath)}`, 'info');
            }
        }
        
        return hasChanges;
    } catch (err) {
        log(`Error processing JSON ${filePath}: ${err.message}`, 'error');
        return false;
    }
}

function removeFiles() {
    log('Removing copilot-related files...', 'info');
    
    for (const pattern of FILES_TO_REMOVE) {
        try {
            const files = findFiles(VSCode_DIR, new RegExp(pattern.replace(/\*/g, '.*')));
            
            for (const file of files) {
                if (!DRY_RUN) {
                    fs.unlinkSync(file);
                    log(`Removed file: ${path.relative(VSCode_DIR, file)}`, 'success');
                } else {
                    log(`Would remove file: ${path.relative(VSCode_DIR, file)}`, 'info');
                }
            }
        } catch (err) {
            log(`Error removing files with pattern ${pattern}: ${err.message}`, 'error');
        }
    }
}

function cleanDirectories() {
    log('Cleaning copilot directories...', 'info');
    
    for (const dir of DIRS_TO_CLEAN) {
        const fullPath = path.join(VSCode_DIR, dir);
        
        if (fs.existsSync(fullPath)) {
            if (!DRY_RUN) {
                execSync(`rm -rf "${fullPath}"`, { stdio: 'pipe' });
                log(`Removed directory: ${dir}`, 'success');
            } else {
                log(`Would remove directory: ${dir}`, 'info');
            }
        }
    }
}

function cleanSourceFiles() {
    log('Cleaning source files...', 'info');
    
    const extensions = ['.ts', '.js', '.json', '.css', '.html'];
    let totalFiles = 0;
    let cleanedFiles = 0;
    
    function processDirectory(dir) {
        try {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    processDirectory(fullPath);
                } else {
                    const ext = path.extname(file);
                    if (extensions.includes(ext)) {
                        totalFiles++;
                        
                        if (ext === '.json') {
                            if (removeCopilotFromJSON(fullPath)) {
                                cleanedFiles++;
                            }
                        } else {
                            if (removeCopilotFromFile(fullPath)) {
                                cleanedFiles++;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // Skip directories we can't read
        }
    }
    
    processDirectory(VSCode_DIR);
    
    log(`Processed ${totalFiles} files, cleaned ${cleanedFiles} files`, 'success');
}

function main() {
    log('GitHub Copilot Removal Script', 'info');
    log('=============================', 'info');
    
    if (DRY_RUN) {
        log('Running in DRY RUN mode - no files will be modified', 'warning');
    }
    
    if (!fs.existsSync(VSCode_DIR)) {
        log(`VSCode directory not found: ${VSCode_DIR}`, 'error');
        process.exit(1);
    }
    
    log(`Processing directory: ${VSCode_DIR}`, 'info');
    
    // Step 1: Remove copilot files
    removeFiles();
    
    // Step 2: Clean directories
    cleanDirectories();
    
    // Step 3: Clean source files
    cleanSourceFiles();
    
    log('Copilot removal complete!', 'success');
    
    if (DRY_RUN) {
        log('Run without --dry-run to apply changes', 'info');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    removeCopilotFromFile,
    removeCopilotFromJSON,
    findFiles,
    COPILOT_PATTERNS
};
