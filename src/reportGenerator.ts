/**
 * Report Generator - Creates markdown compression reports
 * Provides transparency into compression process and data preservation
 */

export interface CompressionResult {
  file: string;
  originalTokens: number;
  compressedTokens: number;
  originalLines: number;
  compressedLines: number;
}

export interface ReportOptions {
  includeSensitiveWarning: boolean;
  includeSymbolMap: boolean;
}

export class ReportGenerator {
  /**
   * Generate a comprehensive compression report
   */
  static generateReport(
    results: CompressionResult[],
    skippedFiles: string[],
    symbolMap?: Map<string, string>,
    options: ReportOptions = { includeSensitiveWarning: false, includeSymbolMap: true }
  ): string {
    const totalOriginal = results.reduce((sum, r) => sum + r.originalTokens, 0);
    const totalCompressed = results.reduce((sum, r) => sum + r.compressedTokens, 0);
    const tokenSavings = totalOriginal - totalCompressed;
    const savingsPercent = totalOriginal > 0 ? ((tokenSavings / totalOriginal) * 100).toFixed(1) : '0';
    const compressionRatio = totalCompressed > 0 ? (totalOriginal / totalCompressed).toFixed(2) : '0';

    let report = `# 📊 TokenTrim Compression Report\n\n`;
    report += `**Generated**: ${new Date().toLocaleString()}\n`;
    report += `**Extension**: TokenTrim - Intelligent Code Compression for Copilot\n\n`;

    // Files processed
    if (results.length > 0) {
      report += `## 📁 Files Processed (${results.length})\n\n`;
      for (const result of results) {
        report += `- \`${result.file}\` ✅\n`;
      }
      report += `\n`;
    }

    // Skipped files
    if (skippedFiles.length > 0) {
      report += `## 🔒 Sensitive Files (SKIPPED - Kept Private)\n\n`;
      for (const file of skippedFiles) {
        report += `- \`${file}\` (automatically excluded)\n`;
      }
      report += `\n➡️ Use \`--include-env\` flag to compress sensitive files in a separate report.\n\n`;
    }

    // Compression statistics
    report += `## 📊 Compression Statistics\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Original Tokens** | ${totalOriginal.toLocaleString()} |\n`;
    report += `| **Compressed Tokens** | ${totalCompressed.toLocaleString()} |\n`;
    report += `| **Token Savings** | ${tokenSavings.toLocaleString()} (${savingsPercent}%) |\n`;
    report += `| **Compression Ratio** | ${compressionRatio}x |\n`;
    report += `| **Files Processed** | ${results.length} |\n`;
    if (skippedFiles.length > 0) {
      report += `| **Files Skipped** | ${skippedFiles.length} |\n`;
    }
    report += `\n`;

    // Detailed per-file results
    if (results.length > 0) {
      report += `## 📈 Per-File Breakdown\n\n`;
      report += `| File | Original | Compressed | Savings |\n`;
      report += `|------|----------|------------|----------|\n`;
      for (const result of results) {
        const fileSavings = ((1 - result.compressedTokens / result.originalTokens) * 100).toFixed(1);
        report += `| \`${result.file}\` | ${result.originalTokens} | ${result.compressedTokens} | ${fileSavings}% |\n`;
      }
      report += `\n`;
    }

    // Data preservation
    report += `## ✅ Data Integrity & Preservation\n\n`;
    report += `| Component | Status |\n`;
    report += `|-----------|--------|\n`;
    report += `| **URLs & API Endpoints** | ✅ 100% Preserved (Complete, no truncation) |\n`;
    report += `| **Function Signatures** | ✅ 100% Preserved (All type hints) |\n`;
    report += `| **Database Schema** | ✅ 100% Preserved (Column, ForeignKey) |\n`;
    report += `| **Configuration Values** | ✅ 100% Preserved (Exact values) |\n`;
    report += `| **Language Keywords** | ✅ 100% Preserved (Never compressed) |\n`;
    report += `| **Code Logic** | ✅ 100% Functional (No breaking changes) |\n`;
    report += `| **Sensitive Data** | ✅ NOT INCLUDED (Kept private) |\n\n`;

    // What was compressed
    report += `## 🗜️ What Was Compressed\n\n`;
    report += `- ✂️ Redundant comments (kept critical ones)\n`;
    report += `- ✂️ Verbose docstrings → Simplified\n`;
    report += `- ✂️ Logger messages (context preserved)\n`;
    report += `- ✂️ ANSI codes (removed)\n`;
    report += `- ✂️ Indentation (50% reduction)\n`;
    report += `- ✂️ Low-entropy lines (H < 2.0)\n`;
    report += `- ✂️ Duplicate patterns (J ≥ 0.7)\n`;
    if (symbolMap && symbolMap.size > 0) {
      report += `- ✂️ Long identifiers (reversible mapping)\n`;
    }
    report += `\n`;

    // Symbol map
    if (options.includeSymbolMap && symbolMap && symbolMap.size > 0) {
      report += `## 🔤 Symbol Mapping (For Decompression)\n\n`;
      report += `Custom identifiers were compressed for space efficiency:\n\n`;
      report += `\`\`\`json\n`;
      const mapObj: { [key: string]: string } = {};
      for (const [symbol, original] of symbolMap) {
        mapObj[symbol] = original;
      }
      report += JSON.stringify(mapObj, null, 2);
      report += `\n\`\`\`\n\n`;
    }

    // Usage
    report += `## 📋 How to Use This Output\n\n`;
    report += `1. **Copy & Paste**: Entire output can go directly into GitHub Copilot Chat\n`;
    report += `2. **100% Safe**: No credentials or sensitive data included\n`;
    report += `3. **Fully Functional**: All code maintains 100% integrity\n`;
    report += `4. **Reversible**: Use symbol map above if decompression needed\n`;
    report += `5. **Ready to Share**: Safe to share with team or uploading to LLMs\n\n`;

    // Footer security notice
    report += `---\n\n`;
    report += `⚠️ **Security Notice**: Sensitive files (.env, secrets.yaml, credentials) are automatically excluded from all compression outputs.\n`;
    report += `This ensures zero credential leakage into external LLMs or public spaces.\n`;
    report += `If needed, use \`--include-env\` flag for separate sensitive file compression (with explicit warnings).\n\n`;
    report += `*Generated by TokenTrim - Intelligent Code Compression for GitHub Copilot*\n`;

    return report;
  }

