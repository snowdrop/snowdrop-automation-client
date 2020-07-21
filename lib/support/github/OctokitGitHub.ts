import { logger } from "@atomist/automation-client";
import { Octokit } from "@octokit/rest";
import GitHub from "./GitHub";

export default class OctokitGitHub implements GitHub {
  private owner: string;
  private octokit: Octokit;

  constructor(owner: string, token?: string) {
    this.owner = owner;
    this.octokit = this.getOctokit(token);
  }

  public async getTags(repo: string): Promise<string[]> {
    logger.debug(`Getting tags for '${this.owner}/${repo}'`);

    const params = {
      per_page: 1000,
      namespace: "tags/",
      owner: this.owner,
      repo,
    };
    try {
      const response = await this.octokit.git.listRefs(params);
      return (response.data as any[])
        .map(entry => entry.ref as string)
        .map(ref => ref.substr(ref.lastIndexOf("/") + 1));
    } catch (e) {
      throw new Error(`Could not get tags for ${repo}`);
    }
  }

  public async rebase(repo: string, originBranch: string, upstreamBranch: string): Promise<void> {
    logger.info(`Rebasing '${this.owner}/${repo}' ${originBranch} to upstream ${upstreamBranch}`);

    const upstream: Octokit.ReposGetResponseParent = await this.getUpstreamRepo(repo);
    if (!upstream) {
      throw new Error("Could not get upstream repo");
    }
    const latestUpstreamCommit: string =
      await this.getLatestCommit(upstream.owner.login, upstream.name, upstreamBranch);
    if (!latestUpstreamCommit) {
      throw new Error("Could not get the latest upstream commit");
    }
    const params = {
      owner: this.owner,
      repo,
      ref: `heads/${originBranch}`,
      sha: latestUpstreamCommit,
    };
    await this.octokit.git.updateRef(params);
  }

  public async raisePullRequest(
    repo: string, originBranch: string, upstreamBranch: string, title: string): Promise<void> {

    logger.info(`Raising pull request from '${this.owner}/${repo}' ${originBranch} to upstream ${upstreamBranch}`);

    const upstream: Octokit.ReposGetResponseParent = await this.getUpstreamRepo(repo);
    if (!upstream) {
      throw new Error("Could not get upstream repo");
    }
    const params = {
      owner: upstream.owner.login,
      repo: upstream.name,
      head: `${this.owner}:${originBranch}`,
      base: upstreamBranch,
      title,
    };
    await this.octokit.pulls.create(params);
  }

  private async getUpstreamRepo(repo: string): Promise<Octokit.ReposGetResponseParent> {
    logger.debug(`Getting upstream repo of '${this.owner}/${repo}'`);

    const response: Octokit.Response<Octokit.ReposGetResponse> =
      await this.octokit.repos.get({ owner: this.owner, repo });
    if (!response.data.fork) {
      logger.warn(`'${this.owner}/${repo}' is not a fork`);
      return null;
    }

    logger.debug(`Upstream repo is '${response.data.parent.owner.login}/${response.data.parent.name}'`);

    return response.data.parent;
  }

  private async getLatestCommit(owner: string, repo: string, branch: string): Promise<string> {
    logger.debug(`Getting the latest commit of '${owner}/${repo}/${branch}'`);
    const params = {
      ref: `heads/${branch}`,
      owner,
      repo,
    };
    const response: Octokit.AnyResponse = await this.octokit.git.getRef(params);
    const sha: string = response.data.object.sha;
    logger.debug(`The latest commit is ${sha}`);
    return sha;
  }

  private getOctokit(token?: string): Octokit {
    const options: Octokit.Options = {
      previews: ["mercy-preview"],
      auth: token ? `token ${token}` : null,
    };
    return new Octokit(options);
  }
}
