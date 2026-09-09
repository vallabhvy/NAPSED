import type { GithubRepo } from '../types';

/**
 * Fetches public user profile data from GitHub REST API
 */
export async function fetchGithubUserProfile(username: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    return {
      name: data.name || data.login,
      username: data.login,
      avatarUrl: data.avatar_url,
      bio: data.bio || '',
      company: data.company || '',
      location: data.location || '',
      publicReposCount: data.public_repos || 0,
      followersCount: data.followers || 0,
      githubUrl: data.html_url,
      websiteUrl: data.blog || '',
      email: data.email || ''
    };
  } catch (error) {
    console.warn(`Could not fetch GitHub profile for ${username}:`, error);
    return null;
  }
}

/**
 * Fetches user's top public repositories from GitHub REST API
 */
export async function fetchGithubUserRepos(username: string): Promise<GithubRepo[]> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=10`
    );
    if (!res.ok) throw new Error(`GitHub Repos API error: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      starsCount: repo.stargazers_count || 0,
      forksCount: repo.forks_count || 0,
      language: repo.language,
      updatedAt: new Date(repo.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      topics: repo.topics || []
    }));
  } catch (error) {
    console.warn(`Could not fetch GitHub repos for ${username}:`, error);
    return [];
  }
}
