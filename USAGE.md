# TokenTrim - Usage Guide

## Getting Started

### Installation

1. **From VS Code Marketplace** (Coming Soon)
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "TokenTrim"
   - Click Install

2. **Manual Installation** (Development)
   ```bash
   git clone <repository>
   cd TokenTrim
   npm install
   npm run esbuild
   vsce package
   ```

### First-Time Setup

1. **Open a Project**
   ```
   File → Open Folder
   ```
   Select any project directory (Node.js, Python, Rust, etc.)

2. **Activate TokenTrim**
   - Click the **⚡ TokenTrim** icon in the Activity Bar (left sidebar)
   - Wait for "Compression Ready" status (5-15 seconds)

3. **Start Using It**
   - Type a question in the input box
   - Press **Shift+Enter** or click **Send to Copilot**
   - Your prompt + compressed context goes to Copilot

## Core Workflows

### Workflow 1: Ask Copilot Project-Aware Questions

**Scenario**: You want to understand the architecture of your project

**Steps**:
1. Open TokenTrim sidebar
2. Type: `"What's the overall architecture of this project?"`
3. Press Shift+Enter
4. TokenTrim automatically includes compressed project structure
5. Copilot responds with full context awareness

**Result**: Better answers because Copilot sees your actual code structure

---

### Workflow 2: Explain Errors with Context

**Scenario**: You get a build error and need Copilot to explain it

**Steps**:
1. Copy the error message
2. In TokenTrim, type: `"I'm getting this error: [paste error]. What's wrong?"`
3. Send to Copilot
4. Copilot understands the context + error

**Result**: Relevant fix suggestions using your actual codebase

---

### Workflow 3: Code Generation with Context

**Scenario**: You need Copilot to generate code that fits your project

**Steps**:
1. TokenTrim has already cached your patterns, conventions, and structure
2. Ask: `"Add a new REST endpoint that follows the patterns in this project"`
3. Copilot generates code matching your style

**Result**: Generated code integrates seamlessly

---

### Workflow 4: Manual Recache

**Scenario**: You made major changes and want fresh context

**Steps**:
1. Click **🔄 Recache Context** button
2. Wait for "Compression Ready" message
3. Continue using TokenTrim normally

**Result**: Cache updated with latest files

---

### Workflow 5: View Compression Details

**Scenario**: You're curious about what was removed

**Steps**:
1. Click on the **Compressed Lines** number
2. A markdown document opens with full details:
   - Compression ratio
   - List of techniques used
   - Full compressed content
   - Statistics

**Result**: Understand what TokenTrim is doing behind the scenes

---

## Configuration Examples

### Example 1: Maximum Compression (For Large Projects)

```json
{
  "tokenTrim.compressionLevel": "aggressive",
  "tokenTrim.autoRecacheInterval": 600000,
  "tokenTrim.maxContextSize": 16000,
  "tokenTrim.excludePatterns": [
    "node_modules/**",
    "dist/**",
    ".git/**",
    "coverage/**",
    "build/**",
    "vendor/**",
    ".env.*",
    "*.log"
  ]
}
```

**Use when**: Working with monorepos or very large projects

---

### Example 2: Minimal Changes (Always Fresh Context)

```json
{
  "tokenTrim.compressionLevel": "light",
  "tokenTrim.autoRecacheInterval": 60000,
  "tokenTrim.maxContextSize": 64000,
  "tokenTrim.excludePatterns": [
    "node_modules/**",
    ".git/**"
  ]
}
```

**Use when**: Working on rapidly changing code, want latest context

---

### Example 3: Balanced (Recommended Default)

```json
{
  "tokenTrim.compressionLevel": "balanced",
  "tokenTrim.autoRecacheInterval": 300000,
  "tokenTrim.maxContextSize": 32000,
  "tokenTrim.excludePatterns": [
    "node_modules/**",
    "dist/**",
    ".git/**",
    "coverage/**"
  ]
}
```

**Use when**: General development (balanced compression and freshness)

---

## Compression Levels Explained

### Light Compression
- **What it does**: Removes only obvious noise (comments, excess whitespace)
- **Speed**: <500ms
- **Result size**: 60-70% reduction
- **Best for**: Quick answers, already-clean code
- **Example reduction**: 10,000 lines → 3,000 lines

### Balanced Compression (Recommended)
- **What it does**: Comments + signatures + entropy filtering
- **Speed**: 1-3 seconds
- **Result size**: 75-85% reduction
- **Best for**: General development
- **Example reduction**: 10,000 lines → 1,500 lines

### Aggressive Compression
- **What it does**: All techniques + symbol compression + deduplication
- **Speed**: 3-5 seconds
- **Result size**: 85-95% reduction
- **Best for**: Large codebases, specialized questions
- **Example reduction**: 10,000 lines → 500 lines

## Advanced Tips

### Tip 1: Exclude Expensive Directories

```json
{
  "tokenTrim.excludePatterns": [
    "node_modules/**",
    "venv/**",
    ".venv/**",
    "__pycache__/**",
    ".pytest_cache/**",
    "target/**"
  ]
}
```

These directories rarely contribute useful context.

