import {logger} from "@atomist/automation-client/internal/util/logger";
import {SNOWDROP_ORG} from "../../constants";
import {githubApi} from "./githubApi";

/**
 * Booster repos are repos that contain the "booster" Github topic
 *
 * @return the sha of the latest commit if everything goes well, if something went wrong
 */
export function getShaOfLatestCommit(repo: string, branch: string,
                                     token?: string, owner = SNOWDROP_ORG): Promise<string> {
  const params = {
    owner,
    ref: `heads/${branch}`,
    repo,
  };

  return githubApi(token).gitdata.getReference(params)
          .then(r => r.data.object.sha).catch(() => {
            logger.info(`Branch '${branch}' does not exists`);
            return undefined;
          });
}

/**
 * Tags the latest commit in branch
 *
 * @return true if everything goes well, false otherwise
 */
export function tagBranch(repo: string, branch: string, name: string, token?: string,
                          owner = SNOWDROP_ORG): Promise<boolean> {

  return getShaOfLatestCommit(repo, branch, token, owner)
    .then(sha => {
       if (!sha) {
         return undefined;
       }

       return githubApi(token).gitdata.createReference({
        owner,
        repo,
        ref: `refs/tags/${name}`,
        sha,
      }).then(res => {
         if (!res.data.ref) {
           logger.error(`Got unknown response from GitHub when trying to create tag '${name}' for '${repo}'`);
           logger.error(`Response data is:\n ${res.data}`);
           return false;
         }

         logger.info(`Successfully created tag '${name}' for booster '${repo}'`);
         return true;
      }).catch(e => {
        logger.error(`Unable to create tag '${name}' for branch '${branch}' of booster '${repo}'`);
        logger.error(`Error is:\n ${e}`);
        return false;
      });
    });
}

/**
 * Delete the specified branch
 *
 * @return true if everything goes well, false otherwise
 */
export function deleteBranch(repo: string, branch: string, token?: string,
                             owner = SNOWDROP_ORG): Promise<boolean> {

  return githubApi(token).gitdata.deleteReference({
    owner,
    repo,
    ref: `heads/${branch}`,
  })
  .then(() => {
    logger.info(`Successfully deleted branch '${branch}' of booster '${repo}'`);
    return true;
  })
  .catch(e => {
    logger.error(`Unable to delete branch '${branch}' of booster '${repo}'`);
    logger.error(`Error is:\n ${e}`);
    return false;
  });
}
