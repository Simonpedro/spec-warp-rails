import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isSpecFile,
  isPackFile,
  extractPackInfo,
  resolveSpecPath,
  resolveImplementationPath,
  togglePath
} from '../pathResolver';

describe('isSpecFile', () => {
  it('returns true for files ending with _spec.rb', () => {
    assert.strictEqual(isSpecFile('spec/models/user_spec.rb'), true);
    assert.strictEqual(isSpecFile('packs/auth/spec/services/login_spec.rb'), true);
  });

  it('returns true for files in spec/ directory', () => {
    assert.strictEqual(isSpecFile('spec/support/helpers.rb'), true);
    assert.strictEqual(isSpecFile('packs/core/spec/support/factory.rb'), true);
  });

  it('returns false for implementation files', () => {
    assert.strictEqual(isSpecFile('app/models/user.rb'), false);
    assert.strictEqual(isSpecFile('lib/my_gem.rb'), false);
    assert.strictEqual(isSpecFile('packs/auth/app/services/login.rb'), false);
  });

  it('handles Windows-style paths', () => {
    assert.strictEqual(isSpecFile('spec\\models\\user_spec.rb'), true);
    assert.strictEqual(isSpecFile('app\\models\\user.rb'), false);
  });
});

describe('isPackFile', () => {
  it('returns true for files in packs/ directory', () => {
    assert.strictEqual(isPackFile('packs/donor_sync/app/lib/donor_sync.rb'), true);
    assert.strictEqual(isPackFile('/project/packs/auth/app/models/user.rb'), true);
    assert.strictEqual(isPackFile('packs/core/spec/models/user_spec.rb'), true);
  });

  it('returns false for standard Rails files', () => {
    assert.strictEqual(isPackFile('app/models/user.rb'), false);
    assert.strictEqual(isPackFile('spec/models/user_spec.rb'), false);
    assert.strictEqual(isPackFile('lib/utils.rb'), false);
  });
});

describe('extractPackInfo', () => {
  it('extracts pack name and relative path', () => {
    const result = extractPackInfo('packs/donor_sync/app/lib/donor_sync.rb');
    assert.deepStrictEqual(result, {
      packName: 'donor_sync',
      relativePath: 'app/lib/donor_sync.rb'
    });
  });

  it('handles absolute paths', () => {
    const result = extractPackInfo('/Users/dev/project/packs/auth/app/models/user.rb');
    assert.deepStrictEqual(result, {
      packName: 'auth',
      relativePath: 'app/models/user.rb'
    });
  });

  it('returns null for non-pack files', () => {
    assert.strictEqual(extractPackInfo('app/models/user.rb'), null);
    assert.strictEqual(extractPackInfo('lib/utils.rb'), null);
  });
});

describe('resolveSpecPath', () => {
  describe('Standard Rails Structure', () => {
    it('converts app/models to spec/models', () => {
      assert.strictEqual(
        resolveSpecPath('app/models/donor.rb'),
        'spec/models/donor_spec.rb'
      );
    });

    it('converts app/controllers to spec/controllers', () => {
      assert.strictEqual(
        resolveSpecPath('app/controllers/users_controller.rb'),
        'spec/controllers/users_controller_spec.rb'
      );
    });

    it('converts nested controllers', () => {
      assert.strictEqual(
        resolveSpecPath('app/controllers/api/v1/users_controller.rb'),
        'spec/controllers/api/v1/users_controller_spec.rb'
      );
    });

    it('converts app/services to spec/services', () => {
      assert.strictEqual(
        resolveSpecPath('app/services/processor.rb'),
        'spec/services/processor_spec.rb'
      );
    });

    it('converts app/lib to spec/lib', () => {
      assert.strictEqual(
        resolveSpecPath('app/lib/helpers.rb'),
        'spec/lib/helpers_spec.rb'
      );
    });

    it('converts root lib/ to spec/', () => {
      assert.strictEqual(
        resolveSpecPath('lib/my_gem.rb'),
        'spec/my_gem_spec.rb'
      );
    });

    it('converts lib/utils/helper.rb to spec/utils/helper_spec.rb', () => {
      assert.strictEqual(
        resolveSpecPath('lib/utils/helper.rb'),
        'spec/utils/helper_spec.rb'
      );
    });

    it('handles absolute paths', () => {
      assert.strictEqual(
        resolveSpecPath('/Users/dev/project/app/models/user.rb'),
        '/Users/dev/project/spec/models/user_spec.rb'
      );
    });
  });

  describe('Packwerk Structure', () => {
    it('converts pack app/lib to pack spec/lib', () => {
      assert.strictEqual(
        resolveSpecPath('packs/donor_sync/app/lib/donor_sync.rb'),
        'packs/donor_sync/spec/lib/donor_sync_spec.rb'
      );
    });

    it('converts pack app/services to pack spec/services', () => {
      assert.strictEqual(
        resolveSpecPath('packs/manufacturing/app/services/processor.rb'),
        'packs/manufacturing/spec/services/processor_spec.rb'
      );
    });

    it('converts pack app/models to pack spec/models', () => {
      assert.strictEqual(
        resolveSpecPath('packs/helm/app/models/equipment.rb'),
        'packs/helm/spec/models/equipment_spec.rb'
      );
    });

    it('handles nested namespaces in packs', () => {
      assert.strictEqual(
        resolveSpecPath('packs/donor_sync/app/lib/donor_sync/group_i/demographics.rb'),
        'packs/donor_sync/spec/lib/donor_sync/group_i/demographics_spec.rb'
      );
    });

    it('handles absolute paths with packs', () => {
      assert.strictEqual(
        resolveSpecPath('/Users/dev/project/packs/auth/app/models/user.rb'),
        '/Users/dev/project/packs/auth/spec/models/user_spec.rb'
      );
    });
  });

  describe('Edge Cases', () => {
    it('does not double-insert _spec suffix', () => {
      // If somehow a file already ends with _spec.rb, don't make it _spec_spec.rb
      assert.strictEqual(
        resolveSpecPath('app/models/user_spec.rb'),
        'spec/models/user_spec.rb'
      );
    });
  });
});

