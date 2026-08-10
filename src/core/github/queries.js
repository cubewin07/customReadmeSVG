/**
 * GitHub GraphQL API Queries
 * Production queries for profile, languages, repos, and stats card plugins.
 */

/**
 * PROFILE_QUERY
 * Fetches user profile metadata, follower/following counts, repository total count, location, bio, website, company, and status.
 */
export const PROFILE_QUERY = `
  query GetUserProfile($login: String!) {
    user(login: $login) {
      login
      name
      bio
      avatarUrl
      url
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(ownerAffiliations: [OWNER]) {
        totalCount
      }
      createdAt
      location
      websiteUrl
      company
      status {
        emoji
        message
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;

/**
 * LANGUAGES_QUERY
 * Fetches owned non-fork repositories (first 100) and top 10 language byte sizes per repository.
 * Includes pageInfo for future pagination support.
 */
export const LANGUAGES_QUERY = `
  query GetUserLanguages($login: String!, $firstRepos: Int = 100, $after: String) {
    user(login: $login) {
      repositories(
        ownerAffiliations: [OWNER]
        isFork: false
        orderBy: { field: PUSHED_AT, direction: DESC }
        first: $firstRepos
        after: $after
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;

/**
 * REPOS_QUERY
 * Fetches top 6 public, non-fork repositories owned by the user, ordered by stargazers count descending.
 */
export const REPOS_QUERY = `
  query GetUserTopRepos($login: String!, $first: Int = 6) {
    user(login: $login) {
      repositories(
        ownerAffiliations: [OWNER]
        privacy: PUBLIC
        isFork: false
        orderBy: { field: STARGAZERS, direction: DESC }
        first: $first
      ) {
        nodes {
          name
          description
          url
          stargazerCount
          forkCount
          primaryLanguage {
            name
            color
          }
          updatedAt
        }
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;

/**
 * STATS_QUERY
 * Fetches followers count, public repository count + stargazer/fork counts (first 100 nodes),
 * and contribution breakdown via contributionsCollection.
 */
export const STATS_QUERY = `
  query GetUserStats($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      name
      login
      followers {
        totalCount
      }
      repositories(ownerAffiliations: [OWNER], privacy: PUBLIC, first: 100) {
        totalCount
        nodes {
          stargazerCount
          forkCount
        }
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        restrictedContributionsCount
      }
    }
    rateLimit {
      limit
      cost
      remaining
      resetAt
    }
  }
`;
