import {
  failure,
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
import {editAll} from "@atomist/automation-client/lib/operations/edit/editAll";
import {PullRequest} from "@atomist/automation-client/lib/operations/edit/editModes";
import {allReposInTeam} from "@atomist/sdm";
import {boosterRepos} from "../support/repo/boosterRepo";
import {FixedBranchDefaultRepoRefResolver} from "../support/repo/FixedBranchDefaultRepoRefResolver";
import {updateMavenProperty} from "../support/transform/booster/updateMavenProperty";

@CommandHandler("Update a Maven property of the boosters", "update boosters maven property")
export class ExecuteAdHocBoosterUpdate implements HandleCommand {

  @Parameter({
    displayName: "Maven property name",
    minLength: 2,
    maxLength: 30,
    required: true,
  })
  public propertyName: string;

  @Parameter({
    displayName: "New property value",
    minLength: 1,
    maxLength: 30,
    required: true,
  })
  public newValue: string;

  @Parameter({
    displayName: "Reference branch",
    description: "The booster branch against which the PR will be opened ('sb-2.1.x' for example)",
    minLength: 4,
    maxLength: 30,
    required: true,
  })
  public referenceBranch: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public async handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    logger.debug(`Attempting to update property Maven property ${this.propertyName} of boosters to ${this.newValue}`);

    try {
      await editAll(
          context,
          {token: params.githubToken},
          updateMavenProperty({
            name: this.propertyName,
            value: this.newValue,
          }),
          new PullRequest(`property-update-${this.propertyName}`, `Update value of ${this.propertyName}`),
          undefined,
          allReposInTeam(new FixedBranchDefaultRepoRefResolver(this.referenceBranch)),
          boosterRepos(params.githubToken),
      );
    } catch (e) {
      return failure(e);
    }

    return success();
  }

}
