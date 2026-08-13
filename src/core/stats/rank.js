/**
 * Rank calculation algorithm for GitHub Stats Card.
 * Evaluates commits, stars, forks, repos, and followers.
 */

export function calculateRank({ totalCommits = 0, totalStars = 0, totalForks = 0, totalRepos = 0, followers = 0 }) {
  // Weights matching GitHub stats conventions
  const COMMITS_WEIGHT = 2;
  const STARS_WEIGHT = 4;
  const FORKS_WEIGHT = 3;
  const REPOS_WEIGHT = 1.5;
  const FOLLOWERS_WEIGHT = 2.5;

  const score =
    totalCommits * COMMITS_WEIGHT +
    totalStars * STARS_WEIGHT +
    totalForks * FORKS_WEIGHT +
    totalRepos * REPOS_WEIGHT +
    followers * FOLLOWERS_WEIGHT;

  const roundedScore = Math.round(score);

  if (score >= 2500) {
    return { level: 'S+', score: roundedScore, percentile: 99.5 };
  }
  if (score >= 1200) {
    return { level: 'S', score: roundedScore, percentile: 98 };
  }
  if (score >= 600) {
    return { level: 'A+', score: roundedScore, percentile: 92 };
  }
  if (score >= 300) {
    return { level: 'A', score: roundedScore, percentile: 80 };
  }
  if (score >= 100) {
    return { level: 'B+', score: roundedScore, percentile: 60 };
  }
  if (score >= 30) {
    return { level: 'B', score: roundedScore, percentile: 40 };
  }
  return { level: 'C', score: roundedScore, percentile: 20 };
}
