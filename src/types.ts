/**
 * Result of path resolution
 */
export interface PathResolutionResult {
  /** The resolved target path */
  targetPath: string;
  /** Whether the current file is a spec file */
  isSpec: boolean;
  /** Whether the file is within a pack directory */
  isPack: boolean;
  /** The pack name if applicable */
  packName?: string;
}

/**
 * Information extracted from a pack file path
 */
export interface PackInfo {
  /** The name of the pack */
  packName: string;
  /** The path relative to the pack directory (after packs/<name>/) */
  relativePath: string;
}

