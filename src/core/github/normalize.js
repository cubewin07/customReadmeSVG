/**
 * Data Normalization Helpers for GitHub GraphQL API Responses
 */

/**
 * Normalizes user profile response.
 * @param {object} rawData - Data payload returned by GraphQL (user object)
 * @returns {object}
 */
export function normalizeProfile(rawData) {
  if (!rawData || !rawData.user) return null;
  const user = rawData.user;
  return {
    login: user.login || '',
    name: user.name || user.login || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    url: user.url || `https://github.com/${user.login}`,
    followers: user.followers?.totalCount || 0,
    following: user.following?.totalCount || 0,
    repositories: user.repositories?.totalCount || 0,
    createdAt: user.createdAt || '',
    location: user.location || null,
    websiteUrl: user.websiteUrl || null,
    company: user.company || null,
    status: user.status ? { emoji: user.status.emoji, message: user.status.message } : null,
  };
}

/**
 * Aggregates language byte sizes across repositories and calculates percentages.
 * @param {object} rawData - Data payload returned by LANGUAGES_QUERY
 * @returns {object}
 */
export function normalizeLanguages(rawData) {
  if (!rawData || !rawData.user) return { languages: [], totalSize: 0 };
  const repos = rawData.user.repositories?.nodes || [];

  const langMap = new Map();
  let totalSize = 0;

  for (const repo of repos) {
    const edges = repo.languages?.edges || [];
    for (const { size, node } of edges) {
      if (!node || !node.name) continue;
      const { name, color } = node;
      totalSize += size;

      if (langMap.has(name)) {
        const existing = langMap.get(name);
        existing.size += size;
      } else {
        langMap.set(name, {
          name,
          color: color || '#858585',
          size,
        });
      }
    }
  }

  const languages = Array.from(langMap.values())
    .map(lang => ({
      ...lang,
      percentage: totalSize > 0 ? parseFloat(((lang.size / totalSize) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.size - a.size);

  return {
    languages,
    totalSize,
  };
}

/**
 * Normalizes top repositories list.
 * @param {object} rawData - Data payload returned by REPOS_QUERY
 * @returns {object}
 */
export function normalizeRepos(rawData) {
  if (!rawData || !rawData.user) return { repos: [] };
  const repos = rawData.user.repositories?.nodes || [];

  return {
    repos: repos.map(r => ({
      name: r.name,
      description: r.description || '',
      url: r.url,
      stargazerCount: r.stargazerCount || 0,
      forkCount: r.forkCount || 0,
      primaryLanguage: r.primaryLanguage ? { name: r.primaryLanguage.name, color: r.primaryLanguage.color } : null,
      updatedAt: r.updatedAt,
    })),
  };
}

/**
 * Aggregates repository star/fork counts and contribution breakdown.
 * @param {object} rawData - Data payload returned by STATS_QUERY
 * @returns {object}
 */
export function normalizeStats(rawData) {
  if (!rawData || !rawData.user) return null;
  const user = rawData.user;
  const repos = user.repositories?.nodes || [];

  const totalStars = repos.reduce((acc, r) => acc + (r.stargazerCount || 0), 0);
  const totalForks = repos.reduce((acc, r) => acc + (r.forkCount || 0), 0);

  const contribs = user.contributionsCollection || {};

  return {
    login: user.login,
    name: user.name || user.login,
    followers: user.followers?.totalCount || 0,
    totalRepos: user.repositories?.totalCount || 0,
    totalStars,
    totalForks,
    totalCommits: contribs.totalCommitContributions || 0,
    restrictedContributions: contribs.restrictedContributionsCount || 0,
  };
}
