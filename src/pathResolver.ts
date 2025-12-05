import type { PackInfo, PathResolutionResult } from './types';

/**
 * Checks if a file path represents a spec file
 * A file is considered a spec if it ends with _spec.rb or is in a spec/ directory
 */
export function isSpecFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Check if file ends with _spec.rb
  if (normalizedPath.endsWith('_spec.rb')) {
    return true;
  }
  
  // Check if file is in a spec/ directory
  // Handle both root-level spec/ and pack-level spec/
  const pathParts = normalizedPath.split('/');
  return pathParts.includes('spec');
}

/**
 * Checks if a file path is within a packwerk pack directory
 */
export function isPackFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  // Match packs/<pack_name>/ pattern
  return /\/packs\/[^/]+\//.test(normalizedPath) || normalizedPath.startsWith('packs/');
}

/**
 * Extracts pack information from a file path
 * Returns null if the file is not in a pack
 */
export function extractPackInfo(filePath: string): PackInfo | null {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Match packs/<pack_name>/... pattern
  const match = normalizedPath.match(/^(.*\/)?packs\/([^/]+)\/(.+)$/);
  
  if (!match) {
    return null;
  }
  
  return {
    packName: match[2],
    relativePath: match[3]
  };
}

/**
 * Resolves the spec path for a given implementation file path
 */
export function resolveSpecPath(implPath: string): string {
  const normalizedPath = implPath.replace(/\\/g, '/');
  
  // Handle pack files
  if (isPackFile(normalizedPath)) {
    return resolvePackSpecPath(normalizedPath);
  }
  
  // Handle standard Rails files
  return resolveStandardSpecPath(normalizedPath);
}

/**
 * Resolves spec path for files within a pack
 */
