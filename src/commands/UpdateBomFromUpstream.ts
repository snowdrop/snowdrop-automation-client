import {
  CommandHandler,
  failure,
  HandleCommand,
  HandlerContext,
  HandlerResult,
  logger,
  MappedParameter,
  MappedParameters,
  Parameter,
  Secret,
  Secrets,
  success,
} from "@atomist/automation-client";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {editOne} from "@atomist/automation-client/operations/edit/editAll";
import {BranchCommit} from "@atomist/automation-client/operations/edit/editModes";
import {BOM_REPO, UPSTREAM_RELEASE_VERSION_REGEX} from "../constants";
import {updateBomFromUpstream} from "../support/transform/booster/updateBomFromUpstream";

@CommandHandler("Update BOM properties from Upstream", "update bom properties")
export class UpdateBomFromUpstream implements HandleCommand {

  @Parameter({
    displayName: "upstream version",
    description: "The upstream Spring Boot version for which we want to run the update",
    pattern: UPSTREAM_RELEASE_VERSION_REGEX,
    validInput: "1.5.15.RELEASE",
    minLength: 10,
    maxLength: 50,
    required: true,
  })
  public upstreamVersion: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    logger.debug(`Attempting to update BOM for upstream version: '${params.upstreamVersion}'`);

    const branch = "sb-1.5.x"; // TODO this will change when we support 2.x or both at the same time
    return editOne(
        context,
        {token: params.githubToken},
        updateBomFromUpstream(params.upstreamVersion),
        {
          branch,
          message: `Update BOM for upstream ${params.upstreamVersion}`,
        } as BranchCommit,
        new GitHubRepoRef(params.owner, BOM_REPO, branch),
        undefined,
    ).then(success, failure);
  }
}