describe('resolveImplementationPath', () => {
  describe('Standard Rails Structure', () => {
    it('converts spec/models to app/models', () => {
      assert.strictEqual(
        resolveImplementationPath('spec/models/donor_spec.rb'),
        'app/models/donor.rb'
      );
    });

    it('converts spec/controllers to app/controllers', () => {
      assert.strictEqual(
        resolveImplementationPath('spec/controllers/users_controller_spec.rb'),
        'app/controllers/users_controller.rb'
      );
    });

    it('converts nested controllers', () => {
      assert.strictEqual(
        resolveImplementationPath('spec/controllers/api/v1/users_controller_spec.rb'),
        'app/controllers/api/v1/users_controller.rb'
      );
    });

    it('converts spec/lib to app/lib', () => {
      assert.strictEqual(
        resolveImplementationPath('spec/lib/helpers_spec.rb'),
        'app/lib/helpers.rb'
      );
    });

    it('converts spec root files to lib', () => {
      // Root-level spec files (not in a known Rails app directory) map to lib/
      assert.strictEqual(
        resolveImplementationPath('spec/my_gem_spec.rb'),
        'lib/my_gem.rb'
      );
    });

    it('handles absolute paths', () => {
      assert.strictEqual(
        resolveImplementationPath('/Users/dev/project/spec/models/user_spec.rb'),
        '/Users/dev/project/app/models/user.rb'
      );
    });
  });

  describe('Packwerk Structure', () => {
    it('converts pack spec/lib to pack app/lib', () => {
      assert.strictEqual(
        resolveImplementationPath('packs/donor_sync/spec/lib/donor_sync_spec.rb'),
        'packs/donor_sync/app/lib/donor_sync.rb'
      );
    });

    it('converts pack spec/services to pack app/services', () => {
      assert.strictEqual(
        resolveImplementationPath('packs/manufacturing/spec/services/processor_spec.rb'),
        'packs/manufacturing/app/services/processor.rb'
      );
    });

    it('converts pack spec/models to pack app/models', () => {
      assert.strictEqual(
        resolveImplementationPath('packs/helm/spec/models/equipment_spec.rb'),
        'packs/helm/app/models/equipment.rb'
      );
    });

    it('handles nested namespaces in packs', () => {
      assert.strictEqual(
        resolveImplementationPath('packs/donor_sync/spec/lib/donor_sync/group_i/demographics_spec.rb'),
        'packs/donor_sync/app/lib/donor_sync/group_i/demographics.rb'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles spec files without _spec suffix', () => {
      // Files in spec/ directory that don't have _spec suffix (like support files)
      // These map to lib/ since 'support' is not a known Rails app directory
      assert.strictEqual(
        resolveImplementationPath('spec/support/helpers.rb'),
        'lib/support/helpers.rb'
      );
    });
  });
});

describe('togglePath', () => {
  it('returns correct result for implementation file', () => {
    const result = togglePath('app/models/user.rb');
    assert.strictEqual(result.targetPath, 'spec/models/user_spec.rb');
    assert.strictEqual(result.isSpec, false);
    assert.strictEqual(result.isPack, false);
    assert.strictEqual(result.packName, undefined);
  });

  it('returns correct result for spec file', () => {
    const result = togglePath('spec/models/user_spec.rb');
    assert.strictEqual(result.targetPath, 'app/models/user.rb');
    assert.strictEqual(result.isSpec, true);
    assert.strictEqual(result.isPack, false);
  });

  it('returns correct result for pack implementation file', () => {
    const result = togglePath('packs/auth/app/models/user.rb');
    assert.strictEqual(result.targetPath, 'packs/auth/spec/models/user_spec.rb');
    assert.strictEqual(result.isSpec, false);
    assert.strictEqual(result.isPack, true);
    assert.strictEqual(result.packName, 'auth');
  });

  it('returns correct result for pack spec file', () => {
    const result = togglePath('packs/auth/spec/models/user_spec.rb');
    assert.strictEqual(result.targetPath, 'packs/auth/app/models/user.rb');
    assert.strictEqual(result.isSpec, true);
    assert.strictEqual(result.isPack, true);
    assert.strictEqual(result.packName, 'auth');
  });
});

describe('Round-trip conversions', () => {
  const testCases = [
    'app/models/donor.rb',
    'app/controllers/users_controller.rb',
    'app/controllers/api/v1/users_controller.rb',
    'app/services/processor.rb',
    'app/lib/helpers.rb',
    'lib/my_gem.rb',
    'lib/utils/helper.rb',
    'packs/donor_sync/app/lib/donor_sync.rb',
    'packs/manufacturing/app/services/processor.rb',
    'packs/helm/app/models/equipment.rb',
    'packs/donor_sync/app/lib/donor_sync/group_i/demographics.rb'
  ];

  for (const implPath of testCases) {
    it(`round-trips correctly: ${implPath}`, () => {
      const specPath = resolveSpecPath(implPath);
      const backToImpl = resolveImplementationPath(specPath);
      assert.strictEqual(backToImpl, implPath);
    });
  }
});

