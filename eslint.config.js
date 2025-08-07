// eslint.config.js - ESLint Flat Config for ExpliCoLearning
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
    ],
  },
  
  // Base configuration for TypeScript and JavaScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        global: 'readonly',
        __DEV__: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        performance: 'readonly',
        prompt: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        React: 'readonly',
        NodeJS: 'readonly',
        getComputedStyle: 'readonly',
        Image: 'readonly',
      },
    },
    
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'import': importPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },

    rules: {
      // Circular dependency detection - CRITICAL for preventing production errors
      'import/no-cycle': ['error', { 
        maxDepth: 10,
        ignoreExternal: true,
      }],
      
      // TDZ and variable usage detection - CRITICAL for runtime errors
      'no-use-before-define': ['error', {
        functions: false, // Function hoisting is safe
        classes: true,    // Class TDZ errors
        variables: true,  // Variable TDZ errors
        allowNamedExports: false,
      }],
      'no-undef': 'error', // Undefined variable usage
      'no-unused-vars': 'off', // Handled by TypeScript rule
      'no-redeclare': 'error', // Variable redeclaration issues
      
      // Additional import rules for code quality
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/order': ['warn', {
        groups: [
          'builtin',
          'external', 
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      }],
      
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/display-name': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off', // Not needed with React 17+
      'react/jsx-uses-vars': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/no-unknown-property': 'warn',
      'react/self-closing-comp': 'warn',
      
      // React Hooks rules - ENHANCED for error detection
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': ['error', {
        additionalHooks: '(useIsomorphicLayoutEffect|useAsyncEffect)'
      }],
      
      // Enhanced React error detection
      'react/no-access-state-in-setstate': 'error',
      'react/no-did-mount-set-state': 'error',
      'react/no-did-update-set-state': 'error',
      'react/no-will-update-set-state': 'error',
      'react/no-redundant-should-component-update': 'error',
      'react/no-unused-state': 'warn',
      'react/no-array-index-key': 'warn',
      
      // Runtime safety rules - CRITICAL for reference errors
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unsafe-negation': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-private-class-members': 'warn',
      'no-useless-escape': 'warn',
      'accessor-pairs': 'error',
      'array-callback-return': ['error', { allowImplicit: true }],
      'no-constructor-return': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': ['warn', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      }],
      
      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },
  
  // Specific configuration for test files
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**/*'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-cycle': 'warn', // Less strict for test files
    },
  },
  
  // Configuration for config files
  {
    files: ['*.config.{js,ts}', 'vite.config.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-cycle': 'off',
    },
  },
];