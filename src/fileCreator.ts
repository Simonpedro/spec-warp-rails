import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Infers the Ruby class/module name from a file path
 * e.g., app/models/user.rb -> User
 *       app/services/payment_processor.rb -> PaymentProcessor
 *       app/lib/donor_sync/group_i/demographics.rb -> DonorSync::GroupI::Demographics
 */
export function inferClassName(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Remove _spec suffix if present
  let cleanPath = normalizedPath.replace(/_spec\.rb$/, '.rb');
  
  // Extract the relevant path portion (after app/, lib/, spec/)
  let relativePath = cleanPath;
  
  // Remove pack prefix if present
  const packMatch = relativePath.match(/packs\/[^/]+\/(app|lib|spec)\/(.+)$/);
  if (packMatch) {
    relativePath = packMatch[2];
  } else {
    // Handle standard Rails paths
    const standardMatch = relativePath.match(/(?:app|lib|spec)\/(?:models|controllers|services|lib|workers|jobs|mailers|helpers|concerns)?\/?(.+)$/);
    if (standardMatch) {
      relativePath = standardMatch[1];
    }
  }
  
  // Remove .rb extension
  relativePath = relativePath.replace(/\.rb$/, '');
  
  // Convert path to class name
  // donor_sync/group_i/demographics -> DonorSync::GroupI::Demographics
  const parts = relativePath.split('/');
  const classNameParts = parts.map(part => {
    // Convert snake_case to PascalCase
    return part
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  });
  
  return classNameParts.join('::');
}

/**
 * Generates RSpec boilerplate content for a new spec file
 */
export function generateSpecContent(implPath: string): string {
  const className = inferClassName(implPath);
  
  return `# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ${className} do
  pending 'add some examples to (or delete) #{__FILE__}'
end
`;
}

/**
 * Creates a spec file with basic RSpec template
 * Returns true if the file was created successfully
 */
export async function createSpecFile(specPath: string, implPath: string): Promise<boolean> {
  try {
    const uri = vscode.Uri.file(specPath);
    
    // Check if file already exists
    try {
      await vscode.workspace.fs.stat(uri);
      // File exists, don't overwrite
      return false;
    } catch {
      // File doesn't exist, continue with creation
    }
    
    // Ensure directory exists
    const dirPath = path.dirname(specPath);
    const dirUri = vscode.Uri.file(dirPath);
    
    try {
      await vscode.workspace.fs.createDirectory(dirUri);
    } catch {
      // Directory might already exist, that's fine
    }
    
    // Generate content and write file
    const content = generateSpecContent(implPath);
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
    
    return true;
  } catch (error) {
    console.error('Failed to create spec file:', error);
    return false;
  }
}

