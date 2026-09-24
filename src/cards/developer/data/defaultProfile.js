/**
 * Default profile metadata for the Developer Showcase card.
 * Rich fallback dataset for Le Tan Thang (@cubewin07).
 */
export const DEFAULT_DEVELOPER_PROFILE = {
  name: 'Le Tan Thang',
  login: 'cubewin07',
  handle: '@cubewin07',
  role: 'Full-Stack Engineer & Creative Coder',
  status: 'Building cool things 🚀',
  focus: [
    'Crafting interactive web apps & reactive UI systems',
    'with dynamic, game-inspired SVG animation engines.',
  ],
  tech: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js'],
  stats: [
    { label: 'REPOSITORIES', value: 28 },
    { label: 'TOTAL STARS', value: 64 },
    { label: 'FOLLOWERS', value: 42 },
  ],
  commit: 'feat: add SVG animation engine',
  streak: 14,
  repos: [
    {
      name: 'customReadmeSVG',
      language: 'JavaScript',
      color: '#f1e05a',
      stars: 32,
      description: 'Dynamic, game-inspired SVG cards',
      sparkline: [2, 4, 3, 6, 5, 8, 7, 9],
    },
    {
      name: 'financial-management',
      language: 'TypeScript',
      color: '#3178c6',
      stars: 18,
      description: 'Full-stack reactive finance platform',
      sparkline: [1, 2, 5, 3, 4, 6, 8, 7],
    },
    {
      name: 'creative-engine',
      language: 'Python',
      color: '#3572A5',
      stars: 14,
      description: 'Algorithmic artwork & visual tools',
      sparkline: [3, 3, 4, 2, 5, 4, 6, 9],
    },
  ],
  // 60-day commit count array with strategic 0-commit days for runner pits
  counts: [
    2, 4, 3, 5, 0, 4, 6, 8, 5, 3, 0, 4, 6, 5, 9, 3, 2, 6, 4, 0,
    5, 7, 6, 8, 4, 0, 5, 7, 6, 9, 4, 3, 7, 5, 0, 6, 8, 7, 4, 5,
    3, 6, 0, 5, 7, 8, 6, 4, 0, 5, 6, 8, 7, 9, 5, 4, 6, 8, 7, 5,
  ],
};
