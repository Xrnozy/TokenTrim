/**
 * TokenTrim VS Code Extension
 * Context optimization layer for GitHub Copilot
 */

import * as vscode from 'vscode';
import { CacheManager } from './cacheManager';
import { UIProvider } from './uiProvider';
import { CopilotIntegration } from './copilotIntegration';
import { CompressedContext } from './compressor';

let cacheManager: CacheManager | null = null;
let uiProvider: UIProvider | null = null;
let copilotIntegration: CopilotIntegration | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('[TokenTrim] Extension activated');

  // Initialize components
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showWarningMessage('TokenTrim: Please open a workspace first.');
    return;
  }

  cacheManager = new CacheManager(workspaceRoot);
  copilotIntegration = new CopilotIntegration();

  // Check Copilot availability (log silently)
  const copilotAvailable = await copilotIntegration.isCopilotAvailable();
  if (copilotAvailable) {
    console.log('[TokenTrim] GitHub Copilot extension detected');
  } else {
    console.log('[TokenTrim] GitHub Copilot extension not found - clipboard fallback will be used');
  }

  // Initialize cache
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: 'TokenTrim: Initializing compression cache...',
    },
    async () => {
      try {
        await cacheManager!.initialize();
        console.log('[TokenTrim] Cache initialized');
      } catch (error) {
        console.error('[TokenTrim] Failed to initialize cache:', error);
        vscode.window.showErrorMessage(`TokenTrim: Initialization failed: ${error}`);
      }
    },
  );

  // Register UI Provider
  uiProvider = new UIProvider(context.extensionUri, cacheManager, copilotIntegration);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(UIProvider.viewType, uiProvider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }),
  );

  // Register commands
  registerCommands(context, cacheManager, copilotIntegration, uiProvider);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('tokenTrim')) {
        console.log('[TokenTrim] Configuration changed, recaching...');
        await cacheManager?.recacheAll();
      }
    }),
  );

  // Register Copilot listener
  if (uiProvider) {
    context.subscriptions.push(copilotIntegration.registerCopilotListener());
  }

  // Cleanup on deactivate
  context.subscriptions.push({
    dispose: () => {
      cacheManager?.dispose();
      uiProvider?.dispose();
    },
  });

  console.log('[TokenTrim] All systems initialized');
}

function registerCommands(
  context: vscode.ExtensionContext,
  cacheManager: CacheManager,
  copilotIntegration: CopilotIntegration,
  uiProvider: UIProvider,
): void {
  // Recache command
  context.subscriptions.push(
    vscode.commands.registerCommand('token-trim.recache', async () => {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Window,
            title: 'TokenTrim: Recaching...',
          },
          async () => {
            await cacheManager.recacheAll();
          },
        );
        vscode.window.showInformationMessage('TokenTrim: Context recached successfully');
      } catch (error) {
        vscode.window.showErrorMessage(`TokenTrim: Recache failed: ${error}`);
      }
    }),
  );

  // Show compressed context command
  context.subscriptions.push(
    vscode.commands.registerCommand('token-trim.showCompressed', async () => {
      const context = cacheManager.getCompressedContext();
      if (!context) {
        vscode.window.showWarningMessage('TokenTrim: No compressed context available yet.');
        return;
      }

      const doc = vscode.Uri.parse(`untitled:TokenTrim-Compressed-${Date.now()}.md`);
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.createFile(doc, { overwrite: true });

      await vscode.workspace.applyEdit(workspaceEdit);

      const textDoc = await vscode.workspace.openTextDocument(doc);
      const editor = await vscode.window.showTextDocument(textDoc);

      const markdown = buildCompressedContextMarkdown(context);
      await editor.edit((edit) => {
        edit.insert(new vscode.Position(0, 0), markdown);
      });
    }),
  );

  // Send to Copilot command
  context.subscriptions.push(
    vscode.commands.registerCommand('token-trim.sendToCopilot', async () => {
      const context = cacheManager.getCompressedContext();
      if (!context) {
        vscode.window.showWarningMessage('TokenTrim: Project context not ready yet.');
        return;
      }

      // Get user input from quick input
      const userMessage = await vscode.window.showInputBox({
        prompt: 'TokenTrim: What would you like to ask Copilot about this project?',
        placeHolder: 'Type your question...',
      });

      if (!userMessage) {
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: 'TokenTrim: Sending to Copilot...',
        },
        async () => {
          const result = await copilotIntegration.sendContextToCopilot(userMessage, context);
          if (!result.success) {
            vscode.window.showErrorMessage(result.message || 'Failed to send to Copilot');
          }
        },
      );
    }),
  );

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'token-trim.showCompressed';
  statusBarItem.text = '⚡ TokenTrim';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Update status bar periodically
  setInterval(() => {
    const compressedContext = cacheManager.getCompressedContext();
    if (compressedContext) {
      const saved = Math.round((1 - compressedContext.metrics.compressed.tokens / compressedContext.metrics.original.tokens) * 100);
      statusBarItem.text = `⚡ TokenTrim -${saved}%`;
    }
  }, 5000);
}

function buildCompressedContextMarkdown(context: CompressedContext): string {
  return `# TokenTrim - Compressed Project Context

## 📊 Metrics

| Metric | Value |
|--------|-------|
| **Original Lines** | ${context.metrics.original.lines.toLocaleString()} |
| **Compressed Lines** | ${context.metrics.compressed.lines.toLocaleString()} |
| **Compression Ratio** | ${context.metrics.ratio.toFixed(2)}x |
| **Original Tokens** | ${context.metrics.original.tokens.toLocaleString()} |
| **Compressed Tokens** | ${context.metrics.compressed.tokens.toLocaleString()} |
| **Token Savings** | ${(Math.round((1 - context.metrics.compressed.tokens / context.metrics.original.tokens) * 100))}% |
| **Files Analyzed** | ${context.fileCount} |
| **Cache Timestamp** | ${new Date(context.timestamp).toLocaleString()} |

## 🔧 Compression Techniques Applied

${context.metrics.techniques.map((t: string) => `- **${formatTechnique(t)}**`).join('\n')}

---

## 📄 Compressed Content

\`\`\`
${context.content}
\`\`\`

---

*Generated by TokenTrim - Context Optimization for GitHub Copilot*
`;
}

function formatTechnique(technique: string): string {
  const map: { [key: string]: string } = {
    ['comment-removal']: 'Comment Removal',
    ['signature-extraction']: 'Signature Extraction',
    ['ansi-removal']: 'ANSI Code Removal',
    ['indentation-normalize']: 'Indentation Normalization',
    ['entropy-filtering']: 'Shannon Entropy Filtering',
    deduplication: 'Jaccard Similarity Deduplication',
    ['symbol-compression']: 'Symbol Compression',
    ['whitespace-cleanup']: 'Whitespace Cleanup',
  };

  return map[technique] || technique.replace(/-/g, ' ');
}

export function deactivate() {
  console.log('[TokenTrim] Extension deactivated');
  cacheManager?.dispose();
  uiProvider?.dispose();
}