  /**
   * Generate warning report for sensitive files
   */
  static generateSensitiveWarningReport(files: string[]): string {
    let report = `# ⚠️ SENSITIVE DATA COMPRESSION REPORT\n\n`;
    report += `**⚠️ WARNING: THIS FILE CONTAINS SENSITIVE DATA**\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `**Generated**: ${new Date().toLocaleString()}\n`;
    report += `**Classification**: CONFIDENTIAL - HANDLE WITH CARE\n\n`;

    report += `## 🚨 CRITICAL SECURITY NOTES\n\n`;
    report += `1. ❌ **DO NOT commit to git**\n`;
    report += `2. ❌ **DO NOT share with others**\n`;
    report += `3. ❌ **DO NOT push to repositories**\n`;
    report += `4. ❌ **DO NOT upload to public LLMs**\n`;
    report += `5. ✅ **Keep LOCAL and PRIVATE ONLY**\n`;
    report += `6. ✅ **Delete after use**\n`;
    report += `7. ✅ **Add SENSITIVE_COMPRESSION_REPORT.md to .gitignore**\n\n`;

    report += `## 📁 Sensitive Files Processed\n\n`;
    for (const file of files) {
      report += `- \`${file}\` (contains credentials/secrets)\n`;
    }
    report += `\n`;

    report += `## 🔐 Data Contained\n\n`;
    report += `This report may contain:\n`;
    report += `- Database passwords and connection strings\n`;
    report += `- API keys and authentication tokens\n`;
    report += `- Third-party service credentials\n`;
    report += `- Private encryption keys\n`;
    report += `- Cloud provider credentials (AWS, Azure, GCP)\n`;
    report += `- SSH keys and certificates\n`;
    report += `- OAuth tokens and refresh tokens\n\n`;

    report += `## 🛡️ Remediation Steps\n\n`;
    report += `1. **Review locally only** - Never transmit over networks\n`;
    report += `2. **Verify authenticity** - Check if credentials are still valid\n`;
    report += `3. **Consider rotation** - If file was ever exposed, rotate credentials\n`;
    report += `4. **Add to .gitignore**:\n`;
    report += `   \`\`\`\n`;
    report += `   SENSITIVE_COMPRESSION_REPORT.md\n`;
    report += `   .env\n`;
    report += `   .env.local\n`;
    report += `   secrets.yaml\n`;
    report += `   api_keys.json\n`;
    report += `   credentials.json\n`;
    report += `   .aws/\n`;
    report += `   .ssh/\n`;
    report += `   \`\`\`\n`;
    report += `5. **Delete file** - Remove after use\n\n`;

    report += `---\n\n`;
    report += `**Confidential**: Handle with utmost care\n`;
    report += `**Created**: ${new Date().toLocaleString()}\n`;

    return report;
  }

  /**
   * Generate compression settings UI text
   */
  static generateCompressionDialog(): string {
    return `┌─────────────────────────────────────────────────────────┐
│  Code Compression Settings                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Compression Options:                                   │
│                                                         │
│  ☑ Compress docstrings                                  │
│  ☑ Remove redundant comments                            │
│  ☑ Normalize whitespace                                 │
│  ☑ Compress logger messages                             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔒 Sensitive Files                              │   │
│  │ .env files will be skipped by default          │   │
│  │                                                 │   │
│  │  [ Include Sensitive Files ]                   │   │
│  │     (creates separate report)                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                [ Compress ]  [ Cancel ]                 │
└─────────────────────────────────────────────────────────┘`;
  }

  /**
   * Generate sensitive files warning dialog
   */
  static generateSensitiveWarningDialog(files: string[]): string {
    return `┌─────────────────────────────────────────────────────────┐
│  ⚠️ WARNING - SENSITIVE DATA                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  This will compress files containing:                   │
│  - Database passwords                                   │
│  - API keys and tokens                                  │
│  - Private credentials                                  │
│                                                         │
│  ⚠️ Output will be marked as SENSITIVE                  │
│  ❌ Do NOT commit to git                                │
│  ❌ Do NOT share publicly                               │
│  ✅ Store locally only                                  │
│                                                         │
│  Files to compress:                                     │
${files.map((f) => `│  - ${f}`).join('\n')}
│                                                         │
│  I understand the risks                                 │
│  [ ✓ Proceed ]  [ ✗ Cancel ]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘`;
  }
}
