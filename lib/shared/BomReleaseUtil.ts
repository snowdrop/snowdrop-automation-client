import {GitHubRepoRef, HandlerContext} from "@atomist/automation-client";
import {editAll, editOne} from "@atomist/automation-client/operations/edit/editAll";
import {BranchCommit, commitToMaster} from "@atomist/automation-client/operations/edit/editModes";
import {EditResult} from "@atomist/automation-client/operations/edit/projectEditor";
import {Project} from "@atomist/automation-client/project/Project";
import {BOM_BRANCH, BOM_REPO} from "../constants";
import {allReposInTeam} from "../support/repo/allReposInTeamRepoFinder";
import {boosterRepos} from "../support/repo/boosterRepo";
import {updateBomVersionForRelease} from "../support/transform/bom/updateBomVersionForRelease";
import {updateBoosterForBomVersion} from "../support/transform/booster/updateBoosterForBomVersion";

export class UpdateParams {
  public bomVersion: string;
  public owner: string;
  public githubToken: string;
  public context: HandlerContext;
}

export function performUpdatesForBomRelease(params: UpdateParams): Promise<EditResult<Project>> {
  const releasedBOMVersion = params.bomVersion;

  const commit = commitToMaster(`[booster-release] Update BOM to ${releasedBOMVersion}`);

  return editAll(params.context,
      {token: params.githubToken},
      updateBoosterForBomVersion(params.bomVersion),
      commit,
      undefined,
      allReposInTeam(),
      boosterRepos(params.githubToken),
  )
  .then(() => {
    return editOne(
        params.context,
        {token: params.githubToken},
        updateBomVersionForRelease(releasedBOMVersion),
        {
          branch: BOM_BRANCH,
          message: `Bump BOM version [ci skip]`,
        } as BranchCommit,
        new GitHubRepoRef(params.owner, BOM_REPO, BOM_BRANCH),
        undefined,
    );
  });
}
