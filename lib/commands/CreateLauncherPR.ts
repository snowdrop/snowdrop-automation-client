import {
  failure,
  GitHubRepoRef,
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
import {relevantRepos} from "@atomist/automation-client/lib/operations/common/repoUtils";
import {editOne} from "@atomist/automation-client/lib/operations/edit/editAll";
import {BranchCommit} from "@atomist/automation-client/lib/operations/edit/editModes";
import {allReposInTeam} from "@atomist/sdm";
import {DefaultRepoRefResolver} from "@atomist/sdm-core";
import {BOOSTER_CATALOG_REPO, SNOWDROP_ORG} from "../constants";
import {updateLauncherCatalog} from "../support/catalog/updateLauncherCatalog";
import {DefaultLatestTagRetriever} from "../support/github/boosterUtils";
import {raisePullRequestToUpstream, syncWithUpstream} from "../support/github/refUtils";
import {boosterRepos} from "../support/repo/boosterRepo";

const latestTagRetriever = new DefaultLatestTagRetriever();

@CommandHandler("Create launcher PR", "create launcher pr")
export class CreateLauncherPR implements HandleCommand {

  @Parameter({
    displayName: "spring boot version",
    // tslint:disable-next-line: max-line-length
    description: "The Spring Boot version",
    pattern: /^\d+.\d+.\d+.*$/,
    validInput: "2.1.12.RELEASE",
    minLength: 13,
    maxLength: 14,
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

  private async updateCatalogAndCreatePR(context: HandlerContext, params: this, branch: string):
      Promise<HandlerResult> {
    const prTitlePrefix = "WIP - DO NOT MERGE: ";
    const commitMessage = `Update Spring Boot to ${params.sbVersion}`;

    try {
      const syncResult = await syncWithUpstream(BOOSTER_CATALOG_REPO, params.githubToken, SNOWDROP_ORG);
      if (!syncResult) {
        return Promise.reject("Could not sync with upstream launcher catalog");
      }

      const exampleRepos = await relevantRepos(context, allReposInTeam(new DefaultRepoRefResolver()),
          boosterRepos(params.githubToken));

      await editOne(
          context,
          {token: params.githubToken},
          updateLauncherCatalog(latestTagRetriever, params.sbVersion, exampleRepos, params.githubToken),
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
