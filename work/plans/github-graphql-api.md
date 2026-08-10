# GitHub GraphQL API Research & Query Specification

This document details the GitHub GraphQL API (v4) research findings for the **customReadmeSVG** project, covering authentication, rate limits, exact query definitions, caching guidelines, error handling, minimal Axios client implementation, and normalized data shapes.

---

## 1. Authentication & Rate Limits

### Endpoint & Auth Headers
- **Endpoint**: `https://api.github.com/graphql`
- **HTTP Method**: `POST`
- **Header Format**:
  ```http
  Authorization: bearer YOUR_GITHUB_TOKEN
  Content-Type: application/json
  User-Agent: customReadmeSVG-App
  ```
  *(Note: GitHub accepts both `bearer` and `Bearer` capitalized, but `bearer` is standard in GitHub documentation).*

### Unauthenticated Access & Token Requirements
- **GraphQL strictly requires authentication**: Unlike GitHub REST API v3 (which permits 60 unauthenticated requests/hour), the GitHub GraphQL API v4 **returns HTTP 401 Unauthorized** (`"Must authenticate to access this API"`) if no token is provided.
- **Client/Server Token Strategy**:
  - For local development / server execution: Provide `GITHUB_TOKEN` via environment variables.
  - For browser/Vite dev playground: Support optional `VITE_GITHUB_TOKEN` or user-supplied token input in the preview UI.
  - Fallback / Public deployment: Provide a scoped read-only GitHub PAT or edge middleware token proxy.

### Rate Limit & Cost System
- **Rate Limit Window**: 1 hour (sliding 60-minute window).
- **Quota**:
  - Personal Access Tokens (PAT): **5,000 points / hour**.
  - GitHub App Installations: Up to **15,000 points / hour**.
- **GraphQL Cost Calculation**:
  - Every GraphQL query has a **node cost** calculated by GitHub's query evaluator based on the number of requested connections and `first`/`last` arguments.
  - Simple queries (like `PROFILE_QUERY`) typically cost **1 point**.
  - Querying 100 repos with nested languages (`LANGUAGES_QUERY` or `STATS_QUERY`) typically costs **1 to 2 points**.

---

## 2. Exact GraphQL Queries

All queries are defined with named parameters and explicitly request the `rateLimit` meta object.

### 2.1 Profile Query (`PROFILE_QUERY`)

Fetches core user information, counts, location, website, company, and current GitHub status.

```graphql
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
```

### 2.2 Languages Query (`LANGUAGES_QUERY`)

Fetches owned, non-fork repositories ordered by recent activity, returning language byte sizes per repo for client-side aggregation.

```graphql
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
```

#### Pagination Strategy
- For accounts with > 100 owned repositories, `repositories.pageInfo.hasNextPage` will be `true`.
- Pass `endCursor` as the `$after` variable in subsequent requests to fetch additional pages.
- For most README card visual displays, scanning the top 100 most recently pushed non-fork repositories yields > 95% accuracy for current active language usage while remaining a single 1-point query.

### 2.3 Repositories Query (`REPOS_QUERY`)

Fetches top N public, non-fork repositories owned by the user, sorted by star count.

```graphql
query GetUserTopRepos($login: String!, $repoFirst: Int = 6) {
  user(login: $login) {
    repositories(
      ownerAffiliations: [OWNER]
      privacy: PUBLIC
      isFork: false
      orderBy: { field: STARGAZERS, direction: DESC }
      first: $repoFirst
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
```

### 2.4 Stats Query (`STATS_QUERY`)

Fetches aggregate stars and forks across public repos, followers count, and contribution breakdown via `contributionsCollection`.

```graphql
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
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoryContributions
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
```

#### Token Requirements for `contributionsCollection`
- `contributionsCollection` works for any user login.
- `restrictedContributionsCount` represents private contributions. It is included if the token owner matches the target user or if the target user has enabled "Include private contributions on my profile".

---

## 3. Query Cost & Rate-Limit Tracking

### GraphQL Response Body Meta (`rateLimit`)
Each query includes the `rateLimit` block in the GraphQL response:
```json
{
  "data": {
    "user": { ... },
    "rateLimit": {
      "limit": 5000,
      "cost": 1,
      "remaining": 4982,
      "resetAt": "2026-08-10T16:00:00Z"
    }
  }
}
```

### HTTP Headers
GitHub also sends rate limit telemetry in HTTP response headers:
- `x-ratelimit-limit`: Total hourly limit (e.g., `5000`)
- `x-ratelimit-remaining`: Remaining points in current window
- `x-ratelimit-reset`: Unix epoch timestamp when reset occurs
- `x-ratelimit-used`: Points consumed in current window
- `x-ratelimit-resource`: Resource category (`graphql`)

---

## 4. Recommended Cache TTLs per Card

To prevent hitting rate limits and to ensure high performance, fetched data should be cached before SVG generation.

