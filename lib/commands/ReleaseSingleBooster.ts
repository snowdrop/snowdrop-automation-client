import {
  CommandHandler,
  failure,
  GitHubRepoRef,
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
import {editOne} from "@atomist/automation-client/operations/edit/editAll";
import {BranchCommit, commitToMaster} from "@atomist/automation-client/operations/edit/editModes";
import {
  AnyProjectEditor,
  EditResult,
} from "@atomist/automation-client/operations/edit/projectEditor";
import {Project} from "@atomist/automation-client/project/Project";
import {resolve} from "path";
import {BOOSTER_BOM_PROPERTY_NAME, LICENSES_GENERATOR_PATH, REDHAT_QUALIFIER} from "../constants";
import {deleteBranch, tagBranch} from "../support/github/refUtils";
import licensesGenerator from "../support/transform/booster/licensesGenerator";
import {setBoosterVersionInTemplate} from "../support/transform/booster/setBoosterVersionInTemplate";
import {
  bumpMavenProjectRevisionVersion,
  removeSnapshotFromMavenProjectVersion,
  replaceSnapshotFromMavenProjectVersionWithQualifier,
} from "../support/transform/booster/updateMavenProjectVersion";
import {updateMavenProperty} from "../support/transform/booster/updateMavenProperty";
import {getCurrentVersion} from "../support/utils/pomUtils";

// TODO refactor to replace duplicate code between this class and ReleaseBoosters

const licensesGeneratorPath = resolve(LICENSES_GENERATOR_PATH);

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

    logger.debug(`Attempting to create community tags for boosters`);

    const communityBranchName = "temp-community";
    const prodBranchName = "temp-prod";

    const communityEditor = (p: Project) => {
      return removeSnapshotFromMavenProjectVersion()(p)
              .then(p2 => {
                return setBoosterVersionInTemplate()(p2);
              })
              .then(p3 => {
                return licensesGenerator(licensesGeneratorPath)(p3);
              });
    };

    const prodEditor = (p: Project) => {
      return replaceSnapshotFromMavenProjectVersionWithQualifier(REDHAT_QUALIFIER)(p)
              .then(p2 => {
                return setBoosterVersionInTemplate()(p2);
              })
              .then(p3 => {
                return updateMavenProperty({
                  name: BOOSTER_BOM_PROPERTY_NAME,
                  value: this.prodBomVersion,
                })(p3);
              })
              .then(p4 => {
                return licensesGenerator(licensesGeneratorPath)(p4);
              });
    };

    return this
            // edit project for community tag
            .editBoosterInBranch(context, params, communityBranchName, communityEditor)
            // create community release
            .then(this.releaseBooster(communityBranchName, params))
            .then(() => {
              this
                // edit project for prod tag
                .editBoosterInBranch(context, params, prodBranchName, prodEditor)
                // create prod release
                .then(this.releaseBooster(prodBranchName, params));
            })
            .then(() => { // bump the version of the booster
              return editOne(context,
                  {token: params.githubToken},
                  bumpMavenProjectRevisionVersion(),
                  commitToMaster("[booster-release] Bump version"),
                  new GitHubRepoRef(params.owner, params.repository),
              );
            })
            .then(success, failure);
  }

  private editBoosterInBranch(context: HandlerContext, params: this,
                              branchName: string, editor: AnyProjectEditor<any>) {
    return editOne(context,
        {token: params.githubToken},
        editor,
        {
          branch: branchName,
          message: "[booster-release] Set version and replace templates placeholders",
        } as BranchCommit,
        new GitHubRepoRef(params.owner, params.repository),
    );
  }

  private releaseBooster(branchName: string, params: this): (r: EditResult) => void {
    return async r => {
      logger.debug("Finished editing booster. Will now create tags");

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
    };
  }
}
