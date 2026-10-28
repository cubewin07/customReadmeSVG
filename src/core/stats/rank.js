/**
 * Rank calculation algorithm for GitHub Stats Card.
 * Separates self-generated activity (commits, self-PRs, issues, repos) from
 * external community & peer impact (stars, star density per repo, forks,
 * followers, code reviews). Solo personal-project volume is gated by an
 * Impact Validation Multiplier so high grades require genuine external impact.
 */

function expCdf(value, scale) {
  const v = Math.max(0, Number(value) || 0);
  return 1 - Math.exp(-v / scale);
}

function logNormalCdf(value, median) {
  const v = Math.max(0, Number(value) || 0);
  return v / (v + median);
}

export function calculateRank({
  totalCommits = 0,
  totalStars = 0,
  totalForks = 0,
  totalRepos = 0,
  followers = 0,
  pullRequests = 0,
  reviews = 0,
  issues = 0,
  totalContributions = 0,
} = {}) {
  // 1. Engineering Activity Scales (self-drivable metrics)
  const COMMITS_SCALE = 1600;
  const PRS_SCALE = 65;
  const ISSUES_SCALE = 35;

  // 2. External Impact & Peer Validation Medians (hard to self-farm on solo repos)
  const STARS_MEDIAN = 100;
  const STAR_DENSITY_MEDIAN = 4; // Stars per repo (filters out many 0-star personal repos)
  const FORKS_MEDIAN = 25;
  const FOLLOWERS_MEDIAN = 45;
  const REVIEWS_SCALE = 30;

  // Avoid double-counting PRs/issues/reviews inside totalContributions
  const nonCommitContribs = Math.max(
    0,
    totalContributions - totalCommits - pullRequests - reviews - issues
  );
  const effectiveCommits = totalCommits > 0
    ? totalCommits + nonCommitContribs * 0.25
    : totalContributions * 0.65;

  const commitsScore = 100 * expCdf(effectiveCommits, COMMITS_SCALE);
  const rawPrsScore = 100 * expCdf(pullRequests, PRS_SCALE);
  const issuesScore = 100 * expCdf(issues, ISSUES_SCALE);
  const reviewsScore = 100 * expCdf(reviews, REVIEWS_SCALE);

  const starsScore = 100 * logNormalCdf(totalStars, STARS_MEDIAN);
  const starsPerRepo = totalRepos > 0 ? totalStars / totalRepos : totalStars;
  const starDensityScore = 100 * logNormalCdf(starsPerRepo, STAR_DENSITY_MEDIAN);
  const forksScore = 100 * logNormalCdf(totalForks, FORKS_MEDIAN);
  const followersScore = 100 * logNormalCdf(followers, FOLLOWERS_MEDIAN);

  // Discount self-PRs on solo projects when reviews and external stars/forks are near zero
  const peerReviewRatio = pullRequests > 0 ? Math.min(1, (reviews * 2.5) / pullRequests) : 0;
  const externalRepoTraction = (starsScore * 0.6 + forksScore * 0.4) / 100;
  const prPeerFactor = 0.50 + 0.50 * Math.max(peerReviewRatio, externalRepoTraction);
  const prsScore = rawPrsScore * prPeerFactor;

  const hasCollabMetrics = pullRequests > 0 || reviews > 0 || issues > 0 || totalContributions > 0;

  // Dimension A: Engineering Activity (0 - 100)
  const activityScore = hasCollabMetrics
    ? commitsScore * 0.58 + prsScore * 0.28 + issuesScore * 0.14
    : commitsScore;

  // Dimension B: External Community & Peer Impact (0 - 100)
  const impactScore = hasCollabMetrics
    ? starsScore * 0.34 +
      starDensityScore * 0.14 +
      followersScore * 0.20 +
      forksScore * 0.14 +
      reviewsScore * 0.18
    : starsScore * 0.42 +
      starDensityScore * 0.18 +
      followersScore * 0.24 +
      forksScore * 0.16;

  // Impact Gate: solo personal-project activity without external impact is capped
  // Even with infinite solo commits/PRs and 0 impact, max possible total score is ~29/100
  const impactGate = 0.58 + 0.42 * Math.pow(impactScore / 100, 0.35);
  const gatedActivity = activityScore * impactGate;

  // Final score weights External Impact (50%) + Impact-Gated Activity (50%)
  const score = Math.min(100, gatedActivity * 0.50 + impactScore * 0.50);
  const roundedScore = Math.round(score * 10) / 10;

  // Earned grade thresholds
  let level;
  if (score >= 92) {
    level = 'S+';
  } else if (score >= 82) {
    level = 'S';
  } else if (score >= 72) {
    level = 'A+';
  } else if (score >= 60) {
    level = 'A';
  } else if (score >= 45) {
    level = 'B+';
  } else if (score >= 28) {
    level = 'B';
  } else {
    level = 'C';
  }

  // Refine percentile based on continuous composite score
  const percentile = Math.round(Math.min(99.9, Math.max(1, score * 0.99)) * 10) / 10;
  const scoreText = `${roundedScore}/100`;

  return { level, score: roundedScore, scoreText, percentile };
}

