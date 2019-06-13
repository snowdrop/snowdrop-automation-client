import {
  failure, GitHubRepoRef,
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
import {CommandHandler} from "@atomist/automation-client/lib/decorators";
import {HandleCommand} from "@atomist/automation-client/lib/HandleCommand";
import {editOne} from "@atomist/automation-client/lib/operations/edit/editAll";
import {BranchCommit} from "@atomist/automation-client/lib/operations/edit/editModes";
import {BOOSTER_CATALOG_REPO, SNOWDROP_ORG} from "../constants";
import {DefaultLatestTagRetriever} from "../support/github/boosterUtils";
import {raisePullRequestToUpstream, syncWithUpstream} from "../support/github/refUtils";
import {updateLauncherCatalog} from "../support/transform/catalog/updateLauncherCatalog";

const latestTagRetriever = new DefaultLatestTagRetriever();

@CommandHandler("Create launcher PR", "create launcher pr")
export class CreateLauncherPR implements HandleCommand {

  @Parameter({
    displayName: "spring boot version",
    // tslint:disable-next-line: max-line-length
    description: "The (simplified) Spring Boot version (no qualifiers needed  - simply something like: 1.5.15)",
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

    return this.updateCatalogAndCreatePR(context, params, `update-to-spring-boot-${params.sbVersion}`);
  }

  private async updateCatalogAndCreatePR(context: HandlerContext,
                                         params: this, branch: string): Promise<HandlerResult> {
    const prTitlePrefix = "WIP - DO NOT MERGE: ";
    const commitMessage = `Update Spring Boot to ${params.sbVersion}`;

    try {
      const syncResult = await syncWithUpstream(BOOSTER_CATALOG_REPO, params.githubToken, SNOWDROP_ORG);

      if (!syncResult) {
        return Promise.reject("Could not sync with upstream launcher catalog");
      }

      await editOne(
          context,
          {token: params.githubToken},
          updateLauncherCatalog(context, latestTagRetriever, params.sbVersion, params.githubToken),
          {
            branch,
            message: commitMessage,
          } as BranchCommit,
          GitHubRepoRef.from({owner: params.owner, repo: BOOSTER_CATALOG_REPO}),
          undefined,
      );

      logger.debug("Attempting to create PR to upstream catalog");
      await raisePullRequestToUpstream(
          BOOSTER_CATALOG_REPO, branch, "master", `${prTitlePrefix}${commitMessage}`, params.githubToken, params.owner);

      return success();
    } catch (e) {
      return failure(e);
    }
  }
}
