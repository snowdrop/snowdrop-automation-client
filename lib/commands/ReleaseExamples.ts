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
import {relevantRepos} from "@atomist/automation-client/lib/operations/common/repoUtils";
import {allReposInTeam} from "@atomist/sdm";
import async = require("async");
import * as os from "os";
import {SPRING_BOOT_VERSION_REGEX} from "../constants";
import {releaseExample, ReleaseParams} from "../support/example/release";
import {boosterRepos} from "../support/repo/boosterRepo";
import {FixedBranchDefaultRepoRefResolver} from "../support/repo/FixedBranchDefaultRepoRefResolver";
import {versionToExampleBranch} from "../support/utils/versions";
import {isOnVpn} from "../support/utils/vpn";

@CommandHandler("Release (tag) examples", "release examples")
export class ReleaseExamples implements HandleCommand {

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
    displayName: "prod BOM version",
    // tslint:disable-next-line: max-line-length
    description: "The BOM version produced by the prod run (found in extras/repository-artifact-list.txt - something like: 2.2.5.Beta1-redhat-00007)",
    pattern: /^(\d+.\d+.\d+).(\w+)-redhat-\d+$/,
    validInput: "2.2.5.Beta1-redhat-00007",
    minLength: 16,
    maxLength: 50,
    required: true,
  })
  public prodBomVersion: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public async handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    if (!await isOnVpn()) {
      return failure(new Error("You must be on the RH VPN to release the example"));
    }

    const branch = versionToExampleBranch(this.prodBomVersion);

    /**
     * We need to limit the concurrency of the booster release, because it uses the resource
     * intensive licensing generation process (which is resource intensive because it launches
     * a Java application in a separate process)
     * In order to do that we employ a "queue" from the "async" module
     * We add all the necessary jobs into that queue but we tie the amount of concurrency
     * to the number of cpus available to the machine
     */
    const queue =
        async.queue(
            (releaseParams: ReleaseParams, callback) => {
              releaseExample(releaseParams)
                  .then(() => callback());
            },
            // use at least 1 cpu, but when there are multiple cpus, don't use them all
            Math.max(os.cpus().length - 1, 1),
        );

    const repositories = await relevantRepos(context, allReposInTeam(new FixedBranchDefaultRepoRefResolver(branch)),
        boosterRepos(params.githubToken));
    repositories.forEach(r => {
      queue.push({
        startingBranch: branch,
        springBootVersion: params.springBootVersion,
        prodBomVersion: params.prodBomVersion,
        owner: r.owner,
        repository: r.repo,
        githubToken: params.githubToken,
        context,
      });
    });

    // make sure we let Atomist know that everything finished successfully
    queue.drain = () => success();
    return await queue.drain();
  }
}
