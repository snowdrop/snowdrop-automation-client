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
  Tags,
} from "@atomist/automation-client";
import {CommandHandler} from "@atomist/automation-client/lib/decorators";
import {HandleCommand} from "@atomist/automation-client/lib/HandleCommand";
import {BOM_VERSION_REGEX} from "../constants";
import {updateBomVersionEverywhere, UpdateParams} from "../support/bom/versionUpdate";

// see also events/SpringBootBomRelease
@CommandHandler(
    // tslint:disable-next-line: max-line-length
    "Update boosters and BOM for BOM release (should only be done if the relevant Atomist event was not caught - most likely because Atomist was not running)",
    "update for release",
)
@Tags("bom", "release", "boosters")
export class SpringBootBomRelease implements HandleCommand {

  @Parameter({
    displayName: "bom_version",
    // tslint:disable-next-line: max-line-length
    description: "The full version string including qualifier (e.g. 2.1.10.Beta1, 1.5.19.SP3, 2.0.2.Final…) of the upstream Snowdrop BOM release to update",
    pattern: BOM_VERSION_REGEX,
    validInput: "1.5.15.Final",
    minLength: 10,
    maxLength: 50,
    required: true,
  })
  public bomVersion: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    logger.debug(`Attempting to manually update boosters to new BOM version ${params.bomVersion}`);

    return updateBomVersionEverywhere({
      bomVersion: params.bomVersion,
      owner: params.owner,
      githubToken: params.githubToken,
      context,
    } as UpdateParams).then(success, failure);
  }
}
