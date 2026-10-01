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
      repositories(ownerAffiliations: [OWNER], privacy: PUBLIC, first: 100) {
        totalCount
        nodes {
          stargazerCount
        }
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
          languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
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
 * Fetches top public, non-fork repositories owned by the user with topics, releases,
 * watchers, languages, and commit history for rich variant displays.
 */
export const REPOS_QUERY = `
  query GetUserTopRepos($login: String!, $first: Int = 10) {
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
          pushedAt
          updatedAt
          primaryLanguage {
            name
            color
          }
          repositoryTopics(first: 3) {
            nodes {
              topic {
                name
              }
            }
          }
          licenseInfo {
            spdxId
          }
          latestRelease {
            tagName
          }
          watchers {
            totalCount
          }
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 8) {
                  nodes {
                    message
                    committedDate
                    abbreviatedOid
                  }
                }
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
      pullRequests(states: [OPEN, CLOSED, MERGED]) {
        totalCount
      }
      issues(states: [OPEN, CLOSED]) {
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
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
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
 * DEVELOPER_QUERY
 * Comprehensive query for the animated Developer Showcase card.
 * Fetches user profile, pinned items, top repositories with sparklines,
 * latest commit message, and full contribution calendar for runner and voxel city acts.
 */
export const DEVELOPER_QUERY = `
  query GetDeveloperData($login: String!) {
    user(login: $login) {
      name
      login
      createdAt
      bio
      location
      company
      status {
        emoji
        message
      }
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
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            name
            description
            stargazerCount
            primaryLanguage {
              name
              color
            }
            languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 8) {
                    nodes {
                      message
                      committedDate
                      abbreviatedOid
                    }
                  }
                }
              }
            }
          }
        }
      }
      topRepos: repositories(
        ownerAffiliations: [OWNER]
        privacy: PUBLIC
        isFork: false
        orderBy: { field: STARGAZERS, direction: DESC }
        first: 6
      ) {
        nodes {
          name
          description
          stargazerCount
          primaryLanguage {
            name
            color
          }
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 8) {
                  nodes {
                    message
                    committedDate
                    abbreviatedOid
                  }
                }
              }
            }
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
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

