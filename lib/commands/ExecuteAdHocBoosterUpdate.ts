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
  success,
} from "@atomist/automation-client";
import {editAll} from "@atomist/automation-client/operations/edit/editAll";
import {PullRequest} from "@atomist/automation-client/operations/edit/editModes";
import {AnyProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import axios from "axios";
import * as ts from "typescript";
import {allReposInTeam} from "../support/repo/allReposInTeamRepoFinder";
import {boosterRepos} from "../support/repo/boosterRepo";

/* tslint:disable */
/*
 * Executes an ad-hoc script on all boosters
 * The script needs to be accessible via HTTP(S) and an example can be found at:
 * https://gist.githubusercontent.com/geoand/dcdc8da96324bdd3ed06efbee1342064/raw/db3a747e2ee54a798e5c43bc62ddcc2ec3179400/dummy.ts
 *
 * looks like this:
 *
import {Project} from "@atomist/automation-client/project/Project";

 (() => {
  return async (project: Project) => {
    return await project.deleteFile("README.adoc");
  }
})();

 *
 * Use this feature with caution, although you can be sure that changes will not be done on the master branch,
 * but a PR will be created for each booster which should then be reviewed carefully.
 */
/* tslint:enable */

@CommandHandler("Execute Ad Hoc Booster update", "update boosters adhoc")
export class ExecuteAdHocBoosterUpdate implements HandleCommand {

  @Parameter({
    displayName: "ProjectEditor source URL",
    description: "The HTTP URL from where the source code of the ad hoc modification is help",
    pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
    validInput: "https://gist.github.com/test/87262f15eaec7ac4bf23513d3b180582",
    minLength: 10,
    maxLength: 200,
    required: true,
  })
  public sourceURL: string;

  @Parameter({
    displayName: "branch",
    description: "The name of branch where the change will be made",
    required: false,
  })
  public branch: string = "adhoc-update";

  @Parameter({
    displayName: "commit title",
    description: "The commit tile that will be used ",
    minLength: 3,
    maxLength: 80,
    required: true,
  })
  public commitTitle: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public async handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    logger.debug("Attempting to run ad hoc modification of boosters");

    const axiosResponse = await axios.get(params.sourceURL);

    if (axiosResponse.status !== 200) {
      logger.warn(`Unable to retrieve source code from ${params.sourceURL}`);
      return Promise.reject(`Un-retrievable source code`);
    }

    let editor;
    try {
      const transpiledCode = ts.transpile(axiosResponse.data);
      // tslint:disable-next-line:no-eval
      editor = eval(transpiledCode) as AnyProjectEditor;
    } catch (e) {
      logger.error(`Code at ${params.sourceURL} is invalid Typescript`);
      return Promise.reject(`Invalid source code`);
    }

    return editAll(
        context,
        {token: params.githubToken},
        editor,
        new PullRequest(this.branch, params.commitTitle),
        undefined,
        allReposInTeam(),
        boosterRepos(params.githubToken),
    ).then(success, failure);
  }

}
