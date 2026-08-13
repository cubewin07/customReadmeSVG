/**
 * Rank calculation algorithm for GitHub Stats Card.
 * Evaluates commits, stars, forks, repos, and followers.
 */

export function calculateRank({ totalCommits = 0, totalStars = 0, totalForks = 0, totalRepos = 0, followers = 0 }) {
  const COMMITS_SCALE = 1000;
  const STARS_SCALE = 100;
  const FORKS_SCALE = 35;
  const FOLLOWERS_SCALE = 50;
  const REPOS_SCALE = 30;

  // Non-linear exponential CDF score per metric (0 to 100)
  const commitsScore = 100 * (1 - Math.exp(-totalCommits / COMMITS_SCALE));
  const starsScore = 100 * (1 - Math.exp(-totalStars / STARS_SCALE));
  const forksScore = 100 * (1 - Math.exp(-totalForks / FORKS_SCALE));
  const followersScore = 100 * (1 - Math.exp(-followers / FOLLOWERS_SCALE));
  const reposScore = 100 * (1 - Math.exp(-totalRepos / REPOS_SCALE));

  // Weighted composite score out of 100
  const score = Math.min(
    100,
    starsScore * 0.35 +
    commitsScore * 0.25 +
    forksScore * 0.15 +
    followersScore * 0.15 +
    reposScore * 0.10
  );

  const roundedScore = Math.round(score * 10) / 10;

  let level;

  if (score >= 97) {
    level = 'S+';
  } else if (score >= 85) {
    level = 'S';
  } else if (score >= 65) {
    level = 'A+';
  } else if (score >= 48) {
    level = 'A';
  } else if (score >= 32) {
    level = 'B+';
  } else if (score >= 16) {
    level = 'B';
  } else {
    level = 'C';
  }

  // Refine percentile based on continuous composite score
  const percentile = Math.round(Math.min(99.9, Math.max(1, score * 0.99)) * 10) / 10;

  return { level, score: roundedScore, percentile };
}

