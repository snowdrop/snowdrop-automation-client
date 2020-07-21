import {GitHubRepoRef, HandlerContext, logger, Project} from "@atomist/automation-client";
import {editOne} from "@atomist/automation-client/lib/operations/edit/editAll";
import {BranchCommit} from "@atomist/automation-client/lib/operations/edit/editModes";
import {EditResult, SimpleProjectEditor} from "@atomist/automation-client/lib/operations/edit/projectEditor";
import {resolve} from "path";
import {LICENSES_GENERATOR_PATH, REDHAT_QUALIFIER} from "../../constants";
import {deleteBranch, tagBranch} from "../github/refUtils";
import {getCurrentVersion, getCurrentVersionWithoutSnapshot, setParentVersion, setProjectVersion} from "../utils/pom";
import {getNextExampleVersion} from "../utils/versions";
import licensesGenerator from "./licensesGenerator";
import {setTemplateVariables} from "./templates";

const licensesGeneratorPath = resolve(LICENSES_GENERATOR_PATH);
const tagCommitMessage = "[booster-release][ci skip] Tag example";
const versionBumpCommitMessage = "[booster-release][ci skip] Bump version";

export class ReleaseParams {
  public startingBranch: string;
  public springBootVersion: string;
  public prodBomVersion: string;
  public owner: string;
  public repository: string;
  public githubToken: string;
  public context: HandlerContext;
}

export async function releaseExample(params: ReleaseParams): Promise<void> {
  logger.debug(`Starting release process for ${params.repository}`);
  const tempCommunityBranch = "temp-community-" + new Date().getTime();
  const tempProdBranch = "temp-prod-" + new Date().getTime();

  await tag(params, tempCommunityBranch, getCommunityEditor(params.springBootVersion));
  await tag(params, tempProdBranch, getProdEditor(params.springBootVersion, params.prodBomVersion));

  await editInBranch(params, params.startingBranch, versionBumpCommitMessage, getVersionBumpEditor());
}

export function getCommunityEditor(springBootVersion: string): SimpleProjectEditor {
  return (project: Project) => getCurrentVersionWithoutSnapshot(project)
      .then(version => setProjectVersion(project, version))
      .then(p => setTemplateVariables(springBootVersion)(p))
      .then(p => licensesGenerator(licensesGeneratorPath)(p));
}

export function getProdEditor(springBootVersion: string, bomVersion: string): SimpleProjectEditor {
  return (project: Project) => getCurrentVersionWithoutSnapshot(project)
      .then(version => setProjectVersion(project, `${version}-${REDHAT_QUALIFIER}`))
      .then(p => setParentVersion(p, bomVersion))
      .then(p => setTemplateVariables(springBootVersion)(p))
      .then(p => licensesGenerator(licensesGeneratorPath)(p));
}

export function getVersionBumpEditor(): SimpleProjectEditor {
  return (project: Project) => getCurrentVersion(project)
      .then(version => getNextExampleVersion(version))
      .then(version => setProjectVersion(project, version));
}

async function tag(params: ReleaseParams, branch: string, editor: SimpleProjectEditor): Promise<void> {
  const editResult = await editInBranch(params, branch, tagCommitMessage, editor);
  if (!editResult.edited) {
    logger.warn(`Example ${params.repository} was not updated as part of the release process`);
    logger.warn("This is probably an implementation issue");
    return;
  }

  const tagName = await getCurrentVersion(editResult.target);
  const tagCreated = await tagBranch(params.repository, branch, tagName, params.githubToken, params.owner);
  if (tagCreated) {
    await deleteBranch(params.repository, branch, params.githubToken, params.owner);
  }
}

function editInBranch(params: ReleaseParams, commitBranch: string, commitMessage: string, editor: SimpleProjectEditor):
    Promise<EditResult> {
  return editOne(
      params.context,
      {token: params.githubToken},
      editor,
      {
        branch: commitBranch,
        message: commitMessage,
      } as BranchCommit,
      GitHubRepoRef.from({owner: params.owner, repo: params.repository, branch: params.startingBranch}),
  );
}
