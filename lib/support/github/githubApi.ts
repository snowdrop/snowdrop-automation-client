import * as GitHubApi from "@octokit/rest";

export function githubApi(token?: string): GitHubApi {
  const github = new GitHubApi();

  if (token) {
    github.authenticate({
      type: "token",
      token,
    });
  }

  return github;
}