### Tip 2: Strategic Max Context Size

```
Token Budget Calculation:
- Copilot Chat: ~4,000 tokens
- Your prompt: ~200 tokens
- Compressed context: should be 2,000-3,000 tokens
- Set maxContextSize to 12,000-16,000 bytes
```

### Tip 3: Force Fresh Context Before Important Questions

```
Before important architectural questions:
1. Click "Recache Context"
2. Wait for "Compression Ready"
3. Ask your question
```

### Tip 4: Use Search to Find Relevant Context

Before asking Copilot:
1. Ctrl+F to find relevant keywords
2. This helps you know what context is available
3. Ask more specific questions based on findings

### Tip 5: Combine with Multiple Queries

```
Query 1: "Summarize the database layer"
[Copilot responds with context-aware summary]

Query 2: "How does authentication flow through the app?"
[Copilot already has architectural context]
```

## Troubleshooting

### Problem: "Compression Ready" takes too long

**Causes**:
- Large project with many files
- Slow disk I/O
- Antivirus scanning files

**Solutions**:
1. Increase `autoRecacheInterval` (cache less frequently)
2. Extend compression timeout in settings
3. Exclude more directories

---

### Problem: Copilot Chat doesn't open

**Causes**:
- GitHub Copilot not installed
- Copilot Chat extension missing

**Solutions**:
1. Install GitHub Copilot: `GitHub.copilot`
2. Install Copilot Chat: `GitHub.copilot-chat`
3. Context will be copied to clipboard (paste manually)

---

### Problem: Context seems outdated

**Causes**:
- Files changed after cache was created
- Auto-recache interval too long
- File watcher missed changes

**Solutions**:
1. Click "Recache Context" button to force refresh
2. Reduce `autoRecacheInterval` in settings
3. Restart VS Code

---

### Problem: Sidebar doesn't appear

**Causes**:
- Extension not activated
- No workspace open

**Solutions**:
1. File → Open Folder (open a project)
2. Click ⚡ icon in Activity Bar
3. Wait 3-5 seconds for initialization

---

### Problem: Memory usage is high

**Causes**:
- Very large project
- Not enough file exclusions
- High `maxContextSize` setting

**Solutions**:
1. Exclude more patterns (e.g., `build/**`, `dist/**`)
2. Reduce `maxContextSize` to 16000 or lower
3. Use "aggressive" compression level
4. Close other extensions

## Best Practices

### ✅ DO

- ✅ Use the "Balanced" compression level for best results
- ✅ Recache before major architectural questions
- ✅ Exclude `node_modules`, `dist`, and build artifacts
- ✅ Use specific questions instead of vague ones
- ✅ Review Copilot's responses and validate against your codebase

### ❌ DON'T

- ❌ Don't ask TokenTrim questions (it's not a chatbot)
- ❌ Don't fully trust compressed context for critical decisions
- ❌ Don't include sensitive files (tokens, secrets) in compression
- ❌ Don't use "Aggressive" if you need comprehensive context
- ❌ Don't forget to fact-check Copilot's suggestions

## Real-World Examples

### Example 1: Understanding an Unfamiliar Project

```
Question: "What does this project do? Give me a quick overview."

BEFORE TokenTrim:
- Copilot has no context
- Responds with generic answers

AFTER TokenTrim:
- Copilot sees:
  * Project structure
  * Main entry points
  * Key dependencies
  * API signatures
- Responds with specific, accurate overview
```

---

### Example 2: Adding a Feature

```
Question: "I need to add validation to user sign-ups. 
           Show me how it fits the current patterns."

BEFORE TokenTrim:
- Copilot suggests generic validation
- Might not match your project style

AFTER TokenTrim:
- Copilot sees your validation framework
- Your error handling patterns
- User model signatures
- Generates code matching your style
```

---

### Example 3: Debugging Complex Issues

```
Question: "Help me debug this race condition in the cache layer"

BEFORE TokenTrim:
- Copilot needs you to paste entire files
- Takes more tokens
- Loses architectural context

AFTER TokenTrim:
- Compressed cache + signatures included
- Copilot understands your cache architecture
- Faster, smarter debugging
```

---

## Performance Tips

| Action | Impact |
|--------|--------|
| Reduce `maxContextSize` | Faster compression, smaller context |
| Increase `autoRecacheInterval` | Fewer background compressions |
| Exclude more patterns | Fewer files to process |
| Use "Light" compression | Faster, less reduction |
| Use "Aggressive" compression | Slower, more reduction |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Shift+Enter (in input box) | Send prompt to Copilot |
| Ctrl+Shift+I | Open Copilot Chat |
| Click "Compressed Lines" | View compression details |
| Click "Recache Context" | Force refresh cache |

## Integration with Other Extensions

TokenTrim plays nicely with:
- ✅ GitHub Copilot
- ✅ GitHub Copilot Chat
- ✅ Cline
- ✅ Cursor
- ✅ Any VS Code extension

No conflicts or special setup needed.

---

**Need Help?** 
- Report issues: GitHub Issues
- Request features: GitHub Discussions
- Check logs: Output panel → "TokenTrim"
