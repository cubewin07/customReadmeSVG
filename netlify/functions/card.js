import { handleRequest } from '../../src/runtime/handleRequest.js';

/**
 * Netlify Function handler for dynamic SVG card generation.
 */
export default async (req) => {
  try {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());

    const result = await handleRequest(url.pathname, { query });

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
  path: ['/:user', '/:user/:card'],
};
