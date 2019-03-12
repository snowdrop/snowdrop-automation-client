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
import {determineBoosterBranchToUpdate} from "../shared/BomReleaseUtil";
import {boosterRepos} from "../support/repo/boosterRepo";
import {FixedBranchDefaultRepoRefResolver} from "../support/repo/FixedBranchDefaultRepoRefResolver";
import {ensureVPNAccess, releaseBooster, ReleaseParams} from "./ReleaseBoosterUtil";

@CommandHandler("Release (tag) boosters", "release boosters")
export class ReleaseBoosters implements HandleCommand {

  @Parameter({
    displayName: "prod_bom_version",
    // tslint:disable-next-line: max-line-length
    description: "The BOM version produced by the prod run (found in extras/repository-artifact-list.txt - something like: 1.5.15.Beta1-redhat-00007)",
    pattern: /^(\d+.\d+.\d+).(\w+)-redhat-\d+$/,
    validInput: "1.5.15.Beta1-redhat-00007",
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

    const error = await ensureVPNAccess();
    if (error != null) {
      return failure(error);
    }

    const boosterBranchToUse = determineBoosterBranchToUpdate(this.prodBomVersion);

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
              releaseBooster(releaseParams).then(callback);
            },
            // use at least 1 cpu, but when there are multiple cpus, don't use them all
            Math.max(os.cpus().length - 1, 1),
        );

    const boosterRepositories =
        await relevantRepos(
            context,
            allReposInTeam(new FixedBranchDefaultRepoRefResolver(boosterBranchToUse)), boosterRepos(params.githubToken),
        );
    boosterRepositories.forEach(r => {
      queue.push({
        startingBranch: boosterBranchToUse,
        prodBomVersion: params.prodBomVersion,
        owner: r.owner,
        repository: r.repo,
        githubToken: params.githubToken,
        context,
      });
    });

    // make sure we call let Atomist know that everything finished successfully
    queue.drain = () => success();
    return await queue.drain();
  }
}
