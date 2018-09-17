import {
  AnyProjectEditor, BranchCommit,
  CommandHandler, editAll, EditResult,
  failure,
  HandleCommand,
  HandlerContext,
  HandlerResult,
  logger,
  MappedParameter,
  MappedParameters,
  Parameter, Project,
  Secret,
  Secrets,
  success,
} from "@atomist/automation-client";
import {BOOSTER_BOM_PROPERTY_NAME, REDHAT_QUALIFIER} from "../constants";
import {deleteBranch, tagBranch} from "../support/github/refUtils";
import {boosterRepos} from "../support/repo/boosterRepo";
import {setBoosterVersionInTemplate} from "../support/transform/booster/setBoosterVersionInTemplate";
import {
  bumpMavenProjectRevisionVersion,
  removeSnapshotFromMavenProjectVersion,
  replaceSnapshotFromMavenProjectVersionWithQualifier,
} from "../support/transform/booster/updateMavenProjectVersion";
import {updateMavenProperty} from "../support/transform/booster/updateMavenProperty";
import {getCurrentVersion} from "../support/utils/pomUtils";
import {commitToMaster} from "@atomist/automation-client/lib/operations/edit/editModes";
import {DefaultRepoRefResolver} from "@atomist/sdm-core";
import {allReposInTeam} from "@atomist/sdm";

@CommandHandler("Release (tag) boosters", "release boosters")
export class ReleaseBoosters implements HandleCommand {

  @Parameter({
    displayName: "prod_bom_version",
    description: "The BOM version produced by the prod run",
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

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {

    logger.debug(`Attempting to create community tags for boosters`);

    const communityBranchName = "temp-community";
    const prodBranchName = "temp-prod";

    const communityEditor = (p: Project) => {
      return removeSnapshotFromMavenProjectVersion()(p)
              .then((p2: Project) => {
                return setBoosterVersionInTemplate()(p2);
              });
    };

    const prodEditor = (p: Project) => {
      return replaceSnapshotFromMavenProjectVersionWithQualifier(REDHAT_QUALIFIER)(p)
              .then((p2: Project) => {
                return setBoosterVersionInTemplate()(p2);
              })
              .then((p3: Project) => {
                return updateMavenProperty({
                  name: BOOSTER_BOM_PROPERTY_NAME,
                  value: this.prodBomVersion,
                })(p3);
              });
    };

    return this
            // edit project for community tag
            .editAllBoostersInBranch(context, params, communityBranchName, communityEditor)
            // create community release
            .then(this.releaseBoosters(communityBranchName, params))
            .then(() => {
              this
                // edit project for prod tag
                .editAllBoostersInBranch(context, params, prodBranchName, prodEditor)
                // create prod release
                .then(this.releaseBoosters(prodBranchName, params));
            })
            .then(() => { // bump the version of the booster
              return editAll(context,
                  {token: params.githubToken},
                  bumpMavenProjectRevisionVersion(),
                  commitToMaster("[booster-release] Bump version"),
                  undefined,
                  allReposInTeam(new DefaultRepoRefResolver()),
                  boosterRepos(params.githubToken),
              );
            })
            .then(success, failure);
  }

  private editAllBoostersInBranch(context: HandlerContext, params: this,
                                  branchName: string, editor: AnyProjectEditor<any>) {
    return editAll(context,
        {token: params.githubToken},
        editor,
        {
          branch: branchName,
          message: "[booster-release] Set version and replace templates placeholders",
        } as BranchCommit,
        undefined,
        allReposInTeam(new DefaultRepoRefResolver()),
        boosterRepos(params.githubToken),
    );
  }

  private releaseBoosters(branchName: string, params: this): (results: EditResult[]) => void {
    return results => {
      logger.debug("Finished editing boosters. Will now create tags");

      results.forEach(async r => {
        const project = r.target;
        const repo = r.target.name;
        if (!r.edited) {
          logger.error(`Booster ${repo} was not updated as part of the release process`);
          logger.error("This is probably an implementation issue");
          return;
        }

        const tagName = await getCurrentVersion(project);

        const tagCreated =
            await tagBranch(repo, branchName, tagName, params.githubToken, params.owner);
        if (tagCreated) {
          await deleteBranch(repo, branchName, params.githubToken, params.owner);
        }
      });
    };
  }
}
