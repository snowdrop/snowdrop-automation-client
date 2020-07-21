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
    const response = await githubApi(token).git.getRef(params);
    return response.data.object.sha;
  } catch (e) {
    logger.error(`Failed to get the last commit. ${e}`);
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
    logger.error("Unable to find sha of latest commit");
    return false;
  }

  const params = {
    owner,
    repo,
    ref: `refs/tags/${name}`,
    sha,
  };

  try {
    const response = await githubApi(token).git.createRef(params);
    if (!response.data.ref) {
      logger.error(`Got unknown response from GitHub when trying to create tag '${name}' for '${repo}'`);
      logger.error(`Response data is:\n ${response.data}`);
      return false;
    }

    logger.info(`Successfully created tag '${name}' for '${repo}'`);
    return true;
  } catch (e) {
    logger.error(`Unable to create tag '${name}' for branch '${branch}' of '${repo}'`);
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
    await githubApi(token).git.deleteRef(params);
    logger.info(`Successfully deleted branch '${branch}' of '${repo}'`);
    return true;
  } catch (e) {
    logger.error(`Unable to delete branch '${branch}' of '${repo}'`);
    logger.error(`Error is:\n ${e}`);
    return false;
  }
}
