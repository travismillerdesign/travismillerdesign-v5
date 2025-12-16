// ESLint Configuration (Flat Config Format)
// Simple, practical linting for catching bugs in JavaScript

module.exports = [
    {
        ignores: ['_site/', 'node_modules/', '_src/styles/'],
    },
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                IntersectionObserver: 'readonly',
                CustomEvent: 'readonly',
                fetch: 'readonly',
                DOMParser: 'readonly',
                performance: 'readonly',
                Buffer: 'readonly',
                // P5.js globals (loaded from CDN)
                p5: 'readonly',
                // Node.js globals (for build scripts)
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'no-console': 'off',
            'prefer-const': 'warn',
            'no-var': 'warn',
        },
    },
];
