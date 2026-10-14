// Rewrites the block between the recent:start / recent:end markers in README.md
// with this account's most recently pushed public repos.
import { readFileSync, writeFileSync } from 'node:fs';

const user = process.env.GH_USER || 'onder007';
const headers = { accept: 'application/vnd.github+json', 'user-agent': user };
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/users/${user}/repos?type=owner&sort=pushed&per_page=30`, { headers });
if (!res.ok) throw new Error(`GitHub API ${res.status}`);

function render(repos) {
  return repos
    .filter((r) => !r.fork && !r.archived && !r.private && r.name !== user)
    .slice(0, 5)
    .map((r) => {
      const day = r.pushed_at.slice(0, 10);
      const desc = (r.description || '').replace(/[<>|]/g, '');
      return `- \`${day}\` [${r.name}](${r.html_url})${desc ? ` · ${desc}` : ''}`;
    })
    .join('\n');
}

const list = render(await res.json());
const readme = readFileSync('README.md', 'utf8');
const next = readme.replace(
  /(<!-- recent:start -->)[\s\S]*?(<!-- recent:end -->)/,
  `$1\n${list}\n$2`,
);
if (next !== readme) writeFileSync('README.md', next);
