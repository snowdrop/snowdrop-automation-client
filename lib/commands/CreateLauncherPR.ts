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
import {BOOSTER_CATALOG_REPO} from "../constants";
import {DefaultLatestTagRetriever} from "../support/github/boosterUtils";
import {raisePullRequestToUpstream} from "../support/github/refUtils";
import {updateLauncherCatalog} from "../support/transform/catalog/updateLauncherCatalog";

const latestTagRetriever = new DefaultLatestTagRetriever();

@CommandHandler("Create launcher PR", "create launcher pr")
export class CreateLauncherPR implements HandleCommand {

  @Parameter({
    displayName: "spring boot version",
    description: "The Spring Boot version",
    pattern: /^\d+.\d+.\d+$/,
    validInput: "1.5.15",
    minLength: 5,
    maxLength: 10,
    required: true,
  })
  public sbVersion: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    logger.debug("Attempting to create a Pull Request to the launcher catalog with the latest booster releases");

    return this.updateCatalogAndCreatePR(context, params, `update-to-${params.sbVersion}`);
  }

  private updateCatalogAndCreatePR(context: HandlerContext, params: this, branch: string) {
    const message = `Update Spring Boot to ${params.sbVersion}`;
    return editOne(
        context,
        {token: params.githubToken},
        updateLauncherCatalog(context, latestTagRetriever, params.sbVersion, params.githubToken),
        {
          branch,
          message,
        } as BranchCommit,
        new GitHubRepoRef(params.owner, BOOSTER_CATALOG_REPO),
        undefined,
    ).then(() => {
      logger.debug("Attempting to create PR to upstream catalog");
      return raisePullRequestToUpstream(
          BOOSTER_CATALOG_REPO, branch, "master", message, params.githubToken, params.owner);
    }).then(success, failure);
  }
}
