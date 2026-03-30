/**
 * Dynamic Context Cache Manager
 * Handles background caching, invalidation, and auto-refresh
 */

import * as vscode from 'vscode';
import { ContextCompressor, CompressedContext } from './compressor';
import * as fs from 'fs';
import * as path from 'path';

export class CacheManager {
  private cache: Map<string, CompressedContext> = new Map();
  private lastCompressionTime: number = 0;
  private isCompressing: boolean = false;
  private autoRecacheTimer: NodeJS.Timeout | null = null;
  private invalidateCacheTimer: NodeJS.Timeout | null = null;
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private compressor: ContextCompressor;

  constructor(private workspaceRoot: string) {
    this.compressor = new ContextCompressor();
  }

  async initialize(): Promise<void> {
    // Set up file watcher for auto-cache invalidation
    this.setupFileWatcher();

    // Initial cache creation
    await this.recacheAll();

    // Set up auto-recache interval
    this.startAutoRecache();
  }

  private setupFileWatcher(): void {
    if (!this.workspaceRoot) return;

    const excludePatterns = vscode.workspace
      .getConfiguration('tokenTrim')
      .get<string[]>('excludePatterns') || [];

    // Watch for file changes with proper exclusions to avoid node_modules, dist, etc.
    // Only watch source files that matter
    const pattern = new vscode.RelativePattern(this.workspaceRoot, '**/src/**/*.{ts,js,tsx,jsx,py,rs,go,java,cpp,c,py,rb,php,cs,swift,kt}');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern, false, true, false);

    // Debounce file watcher events to prevent excessive recaching
    this.fileWatcher.onDidChange(() => {
      this.debouncedInvalidateCache();
    });

    this.fileWatcher.onDidCreate(() => {
      this.debouncedInvalidateCache();
    });

    this.fileWatcher.onDidDelete(() => {
      this.debouncedInvalidateCache();
    });
  }

  private debouncedInvalidateCache(): void {
    // Clear any pending invalidation
    if (this.invalidateCacheTimer) {
      clearTimeout(this.invalidateCacheTimer);
    }

    // Debounce: only recache after 2 seconds of no file changes
    this.invalidateCacheTimer = setTimeout(() => {
      if (!this.isCompressing) {
        console.log('[TokenTrim] File change detected, recaching...');
        this.recacheAll().catch((error) => {
          console.error('[TokenTrim] Auto-recache failed:', error);
        });
      }
      this.invalidateCacheTimer = null;
    }, 2000);
  }

  private startAutoRecache(): void {
    const interval = vscode.workspace
      .getConfiguration('tokenTrim')
      .get<number>('autoRecacheInterval');

    if (!interval || interval === 0) return;

    this.autoRecacheTimer = setInterval(async () => {
      if (!this.isCompressing) {
        await this.recacheAll();
      }
    }, interval);
  }

  async recacheAll(): Promise<CompressedContext | null> {
    if (this.isCompressing) {
      console.log('[TokenTrim] Cache recalculation already in progress');
      return null;
    }

    this.isCompressing = true;

    try {
      const configuration = vscode.workspace.getConfiguration('tokenTrim');
      const compressionLevel = configuration.get<string>('compressionLevel') || 'balanced';
      const excludePatterns = configuration.get<string[]>('excludePatterns') || [];
      const maxSize = configuration.get<number>('maxContextSize') || 32000;

      // Get all relevant files from workspace
      const files = await this.getWorkspaceFiles(excludePatterns);
      let projectContent = '';
      let fileCount = 0;

      for (const file of files) {
        try {
          // Double-check it's a text file before reading
          if (!this.isTextFile(file)) {
            continue;
          }

          const content = await vscode.workspace.fs.readFile(vscode.Uri.file(path.join(this.workspaceRoot, file)));
          
          // Validate it's actually text content (not binary data masquerading as text)
          try {
            const textContent = new TextDecoder('utf-8', { fatal: true }).decode(content);
            projectContent += `\n// === FILE: ${file} ===\n${textContent}`;
            fileCount++;
          } catch (decodeError) {
            // Skip files that can't be decoded as UTF-8 (likely binary)
            console.debug(`[TokenTrim] Skipping non-UTF8 file: ${file}`);
            continue;
          }

          // Limit total size to prevent memory issues
          if (projectContent.length > maxSize * 10) {
            break;
          }
        } catch (error) {
          console.error(`[TokenTrim] Failed to read file ${file}:`, error);
        }
      }

      // Compress the collected context
      const compressed = this.compressor.compress(projectContent, compressionLevel as 'light' | 'balanced' | 'aggressive');
      compressed.fileCount = fileCount;

      // Cache the result
      this.cache.set('__project', compressed);
      this.lastCompressionTime = Date.now();

      return compressed;
    } finally {
      this.isCompressing = false;
    }
  }

  private async getWorkspaceFiles(excludePatterns: string[]): Promise<string[]> {
    try {
      const findFilesExclude: { [key: string]: boolean } = {};
      for (const pattern of excludePatterns) {
        findFilesExclude[pattern] = true;
      }

      const files = await vscode.workspace.findFiles('**/*', '{' + excludePatterns.join(',') + '}', 500);

      return files
        .map((uri) => vscode.workspace.asRelativePath(uri))
        .filter((file) => this.isTextFile(file))
        .slice(0, 500); // Hard limit to prevent excessive processing
    } catch (error) {
      console.error('[TokenTrim] Error finding workspace files:', error);
      return [];
    }
  }

  private isTextFile(filePath: string): boolean {
    // Binary file extensions to skip
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
      '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.a', '.lib',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      '.lock', '.log', '.md',
    ];

    const ext = path.extname(filePath).toLowerCase();
    if (binaryExtensions.includes(ext)) {
      return false;
    }

    // Also skip common compiled/bundled files that are binary-like
    const name = path.basename(filePath).toLowerCase();
    if (name === 'package-lock.json' || name === 'yarn.lock' || name === 'pnpm-lock.yaml') {
      return false;
    }

    // Skip node_modules, dist, build, coverage
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (
      normalizedPath.includes('/node_modules/') ||
      normalizedPath.includes('/dist/') ||
      normalizedPath.includes('/build/') ||
      normalizedPath.includes('/coverage/') ||
      normalizedPath.includes('/.git/') ||
      normalizedPath.includes('/.next/')
    ) {
      return false;
    }

    return true;
  }

  getCompressedContext(): CompressedContext | null {
    return this.cache.get('__project') || null;
  }

  getCompressionStatus(): {
    isCompressing: boolean;
    lastTime: number;
    cacheAge: number;
  } {
    return {
      isCompressing: this.isCompressing,
      lastTime: this.lastCompressionTime,
      cacheAge: Date.now() - this.lastCompressionTime,
    };
  }

  invalidateCache(): void {
    // Use debounced version for file watcher events
    this.debouncedInvalidateCache();
  }

  dispose(): void {
    if (this.autoRecacheTimer) {
      clearInterval(this.autoRecacheTimer);
    }
    if (this.invalidateCacheTimer) {
      clearTimeout(this.invalidateCacheTimer);
    }
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
  }
}
