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
  success, Tags,
} from "@atomist/automation-client";
import {BOM_VERSION_REGEX} from "../constants";
import {performUpdatesForBomRelease, UpdateParams} from "../shared/BomReleaseUtil";

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
    description: "The upstream snowdrop release of the BOM for which the update is going to run (something like: 1.5.15.Final)",
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

    return performUpdatesForBomRelease({
      bomVersion: params.bomVersion,
      owner: params.owner,
      githubToken: params.githubToken,
      context,
    } as UpdateParams).then(success, failure);
  }
}
