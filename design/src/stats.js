// Pulls live numbers from the GitHub GraphQL API. Falls back to the last saved values if offline.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function gql(query, variables, tok) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${tok}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-design' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export async function fetchStats(login, cacheFile) {
  const tok = token();
  try {
    if (!tok) throw new Error('no token');
    const u = await gql(
      `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions
        weeks{contributionDays{contributionCount}}}}}}`,
      { login },
      tok,
    );
    const cal = u.user.contributionsCollection.contributionCalendar;
    const days = cal.weeks.flatMap((w) => w.contributionDays);

    let merged = 0;
    let files = 0;
    let after = null;
    do {
      const s = await gql(
        `query($q:String!,$after:String){search(query:$q,type:ISSUE,first:100,after:$after){issueCount
          pageInfo{hasNextPage endCursor} nodes{... on PullRequest{changedFiles}}}}`,
        { q: `author:${login} type:pr is:merged`, after },
        tok,
      );
      merged = s.search.issueCount;
      files += s.search.nodes.reduce((a, n) => a + (n.changedFiles || 0), 0);
      after = s.search.pageInfo.hasNextPage ? s.search.pageInfo.endCursor : null;
    } while (after);

    const stats = {
      mergedPRs: merged,
      contributions: cal.totalContributions,
      filesChanged: files,
      activeDays: days.filter((d) => d.contributionCount > 0).length,
    };
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(stats, null, 2) + '\n');
    return stats;
  } catch (e) {
    console.warn(`stats: using cached values (${e.message})`);
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
}
