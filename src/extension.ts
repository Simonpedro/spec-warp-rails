import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { togglePath } from './pathResolver';
import { createSpecFile } from './fileCreator';

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('spec-warp-rails.toggle', async () => {
    await toggleCommand();
  });

  context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  // Nothing to clean up
}

/**
 * Main toggle command handler
 */
async function toggleCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  
  if (!editor) {
    return;
  }
  
  const currentFile = editor.document.uri.fsPath;
  
  // Only work with Ruby files
  if (!currentFile.endsWith('.rb')) {
    return;
  }
  
  // Get configuration
  const config = vscode.workspace.getConfiguration('specWarpRails');
  const autoCreateSpec = config.get<boolean>('autoCreateSpec', true);
  const showNotifications = config.get<boolean>('showNotifications', true);
  
  // Resolve target path
  const result = togglePath(currentFile);
  const targetPath = result.targetPath;
  
  // Check if target file exists
  const targetExists = fs.existsSync(targetPath);
  
  if (targetExists) {
    // Open the target file
    await openFile(targetPath);
  } else if (autoCreateSpec && !result.isSpec) {
    // Auto-create the spec file (only when going from impl to spec)
    const created = await createSpecFile(targetPath, currentFile);
    if (created) {
      await openFile(targetPath);
      if (showNotifications) {
        vscode.window.showInformationMessage(`Created: ${path.basename(targetPath)}`);
      }
    } else {
      vscode.window.showErrorMessage(`Failed to create spec file`);
    }
  } else if (showNotifications) {
    // Show notification about missing implementation file
    const relativePath = vscode.workspace.asRelativePath(targetPath);
    vscode.window.showWarningMessage(`Implementation file not found: ${relativePath}`);
  }
}

/**
 * Opens a file in the editor
 */
async function openFile(filePath: string): Promise<void> {
  const uri = vscode.Uri.file(filePath);
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);
}

