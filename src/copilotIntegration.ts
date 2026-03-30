/**
 * GitHub Copilot Integration
 * Handles context attachment and message passing to Copilot
 */

import * as vscode from 'vscode';
import { CompressedContext } from './compressor';

export class CopilotIntegration {
  readonly supportedCommands = [
    'github.copilot.openSymbolFromServer',
    'github.copilot.openCopilotPanel',
    'github.copilot.addContextToChat',
    'github.copilot.chat.focus',
  ];

  async sendContextToCopilot(
    userMessage: string,
    compressedContext: CompressedContext,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const fullMessage = this.buildContextMessage(userMessage, compressedContext);

      // Try multiple approaches to send to Copilot
      return await this.attemptSendToCopilot(fullMessage);
    } catch (error) {
      console.error('[TokenTrim] Copilot integration error:', error);
      return {
        success: false,
        message: `Failed to send to Copilot: ${error}`,
      };
    }
  }

  private buildContextMessage(userMessage: string, context: CompressedContext): string {
    return `### TokenTrim - Compressed Project Context

**Context Metrics:**
- Original Tokens: ${context.metrics.original.tokens.toLocaleString()}
- Compressed Tokens: ${context.metrics.compressed.tokens.toLocaleString()}
- Compression Ratio: ${context.metrics.ratio.toFixed(2)}x
- Saved: ${((1 - context.metrics.compressed.tokens / context.metrics.original.tokens) * 100).toFixed(1)}%

**Compression Techniques Used:**
${context.metrics.techniques.map((t) => `- ${t}`).join('\n')}

---

### Project Context

\`\`\`
${context.content.substring(0, Math.min(context.content.length, 10000))}
\`\`\`

---

### Your Question

${userMessage}`;
  }

  private async attemptSendToCopilot(message: string): Promise<{ success: boolean; message?: string }> {
    // Approach 1: Try Copilot Chat API directly
    try {
      console.log('[TokenTrim] Attempting to use Copilot Chat API...');
      const copilotExtension = vscode.extensions.getExtension('GitHub.copilot-chat');

      if (!copilotExtension) {
        console.log('[TokenTrim] GitHub.copilot-chat extension not installed');
      } else {
        if (!copilotExtension.isActive) {
          await copilotExtension.activate();
        }

        const api = copilotExtension.exports;
        if (api && typeof api.sendMessage === 'function') {
          await api.sendMessage(message);
          vscode.window.showInformationMessage('TokenTrim: Context sent to Copilot Chat!');
          console.log('[TokenTrim] Successfully sent via Copilot API');
          return { success: true };
        }
      }
    } catch (error) {
      console.error('[TokenTrim] Copilot API method failed:', error);
    }

    // Approach 2: Use workbench.action.chat.open command (most reliable)
    try {
      console.log('[TokenTrim] Attempting to open Copilot Chat with command...');
      await vscode.commands.executeCommand('workbench.action.chat.open', message);
      vscode.window.showInformationMessage('TokenTrim: Opening Copilot Chat with your question...');
      console.log('[TokenTrim] Successfully opened Copilot Chat');
      return { success: true };
    } catch (error) {
      console.error('[TokenTrim] workbench.action.chat.open command failed:', error);
    }

    // Approach 3: Focus chat and use clipboard
    try {
      console.log('[TokenTrim] Attempting clipboard fallback...');
      await vscode.commands.executeCommand('github.copilot.chat.focus');
      await vscode.env.clipboard.writeText(message);
      vscode.window.showInformationMessage(
        'TokenTrim: Context copied to clipboard. Paste in Copilot Chat (Ctrl+Shift+I).',
      );
      console.log('[TokenTrim] Context copied to clipboard');
      return { success: true };
    } catch (error) {
      console.error('[TokenTrim] Chat focus command failed:', error);
    }

    // Approach 4: Final fallback - clipboard only
    try {
      console.log('[TokenTrim] Using final clipboard-only fallback...');
      await vscode.env.clipboard.writeText(message);
      vscode.window.showInformationMessage(
        'TokenTrim: Context copied to clipboard. Open Copilot Chat (Ctrl+Shift+I) and paste it.',
      );
      console.log('[TokenTrim] Context copied to clipboard (fallback)');
      return { success: true };
    } catch (clipError) {
      console.error('[TokenTrim] All methods failed:', clipError);
      return {
        success: false,
        message: 'Could not send to Copilot: clipboard access failed',
      };
    }
  }

  /**
   * Register listener for Copilot Chat interactions
   * This allows TokenTrim to track when Copilot responds
   */
  registerCopilotListener(): vscode.Disposable {
    return vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'copilot-chat' || event.document.fileName.includes('copilot')) {
        // Log for analytics purposes
        console.log('[TokenTrim] Detected Copilot interaction');
      }
    });
  }

  /**
   * Check if GitHub Copilot extension is available
   */
  async isCopilotAvailable(): Promise<boolean> {
    const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
    return copilotExtension !== undefined;
  }

  /**
   * Get Copilot Chat API if available
   * Supports both GitHub.copilot-chat and newer unified Copilot extensions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCopilotChatAPI(): Promise<any> {
    try {
      // Try GitHub.copilot-chat first (newer versions)
      let copilotExtension = vscode.extensions.getExtension('GitHub.copilot-chat');
      if (copilotExtension) {
        if (!copilotExtension.isActive) {
          await copilotExtension.activate();
        }
        return copilotExtension.exports;
      }

      // Fallback to GitHub.copilot (older unified extension)
      copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
      if (copilotExtension) {
        if (!copilotExtension.isActive) {
          await copilotExtension.activate();
        }
        return copilotExtension.exports;
      }

      return null;
    } catch (error) {
      console.error('[TokenTrim] Failed to get Copilot Chat API:', error);
      return null;
    }
  }
}
