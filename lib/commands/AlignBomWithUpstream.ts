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
import {editOne} from "@atomist/automation-client/lib/operations/edit/editAll";
import {BranchCommit} from "@atomist/automation-client/lib/operations/edit/editModes";
import {BOM_REPO, SPRING_BOOT_VERSION_REGEX} from "../constants";
import {alignBomWithUpstream} from "../support/transform/bom/alignBomWithUpstream";

const FIRST_TWO_VERSION_NUMBERS_REGEX = /^\d+.\d+/;

@CommandHandler("Align BOM with upstream Spring Boot", "align bom with upstream")
export class AlignBomWithUpstream implements HandleCommand {

  @Parameter({
    displayName: "spring boot version",
    description: "Spring Boot version for which we want to run the update (e.g. 2.2.5.RELEASE)",
    pattern: SPRING_BOOT_VERSION_REGEX,
    validInput: "2.2.5.RELEASE",
    minLength: 10,
    maxLength: 50,
    required: true,
  })
  public springBootVersion: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    const branch = this.getBranch(params.springBootVersion);
    logger.debug(
        `Attempting to align '${BOM_REPO}' with Spring Boot '${params.springBootVersion}' on '${branch}' branch`);

    return editOne(
        context,
        {token: params.githubToken},
        alignBomWithUpstream(params.springBootVersion),
        {
          branch,
          message: `Align BOM with Spring Boot ${params.springBootVersion}`,
        } as BranchCommit,
        GitHubRepoRef.from({owner: params.owner, repo: BOM_REPO, branch}),
        undefined,
    ).then(success, failure);
  }

  private getBranch(springBootVersion: string): string {
    return `sb-${springBootVersion.match(FIRST_TWO_VERSION_NUMBERS_REGEX)[0]}.x`;
  }
}
