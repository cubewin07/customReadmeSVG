import { handleRequest } from '../../src/runtime/handleRequest.js';

/**
 * Netlify Function handler for dynamic SVG card generation.
 */
export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Pass root page and static assets through to Netlify static CDN
    if (
      pathname === '/' ||
      pathname.startsWith('/assets') ||
      pathname.startsWith('/src') ||
      pathname.endsWith('.html') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.json') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg')
    ) {
      return context.next();
    }

    const query = Object.fromEntries(url.searchParams.entries());
    const result = await handleRequest(pathname, { query });

    if (result) {
      return new Response(result.body, {
        status: result.status || 200,
        headers: result.headers || { 'Content-Type': 'image/svg+xml; charset=utf-8' },
      });
    }
  } catch (err) {
    console.error('Error in Netlify SVG function:', err);
  }

  return new Response('Not Found', { status: 404 });
};

export const config = {
  path: ['/', '/:user', '/:user/:card'],
};
