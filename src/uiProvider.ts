/**
 * Sidebar UI Provider
 * Renders the TokenTrim panel in the activity bar
 */

import * as vscode from 'vscode';
import { CompressedContext, CompressionMetrics } from './compressor';
import { CacheManager } from './cacheManager';
import { CopilotIntegration } from './copilotIntegration';

export class UIProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'token-trim-panel';
  private view?: vscode.WebviewView;
  private cachedContext: CompressedContext | null = null;
  private statusUpdater: NodeJS.Timeout | null = null;

  constructor(
    private extensionUri: vscode.Uri,
    private cacheManager: CacheManager,
    private copilotIntegration: CopilotIntegration,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken,
  ): void | Thenable<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      this.handleWebviewMessage(message);
    });

    // Update UI periodically
    this.updateUI();
    this.statusUpdater = setInterval(() => this.updateUI(), 1000);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TokenTrim</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
            padding: 12px;
            font-size: 13px;
        }

        .container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background-color: var(--vscode-sideBarSectionHeader-background);
            border-radius: 4px;
            margin-bottom: 8px;
        }

        .header-icon {
            font-size: 16px;
        }

        .header-text {
            font-weight: 600;
            font-size: 14px;
        }

        .input-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .input-label {
            font-size: 12px;
            font-weight: 500;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .input-box {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            font-family: 'Courier New', monospace;
            resize: vertical;
            min-height: 80px;
            max-height: 200px;
        }

        .input-box:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .input-hint {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: -4px;
        }

        .metrics-section {
            background-color: var(--vscode-sideBarSectionHeader-background);
            border-radius: 4px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .metric-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            background-color: var(--vscode-input-background);
            border-radius: 3px;
            font-size: 12px;
        }

        .metric-label {
            color: var(--vscode-descriptionForeground);
            font-weight: 500;
        }

        .metric-value {
            color: var(--vscode-sideBar-foreground);
            font-family: 'Courier New', monospace;
            font-weight: 600;
        }

        .metric-value.clickable {
            cursor: pointer;
            color: var(--vscode-textLink-foreground);
            text-decoration: underline;
        }

        .metric-value.clickable:hover {
            color: var(--vscode-textLink-activeForeground);
        }

        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background-color: var(--vscode-successBackground);
            color: var(--vscode-successForeground);
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
        }

        .status-indicator.processing {
            background-color: var(--vscode-progressBar-background);
            color: var(--vscode-sideBar-foreground);
        }

        .status-indicator.ready {
            background-color: var(--vscode-successBackground);
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: currentColor;
            animation: pulse 1.5s ease-in-out infinite;
        }

        .status-indicator.ready .status-dot {
            animation: none;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .buttons-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .button {
            padding: 8px 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            width: 100%;
            text-align: center;
        }

        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .techniques-tag {
            display: inline-block;
            padding: 2px 6px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 10px;
            margin: 2px 2px 2px 0;
        }

        .footer {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            padding-top: 8px;
            border-top: 1px solid var(--vscode-sideBarSectionHeader-border);
            margin-top: 8px;
        }

        .error {
            padding: 8px;
            background-color: var(--vscode-errorBackground);
            color: var(--vscode-errorForeground);
            border-radius: 4px;
            font-size: 12px;
        }

        #compressedLines {
            cursor: pointer;
            transition: color 0.2s;
        }

        #compressedLines:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">⚡</div>
            <div class="header-text">TokenTrim</div>
        </div>

        <div class="input-section">
            <label class="input-label">Prompt to Copilot</label>
            <textarea
                id="promptInput"
                class="input-box"
                placeholder="Type your question or request here. TokenTrim will automatically attach compressed project context..."></textarea>
            <div class="input-hint">
                Press Shift+Enter to send to Copilot
            </div>
        </div>

        <div class="metrics-section">
            <div style="font-weight: 600; font-size: 12px; margin-bottom: 4px;">Compression Metrics</div>
            <div class="metric-item">
                <span class="metric-label">Original Lines</span>
                <span class="metric-value" id="originalLines">-</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Compressed Lines</span>
                <span class="metric-value clickable" id="compressedLines" title="Click to view compressed context">-</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Compression Ratio</span>
                <span class="metric-value" id="compressionRatio">-</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Tokens Saved</span>
                <span class="metric-value" id="tokensSaved">-</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Files Analyzed</span>
                <span class="metric-value" id="filesCount">-</span>
            </div>
            <div style="margin-top: 8px;">
                <span class="status-indicator" id="statusIndicator">
                    <span class="status-dot"></span>
                    <span id="statusText">Initializing...</span>
                </span>
            </div>
        </div>

        <div class="buttons-section">
            <button class="button" id="sendButton" disabled>→ Send to Copilot</button>
            <button class="button secondary" id="recacheButton">🔄 Recache Context</button>
        </div>

        <div id="errorBox" style="display: none;" class="error"></div>

        <div class="footer">
            <div id="cacheAge">Cache age: -</div>
            <div>Built with lean-ctx inspiration</div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        const promptInput = document.getElementById('promptInput');
        const sendButton = document.getElementById('sendButton');
        const recacheButton = document.getElementById('recacheButton');
        const errorBox = document.getElementById('errorBox');

        // Event listeners
        sendButton.addEventListener('click', () => {
            const prompt = promptInput.value.trim();
            if (prompt) {
                vscode.postMessage({
                    command: 'sendToCopilot',
                    prompt: prompt,
                });
                promptInput.value = '';
            }
        });

        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                sendButton.click();
            }
        });

        recacheButton.addEventListener('click', () => {
            recacheButton.disabled = true;
            vscode.postMessage({ command: 'recache' });
            setTimeout(() => {
                recacheButton.disabled = false;
            }, 2000);
        });

        document.getElementById('compressedLines').addEventListener('click', () => {
            vscode.postMessage({ command: 'showCompressed' });
        });

        // Listen for updates from extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.command) {
                case 'updateMetrics':
                    updateMetrics(message.data);
                    break;
                case 'updateStatus':
                    updateStatus(message.status);
                    break;
                case 'error':
                    showError(message.message);
                    break;
            }
        });

        function updateMetrics(metrics) {
            document.getElementById('originalLines').textContent = metrics.original.lines.toLocaleString();
            document.getElementById('compressedLines').textContent = metrics.compressed.lines.toLocaleString();
            document.getElementById('compressionRatio').textContent = metrics.ratio.toFixed(2) + 'x';
            document.getElementById('tokensSaved').textContent = (metrics.original.tokens - metrics.compressed.tokens).toLocaleString();
            document.getElementById('filesCount').textContent = metrics.fileCount;
            document.getElementById('cacheAge').textContent = 'Cache age: ' + formatTime(metrics.cacheAge);

            sendButton.disabled = false;
        }

        function updateStatus(status) {
            const indicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');

            if (status.isCompressing) {
                indicator.className = 'status-indicator processing';
                statusText.textContent = 'Processing...';
            } else {
                indicator.className = 'status-indicator ready';
                statusText.textContent = 'Compression Ready';
            }
        }

        function showError(message) {
            errorBox.textContent = '⚠️ ' + message;
            errorBox.style.display = 'block';
            setTimeout(() => {
                errorBox.style.display = 'none';
            }, 5000);
        }

        function formatTime(ms) {
            if (ms < 1000) return 'just now';
            const seconds = Math.floor(ms / 1000);
            if (seconds < 60) return seconds + 's ago';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return minutes + 'm ago';
            const hours = Math.floor(minutes / 60);
            return hours + 'h ago';
        }

        // Request initial state
        vscode.postMessage({ command: 'getState' });
    </script>
