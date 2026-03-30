# TokenTrim - Context Optimization for GitHub Copilot

**TokenTrim** is a VS Code extension that acts as an intelligent preprocessing layer for GitHub Copilot. It dynamically compresses your project context using adaptive read modes to reduce token usage, eliminate noise, and provide Copilot with only the most relevant information.

## 🎯 Core Features

### 1. **Sidebar UI with Context Input**
- Clean, intuitive left-side panel (Activity Bar)
- Type prompts directly in TokenTrim
- Automatic context attachment to every query
- Status indicators and real-time metrics

### 2. **Adaptive Read Modes**
Inspired by **lean-ctx**, TokenTrim intelligently selects the best compression mode:

- **Full** (0% compression) - Complete content with cache optimization (13 tokens on re-read)
- **Map** (5-15% tokens) - Dependency graph + API signatures for structure understanding
- **Signatures** (10-20% tokens) - Function/class definitions only for code review
- **Diff** (10-30% tokens) - Changed lines with context when file is modified
- **Aggressive** (30-50% tokens) - Removes comments, logs, boilerplate for large files
- **Entropy** (20-40% tokens) - Filters by Shannon entropy (H≥2.0) to remove low-information lines
- **Lines** (proportional) - Specific line ranges for targeted sections

### 3. **Smart Mode Selection**
TokenTrim automatically picks the best compression mode based on:
- **File size**: Large files (>50KB) use Map mode; medium files (>10KB) use Signatures
- **User intent**: Editing → Full mode; understanding → Map/Signatures; reviewing → Signatures
- **Cache status**: Re-reads use ultra-lightweight caching (13 tokens after MD5 hash validation)

### 4. **Intelligent Session Caching**
- MD5-based file validation for instant cache hits
- 5-minute TTL with configurable intervals
- File watcher integration for automatic invalidation
- Background caching without blocking UI

### 5. **Real-Time Metrics Display**
Shows in the sidebar:
- Original lines/tokens/bytes
- Compressed lines/tokens/bytes
- Compression ratio and percentage
- Mode used and cache hit status
- Techniques applied during compression

### 6. **Interactive Compressed Output**
- Click on "Compressed Lines" metric to view full context
- Opens readable markdown preview with syntax highlighting
- Shows all techniques applied and detailed statistics

### 7. **Copilot Integration**
- One-click sending to Copilot Chat
- Automatic context + prompt combination
- Support for GitHub Copilot Chat panel
- Clipboard fallback for compatibility

### 8. **Manual Recache Control**
- "Recache Context" button for forced refresh
- Useful after major file changes
- Provides feedback on cache status

## 🚀 Quick Start

### Installation

1. Install the TokenTrim extension from VS Code Marketplace (coming soon)
2. Open any project folder in VS Code
3. Click the **TokenTrim icon** (⚡) in the Activity Bar

### First Use

1. TokenTrim starts automatic context compression in the background
2. Wait for "Compression Ready" status
3. Type your question in the input box
4. Click "Send to Copilot" or press **Shift+Enter**
5. Your prompt + compressed context appears in Copilot Chat

## ⚙️ Configuration

Add these to your `.vscode/settings.json`:

```json
{
  "tokenTrim.defaultMode": "smart",
  "tokenTrim.entropyThreshold": 2.0,
  "tokenTrim.cacheTTL": 300000,
  "tokenTrim.excludePatterns": [
    "node_modules/**",
    "dist/**",
    ".git/**",
    "coverage/**",
    "*.log"
  ]
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultMode` | string | `smart` | Default compression mode: `smart`, `full`, `map`, `signatures`, `aggressive`, `entropy` |
| `entropyThreshold` | number | `2.0` | Shannon entropy minimum threshold for entropy mode (higher = stricter filtering) |
| `cacheTTL` | number | `300000` | Cache time-to-live in milliseconds (5 min default) |
| `excludePatterns` | array | `[node_modules/**,...]` | Glob patterns to exclude from analysis |

## 💡 Use Cases

### 1. **Faster Copilot Responses**
- Compressed context loads 5-10x faster
- Reduced API latency
- Lower token costs

### 2. **Better Code Understanding**
- TokenTrim keeps only semantic-rich lines
- Removes verbose logging and boilerplate
- Helps Copilot focus on actual logic

### 3. **Large Codebase Handling**
- Compress 1MB files to 50-100KB
- Support for 14+ programming languages
- Intelligent file selection

### 4. **Context-Aware Assistance**
- Project structure stays intact
- API signatures preserved
- Important patterns highlighted

## 🔍 How It Works

### Smart Mode Selection Algorithm

