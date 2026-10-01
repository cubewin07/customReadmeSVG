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
  const repos = user.repositories?.nodes || [];
  const totalStars = repos.reduce((acc, r) => acc + (r.stargazerCount || 0), 0);

  return {
    login: user.login || '',
    name: user.name || user.login || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    url: user.url || `https://github.com/${user.login}`,
    followers: user.followers?.totalCount || 0,
    following: user.following?.totalCount || 0,
    repositories: user.repositories?.totalCount || 0,
    totalStars,
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
    totalLanguages: languages.length,
  };
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Computes an 8-bucket weekly commit sparkline from commit history nodes.
 * @param {Array} historyNodes
 * @param {number} [now=Date.now()]
 * @returns {number[]} 8-element array of counts
 */
function computeWeeklyCommitBins(historyNodes = [], now = Date.now()) {
  const weeklyCounts = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const node of historyNodes) {
    if (node && node.committedDate) {
      const time = new Date(node.committedDate).getTime();
      const diffMs = now - time;
      if (diffMs >= 0) {
        const weekIdx = Math.floor(diffMs / WEEK_MS);
        if (weekIdx >= 0 && weekIdx < 8) {
          weeklyCounts[7 - weekIdx]++;
        }
      }
    }
  }
  return weeklyCounts;
}

/**
 * Normalizes top repositories list with rich metadata for card variants.
 * @param {object} rawData - Data payload returned by REPOS_QUERY
 * @param {object} [options={}]
 * @returns {object}
 */