</body>
</html>`;
  }

  private handleWebviewMessage(message: { command: string; prompt?: string; [key: string]: string | undefined }): void {
    switch (message.command) {
      case 'getState':
        this.updateUI();
        break;

      case 'sendToCopilot':
        if (message.prompt) {
          this.sendToCopilot(message.prompt);
        }
        break;

      case 'recache':
        this.recacheContext();
        break;

      case 'showCompressed':
        this.showCompressedContext();
        break;
    }
  }

  private async sendToCopilot(prompt: string): Promise<void> {
    const context = this.cacheManager.getCompressedContext();
    if (!context) {
      vscode.window.showWarningMessage('TokenTrim: Project context not yet ready. Please wait...');
      return;
    }

    // Use the proper Copilot integration with full message building
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'TokenTrim: Sending to Copilot...',
      },
      async () => {
        const result = await this.copilotIntegration.sendContextToCopilot(prompt, context);
        if (!result.success) {
          vscode.window.showErrorMessage(`TokenTrim: ${result.message || 'Failed to send to Copilot'}`);
        }
      },
    );
  }

  private async recacheContext(): Promise<void> {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'TokenTrim: Recaching project context...',
      },
      async () => {
        try {
          await this.cacheManager.recacheAll();
          this.updateUI();
          vscode.window.showInformationMessage('TokenTrim: Context recached successfully');
        } catch (error) {
          vscode.window.showErrorMessage(`TokenTrim: Recache failed: ${error}`);
        }
      },
    );
  }

  private showCompressedContext(): void {
    const context = this.cacheManager.getCompressedContext();
    if (!context) {
      vscode.window.showWarningMessage('TokenTrim: No compressed context available yet.');
      return;
    }

    const doc = vscode.Uri.parse(`untitled:compressed-context-${Date.now()}.md`);
    const markdown = `# Compressed Project Context

**Metrics:**
- Original Lines: ${context.metrics.original.lines.toLocaleString()}
- Compressed Lines: ${context.metrics.compressed.lines.toLocaleString()}
- Compression Ratio: ${context.metrics.ratio.toFixed(2)}x
- Token Savings: ${((1 - context.metrics.compressed.tokens / context.metrics.original.tokens) * 100).toFixed(1)}%
- Files Analyzed: ${context.fileCount}
- Techniques Applied: ${context.metrics.techniques.join(', ')}

---

## Compressed Content

\`\`\`
${context.content}
\`\`\`
`;

    vscode.workspace.openTextDocument(doc).then(
      (textDoc) => {
        vscode.window.showTextDocument(textDoc).then((editor) => {
          editor.edit((edit) => {
            edit.insert(new vscode.Position(0, 0), markdown);
          });
        });
      },
      () => {
        // Fallback: show in output channel
        const outputChannel = vscode.window.createOutputChannel('TokenTrim Compressed Context');
        outputChannel.appendLine(markdown);
        outputChannel.show();
      },
    );
  }

  private updateUI(): void {
    if (!this.view) return;

    const context = this.cacheManager.getCompressedContext();
    const status = this.cacheManager.getCompressionStatus();

    if (context) {
      this.view.webview.postMessage({
        command: 'updateMetrics',
        data: {
          original: context.metrics.original,
          compressed: context.metrics.compressed,
          ratio: context.metrics.ratio,
          fileCount: context.fileCount,
          cacheAge: Date.now() - context.timestamp,
        },
      });
    }

    this.view.webview.postMessage({
      command: 'updateStatus',
      status: {
        isCompressing: status.isCompressing,
      },
    });
  }

  dispose(): void {
    if (this.statusUpdater) {
      clearInterval(this.statusUpdater);
    }
  }
}