```
Raw Project Code
    ↓
ANALYZE: Calculate file size & detect intent
    ↓
SELECT OPTIMAL MODE:
  ├─ Editing? → FULL (cache: 13 tokens re-read)
  ├─ Large file (>50KB)? → MAP (dependency graph)
  ├─ Medium file (>10KB)? → SIGNATURES (API surface)
  ├─ Understanding? → MAP or SIGNATURES
  ├─ Code review? → SIGNATURES
  ├─ Repetitive code? → ENTROPY (H≥2.0 filter)
  └─ Specific lines? → LINES (targeted ranges)
    ↓
APPLY MODE TECHNIQUES:
  AGGRESSIVE applies: [1] Comments → [3] ANSI codes → 
                      [4] Indentation → [6] Dedup → [8] Whitespace
  SIGNATURES applies: Extract function/class signatures only
  MAP applies:        Extract imports, exports, API surface
  ENTROPY applies:    Shannon entropy filtering (keep H≥2.0)
  FULL applies:       Minimal cleanup (cache-optimized)
    ↓
CACHE RESULT: MD5 hash validation for instant re-reads
    ↓
Optimized Context (Ready for Copilot)
```

### Techniques Applied by Mode

| Technique | Aggressive | Entropy | Signatures | Map | Full | Diff |
|-----------|-----------|---------|-----------|-----|------|------|
| Comments removal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ANSI code cleanup | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Indentation norm. | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Log removal | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Block dedup | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Whitespace cleanup | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Entropy filtering | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Extract signatures | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dependency map | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Extract imports | ⚠️ | ❌ | ✅ | ✅ | ❌ | ❌ |

### Typical Token Savings by Mode

| Mode | Token Savings | Best For | Example |
|------|---------------|----------|---------|
| **Full** | 0% (cached: 13 tokens) | Editing files | Making code changes |
| **Map** | 5-15% | Understanding structure | "What does this project do?" |
| **Signatures** | 10-20% | Code review & API docs | "Review this module" |
| **Diff** | 10-30% | Changed code | "What changed in this file?" |
| **Entropy** | 20-40% | Repetitive code | Files with boilerplate patterns |
| **Aggressive** | 30-50% | Large files | 1MB+ files, extreme compression |

## 🎨 Sidebar Interface

The TokenTrim sidebar includes:

```
┌─────────────────────────────┐
│ ⚡ TokenTrim                │
├─────────────────────────────┤
│ Prompt to Copilot           │
│ ┌───────────────────────────┐│
│ │ [textarea for input]      ││
│ │ Shift+Enter to send       ││
│ └───────────────────────────┘│
│                             │
│ Compression Metrics         │
│ Original Lines    12,450    │
│ Compressed Lines   1,240    │
│ Compression Ratio   10.0x   │
│ Tokens Saved       8,920    │
│ Files Analyzed       45     │
│                             │
│ ✓ Compression Ready         │
│                             │
│ → Send to Copilot           │
│ 🔄 Recache Context          │
├─────────────────────────────┤
│ Cache age: 2m ago           │
│ Built with lean-ctx         │
└─────────────────────────────┘
```

## 📊 Metrics Explained

- **Original bytes/tokens/lines**: Pre-compression size metrics
- **Compressed bytes/tokens/lines**: Post-compression size metrics
- **Compression ratio**: Original size ÷ Compressed size (e.g., 4.5x = 78% reduction)
- **Compression percentage**: Percentage of content removed
- **Cache hit**: Whether result was retrieved from cache (vs. recomputed)
- **Mode**: Which compression strategy was applied

## 🔄 Cache Validation

TokenTrim uses **MD5 hashing** to validate cache:

1. File is read and MD5 hash is calculated
2. Hash checked against cached version
3. If hashes match: Return cached result instantly (13 tokens)
4. If hashes differ: Recompute compression and update cache
5. TTL enforced: Cache expires after 5 minutes (configurable)

**Typical cache hit percentage**: 60-80% for active editing session

## 🤝 Integration with Copilot

### Supported Workflows

1. **Direct Chat**: Paste compressed context into Copilot Chat
2. **VSCode Commands**: Integrate with VS Code command palette
3. **Quick Fix**: Use for "Explain this error" scenarios
4. **Code Review**: Send entire modules for review with minimal tokens

### Compatibility

- ✅ GitHub Copilot Chat
- ✅ GitHub Copilot (main extension)
- ✅ All VS Code versions 1.85+
- ✅ Windows, macOS, Linux

## 📈 Performance

- **First compression**: 100-500ms (depending on file size)
- **Cached re-read**: ~13 tokens (MD5 validation only)
- **Mode selection overhead**: <10ms
- **Memory per cache entry**: ~50KB-500KB (depends on original file size)
- **Typical cache size**: 50-200MB for medium projects
- **CPU impact**: Minimal (compression happens on-demand, not background loops)

## 🛠️ Architecture

### Core Components

- **ContextCompressor** (`compressor.ts`): Adaptive compression engine with 7 read modes
  - Public API: `compress()`, `smartRead()`, `compressWithMode()`
  - Mode methods: `modeFull()`, `modeMap()`, `modeSignatures()`, `modeAggressive()`, `modeEntropy()`, `modeDiff()`, `modeLines()`
  - Helper methods for metadata extraction, hashing, entropy calculation
  - Symbol tracking for reversibility (prepared for future use)