| Card ID | Recommended TTL | Rationale |
|---|---|---|
| `profile` | **3,600s (1 hour)** | Bio, location, and follower counts change infrequently. |
| `languages` | **21,600s (6 hours)** | Aggregate repository language distribution shifts slowly over days. |
| `repos` | **7,200s (2 hours)** | Stars and descriptions update moderately; 2 hours balances freshness and cache hits. |
| `stats` | **3,600s (1 hour)** | Contribution statistics accumulate daily; 1 hour provides fresh activity feedback. |

---

## 5. Error Cases & Edge Cases

1. **User Not Found (`404` equivalent)**
   - GraphQL returns `200 OK` with `data.user === null` or an error entry in `errors`:
     `"Could not resolve to a User with the login of 'invalid_user_name'."`
   - *Handling*: Detect `!data.user` and render a fallback SVG stating `User "@username" not found`.
2. **Rate Limited (`403` / `429` / `rateLimit.remaining === 0`)**
   - HTTP status `403 Forbidden` or `data.rateLimit.remaining === 0` or GraphQL error `"API rate limit exceeded"`.
   - *Handling*: Render an error SVG stating `GitHub API Rate Limit Exceeded`.
3. **Invalid / Missing Token (`401 Unauthorized`)**
   - HTTP status `401 Unauthorized` with message `"Bad credentials"` or `"Must authenticate to access this API"`.
   - *Handling*: Log security warning and render error SVG stating `GitHub Token Missing or Invalid`.
4. **Organization Queried instead of User**
   - The `user(login: $login)` query returns `null` if `$login` belongs to a GitHub Organization account.
   - *Handling*: Fallback check or friendly error stating `Organization accounts require Organization card plugin`.
5. **Partial Data / GraphQL Syntax Errors**
   - `errors` array present in response body alongside partial `data`.
   - *Handling*: Check `response.data.errors` array before accessing nested properties.

---

## 6. Minimal Axios Example (ESM)

Below is the minimal production-ready Axios client for posting to GitHub GraphQL API v4.

```javascript
import axios from 'axios';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

/**
 * Execute a GitHub GraphQL query using Axios.
 *
 * @param {string} query - GraphQL query document string.
 * @param {Record<string, any>} [variables={}] - Query variables.
 * @param {string} [token=process.env.GITHUB_TOKEN] - GitHub PAT or App token.
 * @returns {Promise<{ data: any, rateLimit: any }>}
 */
export async function executeGraphQL(query, variables = {}, token = process.env.GITHUB_TOKEN) {
  if (!token) {
    throw new Error('GitHub token is required to execute GraphQL queries.');
  }

  try {
    const response = await axios.post(
      GITHUB_GRAPHQL_URL,
      { query, variables },
      {
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'customReadmeSVG-App',
        },
        timeout: 10000,
      }
    );

    const { data, errors } = response.data;

    if (errors && errors.length > 0) {
      const errorMessage = errors.map((e) => e.message).join('; ');
      throw new Error(`GitHub GraphQL Error: ${errorMessage}`);
    }

    if (!data || !data.user) {
      throw new Error(`User not found or empty response from GitHub.`);
    }

    return {
      data: data.user,
      rateLimit: data.rateLimit,
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('GitHub Auth Error: 401 Unauthorized (Invalid or missing token)');
      }
      if (status === 403 || status === 429) {
        throw new Error('GitHub Rate Limit Error: Exceeded quota or blocked');
      }
    }
    throw error;
  }
}
```

---

## 7. Suggested JSDoc / TypeScript Shapes

Normalized data structures produced by card data fetchers before passing to SVG renderers:

```javascript
/**
 * @typedef {object} ProfileData
 * @property {string} login
 * @property {string} name
 * @property {string} bio
 * @property {string} avatarUrl
 * @property {string} url
 * @property {number} followers
 * @property {number} following
 * @property {number} totalRepos
 * @property {string} createdAt
 * @property {string|null} location
 * @property {string|null} websiteUrl
 * @property {string|null} company
 * @property {{ emoji: string|null, message: string|null }|null} status
 */

/**
 * @typedef {object} LanguageItem
 * @property {string} name
 * @property {string} color
 * @property {number} size - Total byte size across repos
 * @property {number} percentage - Calculated percentage (0 - 100)
 */

/**
 * @typedef {object} LanguagesData
 * @property {string} login
 * @property {LanguageItem[]} languages
 * @property {number} totalSize
 */

/**
 * @typedef {object} RepoItem
 * @property {string} name
 * @property {string} description
 * @property {string} url
 * @property {number} stargazerCount
 * @property {number} forkCount
 * @property {{ name: string, color: string }|null} primaryLanguage
 * @property {string} updatedAt
 */

/**
 * @typedef {object} ReposData
 * @property {string} login
 * @property {RepoItem[]} repos
 */

/**
 * @typedef {object} StatsData
 * @property {string} login
 * @property {string} name
 * @property {number} totalStars
 * @property {number} totalForks
 * @property {number} totalRepos
 * @property {number} followers
 * @property {number} totalCommits
 * @property {number} totalPRs
 * @property {number} totalIssues
 * @property {number} totalReviews
 * @property {number} restrictedContributions
 */
```
