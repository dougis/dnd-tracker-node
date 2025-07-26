# Linting Tools and Automation Setup

This document outlines the linting tools and automation configured for the D&D Tracker project.

## Installed Tools

### ESLint v9.32.0

**Purpose**: JavaScript and TypeScript code linting and formatting

**Configuration Files**:

- Root: `eslint.config.js` - Monorepo-wide configuration
- Server: `packages/server/eslint.config.js` - Backend-specific rules
- Client: `packages/client/eslint.config.js` - Frontend-specific rules with React
- Shared: `packages/shared/eslint.config.js` - Shared package rules

**Dependencies**:

- `@eslint/js`: ^9.32.0
- `typescript-eslint`: ^8.38.0
- `eslint-plugin-react-hooks`: ^5.1.0 (client only)
- `eslint-plugin-react-refresh`: ^0.4.16 (client only)

### Markdownlint CLI v0.43.0

**Purpose**: Markdown file linting and formatting

**Configuration File**: `.markdownlint.json`

**Key Rules**:

- Line length limit: 120 characters
- Consistent list formatting
- Fenced code blocks with language specification
- Proper heading structure

## Command Line Usage

### Running Linting Tools

**ESLint**:

```bash
# Check all issues
npm run lint:eslint

# Auto-fix issues
npm run lint:eslint:fix

# Run on specific workspace
npm run lint --workspace=packages/server
```

**Markdownlint**:

```bash
# Check all markdown files
npm run lint:md

# Auto-fix markdown issues
npm run lint:md:fix
```

**Combined Linting**:

```bash
# Run all linting tools (ESLint + Markdownlint)
npm run lint

# Auto-fix all issues
npm run lint:fix
```

### Individual Package Linting

Each package has its own linting configuration:

```bash
# Server package
npm run lint --workspace=packages/server
npm run lint:fix --workspace=packages/server

# Client package  
npm run lint --workspace=packages/client
npm run lint:fix --workspace=packages/client

# Shared package
npm run lint --workspace=packages/shared
npm run lint:fix --workspace=packages/shared
```

## Automation

### Pre-commit Hooks (Husky v9.1.7)

**Setup**: Automatically runs `npm run lint:fix` before each commit

**Location**: `.husky/pre-commit`

**Behavior**:

- Runs ESLint auto-fix on all TypeScript/JavaScript files
- Runs Markdownlint auto-fix on all Markdown files
- Automatically fixes issues that can be corrected
- Prevents commit if unfixable issues remain

### GitHub Actions

**Workflow**: `.github/workflows/lint-auto-fix.yml`

**Trigger**: Runs on pull request open/sync

**Actions**:

1. Checkout code with write permissions
2. Setup Node.js v22.15.0
3. Install dependencies
4. Run ESLint auto-fix
5. Run Markdownlint auto-fix
6. Commit and push changes if files were modified

**Commit Message**: "GitHub action corrected formatting"

## Tool Versions

| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | ^9.32.0 | JavaScript/TypeScript linting |
| @eslint/js | ^9.32.0 | ESLint base configuration |
| typescript-eslint | ^8.38.0 | TypeScript ESLint rules |
| Markdownlint CLI | ^0.43.0 | Markdown linting |
| Husky | ^9.1.7 | Git hooks |

## Configuration Details

### ESLint Rules

**Common Rules** (applied across all packages):

- `@typescript-eslint/no-unused-vars`: Error with underscore prefix ignore
- `@typescript-eslint/explicit-function-return-type`: Off
- `@typescript-eslint/explicit-module-boundary-types`: Off
- `@typescript-eslint/no-explicit-any`: Warning

**Client-Specific Rules**:

- React Hooks rules enabled
- React Refresh rules for development

**Server-Specific Rules**:

- `no-console`: Off (allows console.log in server code)

### Markdownlint Configuration

- **Line Length**: 120 characters (with exceptions for tables and code)
- **HTML Elements**: Allows `<br>`, `<kbd>`, `<sup>`, `<sub>`, `<details>`, `<summary>`
- **Code Blocks**: Must specify language
- **Lists**: Require blank lines around them
- **Headings**: Must have blank lines around them

## Troubleshooting

### Common Issues

**ESLint fails to run**:

- Ensure all packages are installed: `npm install`
- Check TypeScript compilation: `npm run typecheck`

**Markdownlint finds many issues**:

- Run auto-fix first: `npm run lint:md:fix`
- Check `.markdownlint.json` for rule configuration

**Pre-commit hook is slow**:

- Consider running linting on changed files only
- Use `--cache` flag for ESLint in individual packages

**GitHub Action fails**:

- Check Node.js version compatibility
- Ensure proper permissions in repository settings
- Verify workflow syntax in `.github/workflows/lint-auto-fix.yml`

### Best Practices

1. **Run linting before pushing**: Always run `npm run lint:fix` before pushing changes
2. **Configure IDE integration**: Set up ESLint and Markdownlint extensions in your editor
3. **Regular updates**: Keep linting tools updated to latest stable versions
4. **Custom rules**: Add project-specific rules to configuration files as needed
5. **Performance**: Use caching and incremental linting for large codebases
