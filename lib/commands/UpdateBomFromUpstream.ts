import {
  BranchCommit,
  CommandHandler,
  failure, GitHubRepoRef,
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
import {BOM_BRANCH, BOM_REPO, UPSTREAM_RELEASE_VERSION_REGEX} from "../constants";
import {updateBomFromUpstream} from "../support/transform/bom/updateBomFromUpstream";
import {editOne} from "@atomist/automation-client/lib/operations/edit/editAll";

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

    return editOne(
        context,
        {token: params.githubToken},
        updateBomFromUpstream(params.upstreamVersion),
        {
          branch: BOM_BRANCH,
          message: `Update BOM for upstream ${params.upstreamVersion}`,
        } as BranchCommit,
        new GitHubRepoRef(params.owner, BOM_REPO, BOM_BRANCH),
        undefined,
    ).then(success, failure);
  }
}
