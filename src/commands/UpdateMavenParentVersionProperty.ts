import {
  CommandHandler,
  failure,
  HandleCommand,
  HandlerContext,
  HandlerResult,
  MappedParameter,
  MappedParameters,
  Parameter,
  Secret,
  Secrets,
  success,
} from "@atomist/automation-client";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {editOne} from "@atomist/automation-client/operations/edit/editAll";
import {PullRequest} from "@atomist/automation-client/operations/edit/editModes";
import {updateMavenParentVersion} from "../support/transform/updateMavenParentVersion";

@CommandHandler("Update the version of the Maven parent on a single repository", "update maven-parent-version")
export class UpdateMavenParentVersionProperty implements HandleCommand {

  @Parameter({
    displayName: "name",
    description: "New parent version",
    pattern: /^.+$/,
    validInput: "23",
    minLength: 1,
    maxLength: 30,
    required: true,
  })
  public value: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @MappedParameter(MappedParameters.GitHubRepository)
  public repository: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {

    const pullRequest = new PullRequest("update-parent-version", `Update parent to ${params.value}`);

    const gitHubRepo = new GitHubRepoRef(this.owner, this.repository);

    return editOne(context,
        {token: this.githubToken}, // GitHub credentials
        updateMavenParentVersion(params.value), // a function to change the project
        pullRequest, // how to save the edit
        gitHubRepo) // where to find the project
    .then(success, failure);
  }
}
