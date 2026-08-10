/**
 * GraphQL queries for GitHub API
 * TODO: Sibling agent 'ghapi' is updating these GraphQL queries with full production fields.
 */

export const PROFILE_QUERY = `
  query getProfile($username: String!) {
    user(login: $username) {
      login
      name
      bio
      avatarUrl
      followers { totalCount }
      following { totalCount }
      repositories { totalCount }
      createdAt
    }
  }
`;

export const LANGUAGES_QUERY = `
  query getLanguages($username: String!) {
    user(login: $username) {
      repositories(first: 20, ownerAffiliations: OWNER, isFork: false) {
        nodes {
          languages(first: 10) {
            edges {
              size
              node { name color }
            }
          }
        }
      }
    }
  }
`;

export const REPOS_QUERY = `
  query getRepos($username: String!) {
    user(login: $username) {
      repositories(first: 6, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
        nodes {
          name
          description
          stargazerCount
          forkCount
          primaryLanguage { name color }
        }
      }
    }
  }
`;

export const STATS_QUERY = `
  query getStats($username: String!) {
    user(login: $username) {
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
        nodes {
          stargazerCount
          forkCount
        }
      }
    }
  }
`;
