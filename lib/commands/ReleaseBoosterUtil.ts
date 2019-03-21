import {GitHubRepoRef, HandlerContext, logger, Project} from "@atomist/automation-client";
import {editOne} from "@atomist/automation-client/lib/operations/edit/editAll";
import {BranchCommit} from "@atomist/automation-client/lib/operations/edit/editModes";
import {AnyProjectEditor, EditResult} from "@atomist/automation-client/lib/operations/edit/projectEditor";
import * as dns from "dns";
import {resolve} from "path";
import {promisify} from "util";
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

const licensesGeneratorPath = resolve(LICENSES_GENERATOR_PATH);
const communityBranchName = "temp-community";
const prodBranchName = "temp-prod";

export class ReleaseParams {
  public startingBranch: string;
  public prodBomVersion: string;
  public owner: string;
  public repository: string;
  public githubToken: string;
  public context: HandlerContext;
}

// For some reason, on MacOSX we need to use dns.lookup instead of dns.resolve
const dnsFunctionToUse = (process.platform === "darwin" ? dns.lookup : dns.resolve);

export async function ensureVPNAccess(): Promise<Error> {
  try {
    await promisify(dnsFunctionToUse)("indy.psi.redhat.com");
    return null;
  } catch (e) {
    const message = "You must be on the RH VPN to release the boosters";
    logger.error(message);
    return new Error(message);
  }
}

export function releaseBooster(params: ReleaseParams): Promise<EditResult<Project>> {

  logger.debug(`Starting release process for booster ${params.repository}`);

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
                value: params.prodBomVersion,
              })(p3);
            })
            .then(p4 => {
              return licensesGenerator(licensesGeneratorPath)(p4);
            });
  };

  return editBoosterInBranch(params, communityBranchName, communityEditor) // make changes to community version
          // push changes to community version
          .then(pushChanges(communityBranchName, params))
          .then(() => {
            // make changes to prod version
            editBoosterInBranch(params, prodBranchName, prodEditor)
            // push changes to prod version
            .then(pushChanges(prodBranchName, params));
          })
          .then(() => { // bump the version of the booster
            return editOne(params.context,
                {token: params.githubToken},
                bumpMavenProjectRevisionVersion(),
                {
                    branch: params.startingBranch,
                    message: "[booster-release][ci skip] Bump version",
                } as BranchCommit,
                GitHubRepoRef.from({owner: params.owner, repo: params.repository, branch: params.startingBranch}),
            );
          });
}

function editBoosterInBranch(params: ReleaseParams, branchName: string, editor: AnyProjectEditor<any>) {
  return editOne(params.context,
      {token: params.githubToken},
      editor,
      {
        branch: branchName,
        message: "[booster-release][ci skip] Tag booster",
      } as BranchCommit,
      GitHubRepoRef.from({owner: params.owner, repo: params.repository, branch: params.startingBranch}),
  );
}

function pushChanges(branchName: string, params: ReleaseParams): (r: EditResult) => void {

  return async editResult => {
    const project = editResult.target;
    const repo = params.repository;
    if (!editResult.edited) {
      logger.warn(`Booster ${repo} was not updated as part of the release process`);
      logger.warn("This is probably an implementation issue");
      return;
    }

    const tagName = await getCurrentVersion(project);

    logger.debug(`Attempting to create tags for booster ${repo}`);

    const tagCreated = await tagBranch(repo, branchName, tagName, params.githubToken, params.owner);
    if (tagCreated) {
      await deleteBranch(repo, branchName, params.githubToken, params.owner);
    }
  };
}
