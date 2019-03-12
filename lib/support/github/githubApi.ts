import * as Octokit from "@octokit/rest";

export function githubApi(token?: string): Octokit {
  const options = {
    previews: ['mercy-preview']
  } as Octokit.Options;

  if (token) {
    options.auth = `token ${token}`;
  }

  return new Octokit(options);
}
