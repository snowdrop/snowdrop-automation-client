import { GitHubRepoRef, HandlerContext, logger, Project, SimpleProjectEditor } from "@atomist/automation-client";
import { editAll, editOne } from "@atomist/automation-client/lib/operations/edit/editAll";
import { BranchCommit } from "@atomist/automation-client/lib/operations/edit/editModes";
import { EditResult } from "@atomist/automation-client/lib/operations/edit/projectEditor";
import { allReposInTeam } from "@atomist/sdm";
import {
  BOM_REPO, BOM_VERSION_REGEX, BOOSTER_VERSION_REGEX, SPRING_BOOT_VERSION_PROPERTY_NAME,
} from "../../constants";
import { boosterRepos } from "../repo/boosterRepo";
import { FixedBranchDefaultRepoRefResolver } from "../repo/FixedBranchDefaultRepoRefResolver";
import {
  getCurrentVersion, getCurrentVersionWithoutSnapshot, setParentVersion, setProjectVersion, setProperty,
} from "../utils/pom";
import { bomVersionToSpringBootVersion, versionToBranch, versionToExampleBranch } from "../utils/versions";

export class UpdateParams {
  public bomVersion: string;
  public owner: string;
  public githubToken: string;
  public context: HandlerContext;
}

/**
 * Performs snowdrop-dependency version update in its repository as well as in all example applications.
 */
export function updateBomVersionEverywhere(params: UpdateParams): Promise<EditResult> {
  const exampleBranch = versionToExampleBranch(params.bomVersion);
  const bomBranch = versionToBranch(params.bomVersion);

  logger.debug(`Will attempt to update branch ${bomBranch} of BOM and branch ${exampleBranch} of examples`);

  return editAll(params.context,
    { token: params.githubToken },
    updateExampleParentVersion(params.bomVersion),
    {
      branch: exampleBranch,
      message: `[booster-release] Update BOM to ${params.bomVersion}`,
    } as BranchCommit,
    undefined,
    allReposInTeam(new FixedBranchDefaultRepoRefResolver(exampleBranch)),
    boosterRepos(params.githubToken),
  ).then(() => {
    return editOne(
      params.context,
      { token: params.githubToken },
      updateBomVersion(params.bomVersion),
      {
        branch: bomBranch,
        message: `Bump BOM version [ci skip]`,
      } as BranchCommit,
      GitHubRepoRef.from({ owner: params.owner, repo: BOM_REPO, branch: bomBranch }),
      undefined,
    );
  });
}

/**
 * Updates snowdrop-dependencies version in an example application.
 * If snowdrop-dependencies version revision has changed (e.g. x.x.x.Final > x.x.x.CR1) example application version
 * will stay the same. Otherwise, example application version will be updated accordingly.
 */
export function updateExampleParentVersion(parentVersion: string): SimpleProjectEditor {
  if (!BOM_VERSION_REGEX.test(parentVersion)) {
    logger.warn(`snowdrop-dependencies version ${parentVersion} does not match the expected format`);
    logger.warn(`Examples of valid versions are: 1.5.10.SR2, 1.5.14.Final, 1.5.15.Beta1`);
    return (p: Project) => Promise.resolve(p);
  }

  return async (project: Project) => {
    const currentVersion = await getCurrentVersion(project);
    const newVersion = getNewExampleVersion(parentVersion, currentVersion);
    logger.info(
      `Current version of '${project.name}' is ${currentVersion}. Will update to ${newVersion}`);

    return setProjectVersion(project, newVersion)
      .then(p => setParentVersion(p, parentVersion))
      .then(p => setProperty(p, SPRING_BOOT_VERSION_PROPERTY_NAME, bomVersionToSpringBootVersion(parentVersion)));
  };
}

function getNewExampleVersion(snowdropDependenciesVersion: string, exampleVersion: string): string {
  const snowdropDependenciesVersionNumbers = snowdropDependenciesVersion.match(BOM_VERSION_REGEX)[1];
  const defaultNewVersion = `${snowdropDependenciesVersionNumbers}-1-SNAPSHOT`;
  const exampleVersionRegexMatched = exampleVersion.match(BOOSTER_VERSION_REGEX);
  if (!exampleVersionRegexMatched) {
    logger.info(`Current example version does not match expected version`);
    return defaultNewVersion;
  }

  if (exampleVersionRegexMatched[1] !== snowdropDependenciesVersionNumbers) {
    logger.info(`Current example version corresponds to an old Spring Boot version, so we will update to the new one`);
    return defaultNewVersion;
  }

  logger.info("Example version matches snowdrop-dependencies version so it won't be changed");
  return exampleVersion;
}

/**
 * Updates the version of the snowdrop-dependencies according to the rules in SB-162
 */
export function updateBomVersion(version: string): SimpleProjectEditor {
  const matches = version.match(BOM_VERSION_REGEX);
  if (!matches) {
    logger.warn(`snowdrop-dependencies version ${version} is invalid.`);
    logger.warn("No update to BOM version will be performed");
    return (p: Project) => Promise.resolve(p);
  }

  const qualifier = matches[2];
  if (qualifier.startsWith("Beta")) {
    logger.info(`No need to update ${version}`);
    return (p: Project) => Promise.resolve(p);
  }

  return async p => {
    const currentVersion = await getCurrentVersionWithoutSnapshot(p);
    return setProjectVersion(p, `${currentVersion}${getNewQualifier(qualifier)}-SNAPSHOT`);
  };
}

function getNewQualifier(qualifier: string): string {
  if (qualifier === "Final") {
    return ".SP1";
  } else if (qualifier.startsWith("SP")) {
    return `.SP${Number(qualifier.substr(2)) + 1}`;
  }
  logger.warn(`Unexpected qualifier '${qualifier}' will be ignored`);
  return "";
}