function resolvePackSpecPath(implPath: string): string {
  const packInfo = extractPackInfo(implPath);
  
  if (!packInfo) {
    // Fallback: shouldn't happen if isPackFile was checked first
    return resolveStandardSpecPath(implPath);
  }
  
  const { packName, relativePath } = packInfo;
  
  // Replace app/ with spec/ in the relative path
  let specRelativePath = relativePath;
  if (relativePath.startsWith('app/')) {
    specRelativePath = relativePath.replace(/^app\//, 'spec/');
  } else if (!relativePath.startsWith('spec/')) {
    // If not in app/ or spec/, prepend spec/
    specRelativePath = `spec/${relativePath}`;
  }
  
  // Insert _spec before .rb extension
  specRelativePath = insertSpecSuffix(specRelativePath);
  
  // Extract the prefix (everything before packs/)
  const prefixMatch = implPath.match(/^(.*\/)?packs\//);
  const prefix = prefixMatch ? prefixMatch[1] || '' : '';
  
  return `${prefix}packs/${packName}/${specRelativePath}`;
}

/**
 * Resolves spec path for standard Rails files (not in packs)
 */
function resolveStandardSpecPath(implPath: string): string {
  let specPath = implPath;
  
  // Handle app/ -> spec/ transformation
  if (specPath.includes('/app/') || specPath.startsWith('app/')) {
    specPath = specPath.replace(/^(.*)\/app\//, '$1/spec/').replace(/^app\//, 'spec/');
  } else if (specPath.includes('/lib/') || specPath.startsWith('lib/')) {
    // Handle lib/ -> spec/ transformation
    // lib/my_gem.rb -> spec/my_gem_spec.rb
    // app/lib/helpers.rb -> spec/lib/helpers_spec.rb (handled by app/ case above)
    specPath = specPath.replace(/^(.*)\/lib\//, '$1/spec/').replace(/^lib\//, 'spec/');
  } else if (!specPath.includes('/spec/') && !specPath.startsWith('spec/')) {
    // For files not in app/, lib/, or spec/, prepend spec/
    const lastSlash = specPath.lastIndexOf('/');
    if (lastSlash !== -1) {
      specPath = specPath.substring(0, lastSlash) + '/spec' + specPath.substring(lastSlash);
    } else {
      specPath = `spec/${specPath}`;
    }
  }
  
  // Insert _spec before .rb extension
  specPath = insertSpecSuffix(specPath);
  
  return specPath;
}

/**
 * Resolves the implementation path for a given spec file path
 */
export function resolveImplementationPath(specPath: string): string {
  const normalizedPath = specPath.replace(/\\/g, '/');
  
  // Handle pack files
  if (isPackFile(normalizedPath)) {
    return resolvePackImplementationPath(normalizedPath);
  }
  
  // Handle standard Rails files
  return resolveStandardImplementationPath(normalizedPath);
}

/**
 * Resolves implementation path for spec files within a pack
 */
function resolvePackImplementationPath(specPath: string): string {
  const packInfo = extractPackInfo(specPath);
  
  if (!packInfo) {
    return resolveStandardImplementationPath(specPath);
  }
  
  const { packName, relativePath } = packInfo;
  
  // Replace spec/ with app/ in the relative path
  let implRelativePath = relativePath;
  if (relativePath.startsWith('spec/')) {
    implRelativePath = relativePath.replace(/^spec\//, 'app/');
  }
  
  // Remove _spec before .rb extension
  implRelativePath = removeSpecSuffix(implRelativePath);
  
  // Extract the prefix
  const prefixMatch = specPath.match(/^(.*\/)?packs\//);
  const prefix = prefixMatch ? prefixMatch[1] || '' : '';
  
  return `${prefix}packs/${packName}/${implRelativePath}`;
}

/**
 * Known Rails app directories that map to app/
 */
const RAILS_APP_DIRECTORIES = [
  'models',
  'controllers',
  'services',
  'helpers',
  'mailers',
  'jobs',
  'workers',
  'concerns',
  'views',
  'channels',
  'components',
  'decorators',
  'policies',
  'serializers',
  'uploaders',
  'validators',
  'lib'  // app/lib/ maps to spec/lib/
];

/**
 * Resolves implementation path for standard Rails spec files
 */
function resolveStandardImplementationPath(specPath: string): string {
  let implPath = specPath;
  
  // Handle spec/ -> app/ or lib/ transformation
  if (implPath.includes('/spec/') || implPath.startsWith('spec/')) {
    // Extract the path after spec/
    const specMatch = implPath.match(/^(.*)\/spec\/(.*)$/) || implPath.match(/^spec\/(.*)$/);
    
    if (specMatch) {
      const prefix = specMatch.length === 3 ? specMatch[1] : '';
      const relativePath = specMatch.length === 3 ? specMatch[2] : specMatch[1];
      
      // Check if the first directory after spec/ is a known Rails app directory
      const firstDir = relativePath.split('/')[0];
      const isRailsAppDir = RAILS_APP_DIRECTORIES.includes(firstDir);
      
      if (isRailsAppDir) {
        // Map to app/
        implPath = prefix ? `${prefix}/app/${relativePath}` : `app/${relativePath}`;
      } else {
        // Map to lib/ (for files like spec/my_gem_spec.rb -> lib/my_gem.rb)
        implPath = prefix ? `${prefix}/lib/${relativePath}` : `lib/${relativePath}`;
      }
    }
  }
  
  // Remove _spec before .rb extension
  implPath = removeSpecSuffix(implPath);
  
  return implPath;
}

/**
 * Inserts _spec suffix before .rb extension if not already present
 */
function insertSpecSuffix(filePath: string): string {
  if (filePath.endsWith('_spec.rb')) {
    return filePath;
  }
  return filePath.replace(/\.rb$/, '_spec.rb');
}

/**
 * Removes _spec suffix before .rb extension
 */
function removeSpecSuffix(filePath: string): string {
  return filePath.replace(/_spec\.rb$/, '.rb');
}

/**
 * Main entry point: toggles between implementation and spec paths
 * Returns the target path and metadata about the resolution
 */
export function togglePath(currentPath: string): PathResolutionResult {
  const normalizedPath = currentPath.replace(/\\/g, '/');
  const isPack = isPackFile(normalizedPath);
  const isSpec = isSpecFile(normalizedPath);
  
  let targetPath: string;
  if (isSpec) {
    targetPath = resolveImplementationPath(normalizedPath);
  } else {
    targetPath = resolveSpecPath(normalizedPath);
  }
  
  const result: PathResolutionResult = {
    targetPath,
    isSpec,
    isPack
  };
  
  if (isPack) {
    const packInfo = extractPackInfo(normalizedPath);
    if (packInfo) {
      result.packName = packInfo.packName;
    }
  }
  
  return result;
}

