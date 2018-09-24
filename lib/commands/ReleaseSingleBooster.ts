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
import {releaseBooster} from "./ReleaseBoosterUtil";

@CommandHandler("Release (tag) single boosters", "release single booster")
export class ReleaseSingleBooster implements HandleCommand {

  @Parameter({
    displayName: "prod_bom_version",
    description: "The BOM version produced by the prod run",
    pattern: /^(\d+.\d+.\d+).(\w+)-redhat-\d+$/,
    validInput: "1.5.15.Final-redhat-00002",
    minLength: 16,
    maxLength: 50,
    required: true,
  })
  public prodBomVersion: string;

  @MappedParameter(MappedParameters.GitHubRepository)
  public repository: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {

    return releaseBooster(
        {
          prodBomVersion: params.prodBomVersion,
          owner: params.owner,
          repository: params.repository,
          githubToken: params.githubToken,
          context,
        })
        .then(success, failure);
  }

}
