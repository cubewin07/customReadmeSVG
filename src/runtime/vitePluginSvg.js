import { handleRequest } from './handleRequest.js';

/**
 * Vite plugin middleware that intercepts SVG card requests during dev.
 */
export function vitePluginSvg() {
  return {
    name: 'vite-plugin-custom-readme-svg',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const pathname = url.pathname;

          // Ignore obvious Vite internal asset requests
          if (
            pathname.startsWith('/@') ||
            pathname.startsWith('/src') ||
            pathname.startsWith('/node_modules') ||
            pathname.startsWith('/public') ||
            pathname === '/' ||
            pathname.endsWith('.html') ||
            pathname.endsWith('.jsx') ||
            pathname.endsWith('.js') ||
            pathname.endsWith('.css') ||
            pathname.endsWith('.json') ||
            pathname.endsWith('.ico') ||
            pathname.endsWith('.png') ||
            pathname.endsWith('.svg')
          ) {
            return next();
          }

          const query = Object.fromEntries(url.searchParams.entries());
          const result = await handleRequest(pathname, { query });

          if (result) {
            res.statusCode = result.status || 200;
            for (const [key, val] of Object.entries(result.headers || {})) {
              res.setHeader(key, val);
            }
            return res.end(result.body);
          }
        } catch (err) {
          console.error('Error in vitePluginSvg middleware:', err);
        }
        next();
      });
    },
  };
}
