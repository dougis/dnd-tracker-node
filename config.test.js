import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('Monorepo configuration', () => {
  it('should have proper package.json structure', () => {
    const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
    
    expect(rootPackage.workspaces).toEqual(['packages/*']);
    expect(rootPackage.private).toBe(true);
    expect(rootPackage.name).toBe('dnd-tracker-node');
  });

  it('should have all required packages', () => {
    const packages = ['server', 'client', 'shared'];
    
    packages.forEach(pkg => {
      const packagePath = path.join('packages', pkg, 'package.json');
      expect(existsSync(packagePath)).toBe(true);
      
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      expect(packageJson.name).toBe(`@dnd-tracker/${pkg}`);
    });
  });

  it('should have proper TypeScript configuration', () => {
    expect(existsSync('tsconfig.json')).toBe(true);
    
    const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
    expect(tsConfig.references).toHaveLength(3);
    expect(tsConfig.references.map(ref => ref.path)).toEqual([
      './packages/server',
      './packages/client',
      './packages/shared'
    ]);
  });

  it('should have ESLint configuration', () => {
    expect(existsSync('.eslintrc.json')).toBe(true);
    
    const eslintConfig = JSON.parse(readFileSync('.eslintrc.json', 'utf8'));
    expect(eslintConfig.root).toBe(true);
    expect(eslintConfig.extends).toContain('plugin:@typescript-eslint/recommended');
  });

  it('should have Prettier configuration', () => {
    expect(existsSync('prettier.config.js')).toBe(true);
  });

  it('should have Docker configuration', () => {
    expect(existsSync('docker-compose.yml')).toBe(true);
  });

  it('should have Vite configuration for client', () => {
    expect(existsSync('packages/client/vite.config.ts')).toBe(true);
  });

  it('should have proper source directories', () => {
    const sourceDirs = [
      'packages/server/src',
      'packages/client/src',
      'packages/shared/src'
    ];
    
    sourceDirs.forEach(dir => {
      expect(existsSync(dir)).toBe(true);
    });
  });
});