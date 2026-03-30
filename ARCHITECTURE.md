# TokenTrim Architecture

## System Overview

TokenTrim is a layered extension that intercepts developer-to-Copilot communication and optimizes the context before it reaches the LLM.

```
┌────────────────────────────────────────────────────────────────┐
│                    VS Code IDE                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐         ┌──────────────────────┐         │
│  │  Activity Bar    │         │   Project Files      │         │
│  │   (Sidebar)      │         │   (Workspace)        │         │
│  └────────┬─────────┘         └──────────┬───────────┘         │
│           │                               │                    │
│           └───────────────┬───────────────┘                    │
│                           │                                    │
│           ┌───────────────▼────────────────┐                  │
│           │      Extension Core            │                  │
│           │   (extension.ts)               │                  │
│           └───────────────┬────────────────┘                  │
│                           │                                    │
│     ┌─────────────────────┼─────────────────────┐             │
│     │                     │                     │             │
│  ┌──▼────────┐        ┌───▼────────┐      ┌────▼─────┐      │
│  │ Cache     │        │ UI         │      │ Copilot  │      │
│  │ Manager   │        │ Provider   │      │ Integr.  │      │
│  └──┬────────┘        └────┬───────┘      └────┬─────┘      │
│     │                      │                    │            │
│  ┌──▼────────┐        ┌────▼───────┐      ┌────▼─────┐      │
│  │ Compressor│        │ Webview    │      │ Copilot  │      │
│  │           │        │ (HTML/CSS) │      │ Chat API │      │
│  └───────────┘        └────────────┘      └──────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. **extension.ts** - Core Orchestrator
- Entry point and lifecycle management
- Command registration
- Component initialization
- Configuration subscription

**Key Methods:**
- `activate()`: Initializes all components
- `deactivate()`: Cleanup on unload
- `registerCommands()`: Registers VS Code commands

### 2. **compressor.ts** - Compression Engine
Multi-stage pipeline for context optimization:

```
Stage 1: Comment Removal
  └─> Strips single/block comments, preserves doc comments

Stage 2: Signature Extraction  
  └─> AST-aware extraction of function/class signatures

Stage 3: ANSI Code Removal
  └─> Terminal escape code cleanup

Stage 4: Indentation Normalization
  └─> Reduces indentation levels

Stage 5: Entropy Filtering
  └─> Shannon entropy threshold (>2.0)

Stage 6: Jaccard Deduplication
  └─> Removes similar patterns (similarity >0.7)

Stage 7: Symbol Compression
  └─> Shortens keywords (priv, iface, fn, etc.)

Stage 8: Whitespace Cleanup
  └─> Collapses blank lines
```

**Key Classes:**
- `ContextCompressor`: Main compression orchestrator
- `CompressionMetrics`: Statistics object
- `CompressedContext`: Output object

### 3. **cacheManager.ts** - Cache System
Manages dynamic caching with background updates:

**Features:**
- File system watching for changes
- Debounced recalculation
- Auto-recache interval
- Pattern-based file exclusion
- Memory-efficient storage

**Key Methods:**
- `initialize()`: Setup watchers and initial cache
- `recacheAll()`: Force full recompression
- `invalidateCache()`: Mark cache as stale
- `getCompressedContext()`: Retrieve current cache

### 4. **uiProvider.ts** - Sidebar UI
Webview-based interface in VS Code Activity Bar:

**UI Elements:**
- Text input box (80-200px height)
- Metrics display (read-only)
- Recache button
- Send to Copilot button
- Compressed output viewer

**Features:**
- Real-time metric updates
- Interactive compressed output viewer
- Status indicators
- Error notifications

**Architecture:**
```
HTML/CSS (base template)
     ↓
JavaScript (event handlers)
     ↓
vscode.postMessage() (to extension)
     ↓
Extension handlers
     ↓
Reply via webview.postMessage()
```

### 5. **copilotIntegration.ts** - Copilot Handler
Bridges TokenTrim to GitHub Copilot:

**Implementation:**
1. Detects Copilot availability
2. Formats context with metadata
3. Attempts multiple send strategies
4. Clipboard fallback for compatibility

**Methods:**
- `sendContextToCopilot()`: Main send function
- `attemptSendToCopilot()`: Tries multiple approaches
- `isCopilotAvailable()`: Extension check
- `getCopilotChatAPI()`: API access

## Data Flow

### Compression Flow
```
Project Files
    ↓ (read via VS Code API)
Raw Content (may be GB+)
    ↓ (compressor.ts)
Stage 1-8 Pipeline
    ↓ (apply techniques)
Compressed Context (token-optimized)
    ↓ (cache)
CacheManager Storage
    ↓ (periodic update)
UI Display
```

### User Interaction Flow
```
User Types Prompt
    ↓
Input Box
    ↓ (Shift+Enter or button click)
sendToCopilot() triggered
    ↓
Combine: Prompt + Compressed Context
    ↓
CopilotIntegration.send()
    ↓
Try Copilot Chat → Fallback to Clipboard
    ↓
