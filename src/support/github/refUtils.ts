import {logger} from "@atomist/automation-client/internal/util/logger";
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

  const repoParams = {
    owner,
    repo
  };

  try {
    const response = await githubApi(token).repos.get(repoParams);
    if (!response.data.fork) {
      logger.info(`Repo '${owner}/${repo}' is not a fork`);
      return false;
    }

    const upstreamData = response.data.parent as any;
    const latestShaOfUpstream =
        await getShaOfLatestCommit(upstreamData.name, "master", token, upstreamData.owner.login);

    const updateParams = {
      owner,
      repo,
      ref: "heads/master",
      sha: latestShaOfUpstream,
      force: true
    };

    await githubApi(token).gitdata.updateReference(updateParams);
    logger.info(`Successfully synced repo '${owner}/${repo}' to upstream '${upstreamData.owner.login}/${upstreamData.name}'`);
    return true;
  } catch (e) {
    logger.error(`Unable to sync repo: '${repo}'`);
    logger.error(`Error is:\n ${e}`);
    return false;
  }
} 
