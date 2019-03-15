import {GitHubRepoRef, HandlerContext, logger, Project} from "@atomist/automation-client";
import {editAll, editOne} from "@atomist/automation-client/lib/operations/edit/editAll";
import {BranchCommit} from "@atomist/automation-client/lib/operations/edit/editModes";
import {EditResult} from "@atomist/automation-client/lib/operations/edit/projectEditor";
import {allReposInTeam} from "@atomist/sdm";
import {BOM_REPO} from "../constants";
import {boosterRepos} from "../support/repo/boosterRepo";
import {FixedBranchDefaultRepoRefResolver} from "../support/repo/FixedBranchDefaultRepoRefResolver";
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

  const boosterBranch = determineBoosterBranchToUpdate(releasedBOMVersion);
  const bomBranch = determineBomBranchToUpdate(releasedBOMVersion);

  logger.debug(`Will attempt to update branch ${bomBranch} of BOM and branch ${boosterBranch} of boosters`);

  return editAll(params.context,
      {token: params.githubToken},
      updateBoosterForBomVersion(params.bomVersion),
      {
          branch: boosterBranch,
          message: `[booster-release] Update BOM to ${releasedBOMVersion}`,
      } as BranchCommit,
      undefined,
      allReposInTeam(new FixedBranchDefaultRepoRefResolver(boosterBranch)),
      boosterRepos(params.githubToken),
  )
  .then(() => {
    return editOne(
        params.context,
        {token: params.githubToken},
        updateBomVersionForRelease(releasedBOMVersion),
        {
          branch: bomBranch,
          message: `Bump BOM version [ci skip]`,
        } as BranchCommit,
        GitHubRepoRef.from({owner: params.owner, repo: BOM_REPO, branch: bomBranch}),
        undefined,
    );
  });
}

export function determineBoosterBranchToUpdate(releasedBOMVersion: string): string {
    if (releasedBOMVersion.startsWith("1.5")) {
        return "master";
    }

    return "sb-2.1.x";
}
export function determineBomBranchToUpdate(releasedBOMVersion: string): string {
    if (releasedBOMVersion.startsWith("1.5")) {
        return "sb-1.5.x";
    }

    return "sb-2.1.x";
}
