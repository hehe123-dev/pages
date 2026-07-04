// devlens.config.js — map your source files to dev server routes
/** @type {import('devlens-mcp').DevLensConfig} */
const config = {
  devServerUrl: 'http://localhost:8080',
  hmrDebounceMs: 150,
  defaultViewport: { width: 1280, height: 900 },
  routes: [
    // { pattern: '**/pages/Home.tsx', route: '/' },
    // { pattern: '**/pages/About.tsx', route: '/about' },
    // { pattern: '**/components/**', route: null }, // null = no auto-route for components
  ],
};

export default config;
