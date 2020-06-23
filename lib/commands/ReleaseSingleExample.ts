import {
  failure,
  HandlerContext,
  HandlerResult,
  MappedParameter,
  MappedParameters,
  Parameter,
  Secret,
  Secrets,
  success,
} from "@atomist/automation-client";
import {CommandHandler} from "@atomist/automation-client/lib/decorators";
import {HandleCommand} from "@atomist/automation-client/lib/HandleCommand";
import {SPRING_BOOT_VERSION_REGEX} from "../constants";
import {releaseExample} from "../support/example/release";
import {versionToExampleBranch} from "../support/utils/versions";
import {isOnVpn} from "../support/utils/vpn";

@CommandHandler("Release (tag) single example", "release single example")
export class ReleaseSingleExample implements HandleCommand {

  @Parameter({
    displayName: "spring boot version",
    description: "Upstream Spring Boot version (e.g. 2.2.5.RELEASE)",
    pattern: SPRING_BOOT_VERSION_REGEX,
    validInput: "2.2.5.RELEASE",
    minLength: 10,
    maxLength: 50,
    required: true,
  })
  public springBootVersion: string;

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
    if (!await isOnVpn()) {
      return failure(new Error("You must be on the RH VPN to release the example"));
    }

    return releaseExample(
        {
          context,
          startingBranch: versionToExampleBranch(this.prodBomVersion),
          ...params,
        })
        .then(success, failure);
  }
}