export function normalizeRepos(rawData, options = {}) {
  if (!rawData || !rawData.user) return { repos: [] };
  const repos = rawData.user.repositories?.nodes || [];
  const now = options.now || Date.now();

  return {
    repos: repos.map(r => {
      const topics = (r.repositoryTopics?.nodes || [])
        .map(t => t?.topic?.name)
        .filter(Boolean);

      const rawLangs = r.languages?.edges || [];
      let totalLangSize = 0;
      const languages = rawLangs.map(edge => {
        const size = edge.size || 0;
        totalLangSize += size;
        return {
          name: edge.node?.name || 'Code',
          color: edge.node?.color || '#858585',
          size,
        };
      });

      const normalizedLangs = languages.map(l => ({
        ...l,
        percentage: totalLangSize > 0 ? parseFloat(((l.size / totalLangSize) * 100).toFixed(1)) : 0,
      }));

      if (!normalizedLangs.length && r.primaryLanguage) {
        normalizedLangs.push({
          name: r.primaryLanguage.name,
          color: r.primaryLanguage.color || '#858585',
          size: 1,
          percentage: 100,
        });
      }

      const historyNodes = r.defaultBranchRef?.target?.history?.nodes || [];
      const firstCommit = historyNodes[0] || null;
      const lastCommit = firstCommit ? {
        message: firstCommit.message ? firstCommit.message.split('\n')[0].trim() : '',
        sha: firstCommit.abbreviatedOid || '',
        date: firstCommit.committedDate || null,
      } : (r.lastCommit || null);

      const sparkline = r.sparkline && Array.isArray(r.sparkline)
        ? r.sparkline
        : computeWeeklyCommitBins(historyNodes, now);

      return {
        name: r.name,
        description: r.description || '',
        url: r.url,
        stargazerCount: r.stargazerCount || 0,
        forkCount: r.forkCount || 0,
        watchers: r.watchers?.totalCount !== undefined ? r.watchers.totalCount : (r.watchers || 0),
        primaryLanguage: r.primaryLanguage ? { name: r.primaryLanguage.name, color: r.primaryLanguage.color } : null,
        topics: topics.length ? topics : (r.topics || []),
        latestRelease: r.latestRelease?.tagName || (typeof r.latestRelease === 'string' ? r.latestRelease : null),
        pushedAt: r.pushedAt || r.updatedAt || null,
        updatedAt: r.updatedAt,
        languages: normalizedLangs,
        lastCommit,
        sparkline,
      };
    }),
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
  const totalCommits = contribs.totalCommitContributions || 0;
  const pullRequests = user.pullRequests?.totalCount || contribs.totalPullRequestContributions || 0;
  const issues = user.issues?.totalCount || contribs.totalIssueContributions || 0;
  const reviews = contribs.totalPullRequestReviewContributions || 0;
  const totalContributions = contribs.contributionCalendar?.totalContributions || (totalCommits + pullRequests + issues + reviews);

  const calendarWeeks = contribs.contributionCalendar?.weeks || [];
  const allDays = [];
  for (const w of calendarWeeks) {
    for (const d of (w.contributionDays || [])) {
      allDays.push(d);
    }
  }

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  for (const d of allDays) {
    if (d.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  if (allDays.length > 0) {
    let idx = allDays.length - 1;
    if (allDays[idx].contributionCount === 0 && idx > 0 && allDays[idx - 1].contributionCount > 0) {
      idx--;
    }
    while (idx >= 0 && allDays[idx].contributionCount > 0) {
      currentStreak++;
      idx--;
    }
  }

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyContributions = new Array(12).fill(0);
  const monthLabels = new Array(12).fill('');

  for (let m = 0; m < 12; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - m), 1);
    monthLabels[m] = MONTH_NAMES[d.getMonth()];
  }

  for (const d of allDays) {
    if (d.date && d.contributionCount > 0) {
      const dayDate = new Date(d.date);
      const diffMonths = (now.getFullYear() - dayDate.getFullYear()) * 12 + (now.getMonth() - dayDate.getMonth());
      if (diffMonths >= 0 && diffMonths < 12) {
        monthlyContributions[11 - diffMonths] += d.contributionCount;
      }
    }
  }

  let peakMonthIdx = 0;
  let peakMonthVal = 0;
  for (let i = 0; i < 12; i++) {
    if (monthlyContributions[i] > peakMonthVal) {
      peakMonthVal = monthlyContributions[i];
      peakMonthIdx = i;
    }
  }

  const bestMonth = {
    name: monthLabels[peakMonthIdx] || 'Peak',
    count: peakMonthVal,
  };

  const actionTotal = totalCommits + pullRequests + issues + reviews;
  const effortShares = {
    commitsPct: actionTotal > 0 ? parseFloat(((totalCommits / actionTotal) * 100).toFixed(1)) : 0,
    prsPct: actionTotal > 0 ? parseFloat(((pullRequests / actionTotal) * 100).toFixed(1)) : 0,
    reviewsPct: actionTotal > 0 ? parseFloat(((reviews / actionTotal) * 100).toFixed(1)) : 0,
    issuesPct: actionTotal > 0 ? parseFloat(((issues / actionTotal) * 100).toFixed(1)) : 0,
  };

  return {
    login: user.login,
    name: user.name || user.login,
    followers: user.followers?.totalCount || 0,
    totalRepos: user.repositories?.totalCount || 0,
    totalStars,
    totalForks,
    totalCommits,
    pullRequests,
    issues,
    reviews,
    totalContributions: totalContributions > 0 ? totalContributions : totalCommits,
    currentStreak,
    maxStreak,
    memberYear: user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear(),
    restrictedContributions: contribs.restrictedContributionsCount || 0,
    weeks: calendarWeeks,
    monthlyContributions,
    monthLabels,
    bestMonth,
    effortShares,
  };
}

/**
 * Normalizes developer card payload from DEVELOPER_QUERY.
 * Extracts profile, pinned/top repos with sparklines, latest commit,
 * streak, and daily contribution counts.
 * @param {object} rawData - GraphQL response payload
 * @returns {object|null}
 */
export function normalizeDeveloperData(rawData, options = {}) {
  if (!rawData || !rawData.user) return null;
  const user = rawData.user;

  const repos = user.repositories?.nodes || [];
  const totalStars = repos.reduce((acc, r) => acc + (r.stargazerCount || 0), 0);
  const totalRepos = user.repositories?.totalCount || repos.length || 0;
  const followers = user.followers?.totalCount || 0;

  // 1. Pinned or Top Repositories (up to 3)
  const pinnedNodes = (user.pinnedItems?.nodes || []).filter(Boolean);
  const topNodes = (user.topRepos?.nodes || []).filter(Boolean);
  const rawRepos = (pinnedNodes.length > 0 ? pinnedNodes : topNodes).slice(0, 3);

  const now = options.now || Date.now();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const normalizedRepos = rawRepos.map(r => {
    // Generate an 8-point sparkline by bucketing real commit dates into weekly bins
    const historyNodes = r.defaultBranchRef?.target?.history?.nodes || [];
    const weeklyCounts = [0, 0, 0, 0, 0, 0, 0, 0];

    for (const node of historyNodes) {
      if (node.committedDate) {
        const time = new Date(node.committedDate).getTime();
        const diffMs = now - time;
        if (diffMs >= 0) {
          const weekIdx = Math.floor(diffMs / WEEK_MS);
          if (weekIdx >= 0 && weekIdx < 8) {
            weeklyCounts[7 - weekIdx]++;
          }
        }
      }
    }

    const maxCount = Math.max(...weeklyCounts);
    let sparkline;
    if (maxCount === 0) {
      sparkline = [1, 1, 1, 1, 1, 1, 1, 1];
    } else {
      sparkline = weeklyCounts.map(count => {
        if (count === 0) return 1;
        return Math.max(1, Math.min(9, Math.round(1 + (count / maxCount) * 8)));
      });
    }

    return {
      name: r.name,
      language: r.primaryLanguage?.name || 'Code',
      color: r.primaryLanguage?.color || '#58a6ff',
      stars: r.stargazerCount || 0,
      description: r.description ? (r.description.length > 42 ? r.description.slice(0, 39) + '...' : r.description) : 'Interactive project',
      sparkline,
    };
  });

  // 2. Latest Commit Message & Real Commit SHA
  let latestCommit = '';
  let commitSha = '';
  for (const r of [...rawRepos, ...topNodes]) {
    const history = r.defaultBranchRef?.target?.history?.nodes || [];
    if (history.length > 0) {
      if (history[0].abbreviatedOid) {
        commitSha = history[0].abbreviatedOid;
      }
      if (history[0].message) {
        latestCommit = history[0].message.split('\n')[0].trim();
        if (latestCommit.length > 36) {
          latestCommit = latestCommit.slice(0, 33) + '...';
        }
      }
      break;
    }
  }

  // 3. Live Tech Arsenal aggregation from repositories & language nodes
  const langCountMap = new Map();
  for (const r of [...repos, ...pinnedNodes, ...topNodes]) {
    if (r.primaryLanguage?.name) {
      langCountMap.set(r.primaryLanguage.name, (langCountMap.get(r.primaryLanguage.name) || 0) + 10);
    }
    const edges = r.languages?.edges || [];
    for (const { node, size } of edges) {
      if (node?.name) {
        langCountMap.set(node.name, (langCountMap.get(node.name) || 0) + (size || 1));
      }
    }
  }
  const extractedTech = Array.from(langCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tname]) => tname)
    .slice(0, 6);

  const tech = extractedTech.length > 0
    ? extractedTech
    : ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js'];

  // 4. Contribution Calendar -> 60 days of counts and Streak
  const contribs = user.contributionsCollection || {};
  const annualCommits = contribs.totalCommitContributions || contribs.contributionCalendar?.totalContributions || 0;
  const weeks = contribs.contributionCalendar?.weeks || [];
  const allDays = [];
  for (const w of weeks) {
    for (const d of (w.contributionDays || [])) {
      allDays.push({
        date: d.date,
        count: d.contributionCount || 0,
      });
    }
  }

  // Calculate current streak
  let streak = 0;
  if (allDays.length > 0) {
    let i = allDays.length - 1;
    // If today has 0, check if yesterday had commits
    if (allDays[i].count === 0 && i > 0 && allDays[i - 1].count > 0) {
      i--;
    }
    while (i >= 0 && allDays[i].count > 0) {
      streak++;
      i--;
    }
  }

  // Extract last 60 days of counts
  let counts = allDays.slice(-60).map(d => d.count);
  if (counts.length < 60) {
    while (counts.length < 60) {
      counts.unshift(0);
    }
  }

  const createdAtYear = user.createdAt ? new Date(user.createdAt).getFullYear() : 2024;

  return {
    name: user.name || user.login,
    login: user.login,
    handle: `@${user.login}`,
    createdAt: user.createdAt || null,
    joinedYear: createdAtYear,
    role: user.bio ? user.bio.split('.')[0] : 'Full-Stack Engineer & Creative Coder',
    status: user.status?.message ? user.status.message.replace(/^:[a-z0-9_+-]+:\s*/, '') : `MEMBER SINCE ${createdAtYear}`,
    focus: [
      user.bio || 'Crafting interactive web apps & reactive UI systems',
      'with dynamic, game-inspired SVG animation engines.',
    ],
    tech,
    stats: [
      { label: 'REPOSITORIES', value: totalRepos },
      { label: 'TOTAL STARS', value: totalStars },
      { label: 'FOLLOWERS', value: followers },
    ],
    commit: latestCommit || 'No recent public commits',
    commitSha,
    annualCommits,
    streak,
    repos: normalizedRepos.length > 0 ? normalizedRepos : undefined,
    counts,
  };
}

