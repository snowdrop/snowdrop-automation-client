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
import {ensureVPNAccess, releaseBooster} from "./ReleaseBoosterUtil";

@CommandHandler("Release (tag) single boosters", "release single booster")
export class ReleaseSingleBooster implements HandleCommand {

  @Parameter({
    displayName: "prod_bom_version",
    // tslint:disable-next-line: max-line-length
    description: "The BOM version produced by the prod run (found in extras/repository-artifact-list.txt - something like: 1.5.15.Final-redhat-00002)",
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

  public async handle(context: HandlerContext, params: this): Promise<HandlerResult> {

    const error = await ensureVPNAccess();
    if (error != null) {
      return failure(error);
    }

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
