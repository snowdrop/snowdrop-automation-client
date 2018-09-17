import {logger} from "@atomist/automation-client";
import {SNOWDROP_ORG} from "../../constants";
import {githubApi} from "./githubApi";

/**
 * Booster repos are repos that contain the "booster" Github topic
 *
 * @return the sha of the latest commit if everything goes well, if something went wrong
 */
export async function getShaOfLatestCommit(repo: string, branch: string,
                                           token?: string, owner = SNOWDROP_ORG): Promise<string> {
  const params = {
    owner,
    ref: `heads/${branch}`,
    repo,
  };

  try {
    const response = await githubApi(token).gitdata.getReference(params);
    return response.data.object.sha;
  } catch (e) {
    logger.info(`Branch '${branch}' does not exists`);
    return undefined;
  }
}

/**
 * Tags the latest commit in branch
 *
 * @return true if everything goes well, false otherwise
 */
export async function tagBranch(repo: string, branch: string, name: string, token?: string,
                                owner = SNOWDROP_ORG): Promise<boolean> {

  const sha = await getShaOfLatestCommit(repo, branch, token, owner);
  if (!sha) {
    return false;
  }

  const params = {
    owner,
    repo,
    ref: `refs/tags/${name}`,
    sha,
  };

  try {
    const response = await githubApi(token).gitdata.createReference(params);
    if (!response.data.ref) {
      logger.error(`Got unknown response from GitHub when trying to create tag '${name}' for '${repo}'`);
      logger.error(`Response data is:\n ${response.data}`);
      return false;
    }

    logger.info(`Successfully created tag '${name}' for booster '${repo}'`);
    return true;
  } catch (e) {
    logger.error(`Unable to create tag '${name}' for branch '${branch}' of booster '${repo}'`);
    logger.error(`Error is:\n ${e}`);
    return false;
  }
}

/**
 * Delete the specified branch
 *
 * @return true if everything goes well, false otherwise
 */
export async function deleteBranch(repo: string, branch: string, token?: string,
                                   owner = SNOWDROP_ORG): Promise<boolean> {

  const params = {
    owner,
    repo,
    ref: `heads/${branch}`,
  };

  try {
    await githubApi(token).gitdata.deleteReference(params);
    logger.info(`Successfully deleted branch '${branch}' of booster '${repo}'`);
    return true;
  } catch (e) {
    logger.error(`Unable to delete branch '${branch}' of booster '${repo}'`);
    logger.error(`Error is:\n ${e}`);
    return false;
  }
}

/**
 * Sync project with it's upstream
 *
 * @return true if everything goes well, false otherwise
 */
export async function syncWithUpstream(repo: string, token?: string,
                                       owner = SNOWDROP_ORG): Promise<boolean> {
  try {
    const upstreamInfo = await getUpstreamInfo(owner, repo, token);
    if (!upstreamInfo) {
      return false;
    }

    const latestShaOfUpstream =
        await getShaOfLatestCommit(upstreamInfo.name, "master", token, upstreamInfo.owner);

    const updateParams = {
      owner,
      repo,
      ref: "heads/master",
      sha: latestShaOfUpstream,
      force: false,
    };

    await githubApi(token).gitdata.updateReference(updateParams);
    /* tslint:disable */
    logger.info(`Successfully synced repo '${owner}/${repo}' to upstream '${upstreamInfo.owner}/${upstreamInfo.name}'`);
    /* tslint:enable */
    return true;
  } catch (e) {
    logger.error(`Unable to sync repo: '${repo}'`);
    logger.error(`Error is:\n ${e}`);
    return false;
  }
}

interface UpstreamInfo {
  owner: string;
  name: string;
}

/**
 * Get's the upstream info of a project
 *
 * @return object containing repo and name of upstream or null
 * if the repo is not a fork or if something goes wrong
 */
async function getUpstreamInfo(owner: string, repo: string, token?: string): Promise<UpstreamInfo> {

  try {
    const response = await githubApi(token).repos.get({owner, repo});
    if (!response.data.fork) {
      logger.info(`Repo '${owner}/${repo}' is not a fork`);
      return null;
    }

    const upstreamData = response.data.parent as any;
    return {owner: upstreamData.owner.login, name: upstreamData.name};
  } catch (e) {
    logger.error(`Unable to get upstream info of repo: '${repo}'`);
    logger.error(`Error is:\n ${e}`);
    return null;
  }
}

/**
 * Sync project with it's upstream
 *
 * @return true if everything goes well, false otherwise
 */
export async function raisePullRequestToUpstream(
                          repo: string, sourceBranch: string, targetBranch: string,
                          title: string, token?: string, owner = SNOWDROP_ORG): Promise<boolean> {
  try {
    const upstreamInfo = await getUpstreamInfo(owner, repo, token);
    if (!upstreamInfo) {
      return false;
    }

    const createParams = {
      owner: upstreamInfo.owner,
      repo: upstreamInfo.name,
      head: `${owner}:${sourceBranch}`,
      base: targetBranch,
      title,
    };

    await githubApi(token).pullRequests.create(createParams);
    /* tslint:disable */
    logger.info(`Successfully created pull request to '${upstreamInfo.owner}/${upstreamInfo.name}:${targetBranch}' from '${owner}/${repo}:${sourceBranch}'`);
    /* tslint:enable */
    return true;
  } catch (e) {
    logger.error(`Unable to raise pull request to upstream for repo: '${owner}/${repo}:${sourceBranch}'`);
    logger.error(`Error is:\n ${e}`);
    return false;
  }
}