User sees success/error notification
```

### Cache Invalidation Flow
```
File System Event (create/modify/delete)
    ↓ (FileSystemWatcher)
Cache marked stale
    ↓ (debounce 5s)
recacheAll() called automatically
    ↓
Compression runs in background
    ↓
UI updated with new metrics
```

## Data Structures

### CompressedContext
```typescript
{
  content: string;           // Compressed project code
  metrics: CompressionMetrics;
  timestamp: number;         // Creation time
  fileCount: number;         // Files included
}
```

### CompressionMetrics
```typescript
{
  original: {
    lines: number;
    tokens: number;
    bytes: number;
  };
  compressed: {
    lines: number;
    tokens: number;
    bytes: number;
  };
  ratio: number;            // original/compressed
  percentage: number;       // % reduction
  techniques: string[];     // Applied techniques
}
```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Initial compress (10MB) | 2-5s | Runs once on activation |
| Incremental recache (files changed) | <1s | Debounced by 5s |
| UI update | <100ms | Async postMessage |
| Entropy calculation | O(n) | Per line |
| Jaccard similarity | O(m²) | m = unique lines |
| Memory overhead | 50-200MB | Depends on project size |

## Compression Algorithms

### Shannon Entropy Filter
Removes low-information lines:
```
entropy = -Σ(p(x) * log2(p(x)))
Keep if entropy > 2.0
```

### Jaccard Similarity
Deduplicates similar patterns:
```
similarity = intersection / union
Remove if similarity >= 0.7
```

### Token Estimation
Approximates token count:
```
tokens ≈ bytes / 4
(Average 4 bytes per token for LLM)
```

## Configuration Hierarchy

1. **VS Code Settings** (`settings.json`)
   - User-level or workspace-level
   - Read on startup and on change
   - Can be modified via settings UI

2. **Extension Defaults** (`package.json` contributesConfiguration)
   - Fallback values if not set
   - Applied when config key missing

3. **Runtime Overrides**
   - Command-line parameters (if added)
   - Environment variables (future feature)

## Error Handling

| Error Scenario | Handling |
|---|---|
| No workspace open | Show warning, disable extension |
| File read failure | Log error, continue with other files |
| Copilot not installed | Show warning, still function locally |
| Cache recalc error | Keep previous cache, show toast |
| Clipboard copy fail | Show error, suggest alternative |

## Extension Lifecycle

```
VS Code Startup
    ↓
activate() called
    ↓
Initialize CacheManager
    ↓
Register Commands
    ↓
Register UI Provider
    ↓
Setup File Watchers
    ↓
Start Auto-Recache Timer
    ↓
READY STATE
    ↓
[User interactions and cache updates]
    ↓
VS Code Shutdown / Extension Disable
    ↓
deactivate() called
    ↓
Dispose all resources
    ↓
TERMINATED
```

## Key Design Decisions

### 1. **Webview UI vs Native UI**
- **Decision**: Webview (HTML/CSS/JS)
- **Reason**: Rich styling, complete control, responsive design
- **Trade-off**: Slower than native, but better UX

### 2. **Background Compression**
- **Decision**: Async with debouncing
- **Reason**: Prevents UI blocking
- **Trade-off**: Slight delay in cache updates

### 3. **Clipboard Fallback**
- **Decision**: Copy to clipboard if Copilot API unavailable
- **Reason**: Maximum compatibility
- **Trade-off**: Manual paste step required

### 4. **File Watching for Invalidation**
- **Decision**: VS Code FileSystemWatcher API
- **Reason**: Native, efficient, built-in
- **Trade-off**: May miss external changes

### 5. **Multi-Stage Pipeline**
- **Decision**: 8 sequential compression stages
- **Reason**: Inspired by lean-ctx best practices
- **Trade-off**: More CPU per compression, but better results

## Testing Strategy

### Unit Tests
- `compressor.test.ts`: Each compression stage
- `cacheManager.test.ts`: Cache operations
- `copilotIntegration.test.ts`: API handling

### Integration Tests
- Full compression pipeline
- Cache + UI interaction
- Copilot integration

### E2E Tests
- Complete user workflow
- Extension activation/deactivation
- Configuration changes

## Future Improvements

1. **Language-Specific Optimizations**
   - AST-aware compression per language
   - Preserve semantics better

2. **ML-Based Relevance Scoring**
   - Learn what Copilot finds useful
   - Adaptive filtering

3. **Team Collaboration**
   - Share compression profiles
   - Consistent cache across team

4. **Multiple LLM Support**
   - Claude, Gemini, etc.
   - Custom APIs

5. **Advanced Analytics**
   - Compression insight dashboard
   - Token savings tracker

## Dependencies

- `vscode`: ^1.85.0 (VS Code API)
- No external npm dependencies (intentional for lightweight)
- Built-in Node.js APIs (fs, path)

## Build & Packaging

```bash
npm run esbuild           # Build for development
npm run esbuild-watch    # Watch mode
npm run vscode:prepublish # Build for production
vsce package             # Package .vsix
```

---

**Architecture Version**: 1.0
**Last Updated**: March 2026
