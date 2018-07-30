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
import {updateMavenPropertyEditor} from "../support/transform/updateMavenProperty";

@CommandHandler("Update a Maven property on a single repository", "update maven-property")
export class UpdateMavenProperty implements HandleCommand {

  @Parameter({
    displayName: "name",
    description: "Maven property name to replace - the property has to exist for this to work",
    pattern: /^[a-z][a-zA-Z0-9_.\-]+[a-zA-Z0-9]$/,
    validInput: "spring-boot-bom.version",
    minLength: 1,
    maxLength: 30,
    required: true,
  })
  public name: string;

  @Parameter({
    displayName: "name",
    description: "Maven property value to replace existing value",
    pattern: /^.+$/,
    validInput: "1.5.14.Final",
    minLength: 1,
    maxLength: 100,
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

    const pullRequest = new PullRequest("update-property", `Update ${params.name} to ${params.value}`);

    const gitHubRepo = new GitHubRepoRef(this.owner, this.repository);

    return editOne(context,
        {token: this.githubToken}, // GitHub credentials
        updateMavenPropertyEditor({name: params.name, value: params.value}), // a function to change the project
        pullRequest, // how to save the edit
        gitHubRepo) // where to find the project
    .then(success, failure);
  }
}