- **CacheManager** (`cacheManager.ts`): File watching and cache coordination
  - Monitors file system changes
  - Triggers cache invalidation on modifications
  - Manages background updates

- **UIProvider** (`uiProvider.ts`): Webview-based sidebar interface
  - Real-time metrics display
  - Mode selection UI
  - Context preview functionality

- **CopilotIntegration** (`copilotIntegration.ts`): Copilot Chat handler
  - One-click sending of compressed context
  - Prompt combination and formatting

- **Extension Core** (`extension.ts`): VS Code lifecycle
  - Command registration
  - Component initialization
  - Configuration management

### Data Flow

```
User Input
    ↓
Extension.ts registers commands
    ↓
CacheManager watches filesystem
    ↓
ContextCompressor.smartRead()
  ├─ Calculate MD5 hash
  ├─ Check cache status
  ├─ Detect file size & intent
  └─ Select optimal mode
    ↓
Apply mode-specific techniques
    ↓
Cache result (TTL: 5 min)
    ↓
UIProvider displays metrics
    ↓
Optional: Send to Copilot via CopilotIntegration
```

## 🔐 Privacy & Security

- ✅ **No telemetry**: TokenTrim doesn't send data anywhere
- ✅ **Local processing**: All compression happens on your machine
- ✅ **No external APIs**: Doesn't contact any servers
- ✅ **Clipboard-only**: Context only touches your clipboard on send
- ✅ **Open source**: Full source code available for inspection

## 🐛 Troubleshooting

### Issue: Cache not being used (always recompressing)

**Solution**: 
1. Verify MD5 hash calculation is working (check DevTools console)
2. Ensure file permissions allow cache writes
3. Check cache TTL in settings - may be expiring too quickly

### Issue: Copilot integration not working

**Solution**: 
1. Ensure GitHub Copilot extension is installed and authenticated
2. Use clipboard fallback to manually copy compressed context
3. Check that Copilot Chat is enabled in VS Code

### Issue: Entropy mode removing too much content

**Solution**: Adjust `entropyThreshold` in settings (lower = keep more content)
- Default: `2.0` (Shannon entropy threshold)
- Try: `1.8` for more content, `2.2` for more aggressive filtering

### Issue: Plugin uses too much memory

**Solution**: 
1. Exclude more patterns in settings (e.g., `node_modules/**`, `dist/**`)
2. Reduce cache TTL to keep fewer entries
3. Use Map or Signatures mode instead of Full mode for large files

### Issue: Compression results inconsistent across files

**Solution**: This is normal - TokenTrim applies different modes based on:
- File size (>50KB triggers Map, >10KB triggers Signatures)
- File content (entropy varies by code style)
- User intent (editing vs. reviewing)
- Cache status (re-reads show 13 tokens vs. recomputed results)

## 📝 API Reference

### Public Methods (ContextCompressor)

```typescript
// Legacy API (maps to new modes)
compress(content, level, filePath): CompressedContext

// Smart mode selection (recommended)
smartRead(content, filePath, isEditing?): CompressedContext

// Individual mode methods
modeFull(content, filePath): CompressedContext
modeMap(content, filePath): CompressedContext
modeSignatures(content, filePath): CompressedContext
modeAggressive(content, filePath): CompressedContext
modeEntropy(content, filePath): CompressedContext
modeDiff(content, previousContent, filePath, contextLines?): CompressedContext
modeLines(content, ranges, filePath): CompressedContext

// Cache management
clearCache(): void
getCacheStats(): { size: number; entries: string[] }
```

### VS Code Commands

- `token-trim.recache`: Force recompression of all files
- `token-trim.showCompressed`: Open preview of compressed context
- `token-trim.sendToCopilot`: Send prompt + compressed context to Copilot Chat

## 🌟 Credits

TokenTrim is inspired by **lean-ctx** (Rust), which pioneered context compression for LLMs.

- Original Project: [lean-ctx](https://github.com/yvgude/lean-ctx)
- Creator: Yv Gude
- Concept: Context Intelligence Engine for LLM optimization

## 📄 License

MIT License - Free for personal and commercial use

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- [ ] Additional compression algorithms
- [ ] Language-specific optimizations  
- [ ] Integration with other LLM platforms
- [ ] Advanced pattern recognition
- [ ] Performance optimizations

## 🎉 Roadmap

- [ ] Dark/light theme support
- [ ] Custom compression profiles
- [ ] Integration with Claude, Gemini, others
- [ ] Project-specific compression rules
- [ ] A/B testing compression levels
- [ ] Analytics dashboard
- [ ] Code review mode
- [ ] Team settings sync



**TokenTrim**: Making Copilot smarter, faster, and more efficient. ⚡
