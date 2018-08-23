import {HandlerContext, logger} from "@atomist/automation-client";
import {relevantRepos} from "@atomist/automation-client/operations/common/repoUtils";
import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {Project} from "@atomist/automation-client/project/Project";
import {updateYamlKey} from "@atomist/yaml-updater/Yaml";
import * as yaml from "js-yaml";
import {REDHAT_QUALIFIER} from "../../../constants";
import {LatestTagRetriever} from "../../github/boosterUtils";
import {allReposInTeam} from "../../repo/allReposInTeamRepoFinder";
import {boosterRepos, boosterSimpleName} from "../../repo/boosterRepo";

const projectPath = "spring-boot";
const communityCatalogPath = `${projectPath}/current-community`;
const prodCatalogPath = `${projectPath}/current-redhat`;
const boosterCatalogConfigurationFile = "booster.yaml";

const allCatalogPaths = [communityCatalogPath, prodCatalogPath];

/**
 * Editor for updating the launcher-booster-catalog
 * with the latest booster tags
 */
export function updateLauncherCatalog(context: HandlerContext,
                                      latestTagRetriever: LatestTagRetriever,
                                      sbVersion: string,
                                      token?: string): SimpleProjectEditor {
  return async project => {
    const boosterRepoRefs = await relevantRepos(context, allReposInTeam(), boosterRepos(token));

    for (const boosterRepoRef of boosterRepoRefs) {
      const boosterFullName = boosterRepoRef.repo;
      const latestTags =
          await latestTagRetriever.getLatestTags(boosterFullName, t => t.startsWith(sbVersion), token);

      for (const path of allCatalogPaths) {
        const boosterNameInCatalog = getBoosterNameInCatalog(boosterFullName);
        const matchingConfigFile =
            await project.getFile(`${path}/${boosterNameInCatalog}/${boosterCatalogConfigurationFile}`);

        if (!matchingConfigFile) {
          logger.debug(`No configuration file found for booster '${boosterFullName}' in path '${path}'`);
          continue;
        }

        const matchingConfigFileContent = await matchingConfigFile.getContent();
        const latestTag =
            path.includes(REDHAT_QUALIFIER) ? latestTags.prod : latestTags.community;

        if (!latestTag) {
          /* tslint:disable */
          logger.debug(`Booster ${boosterNameInCatalog} does not have any matching tags for Spring Boot version '${sbVersion}'`);
          /* tslint:enable */
          break;
        }

        const newSourceValue = {
          git: {
            ref: latestTag,
          },
        };
        logger.info(`Updating booster ${boosterNameInCatalog} in path ${path} with tag ${latestTag}`);
        const newContent = updateYamlKey("source", newSourceValue, matchingConfigFileContent);
        await matchingConfigFile.setContent(newContent);
      }
    }

    await updateMetadataFile(project, sbVersion);

    return project;
  };
}

// Maps the full name of the booster as found in the GitHub URL
// to the name that is used in the booster catalog
// needed because the names don't always match
function getBoosterNameInCatalog(boosterFullName: string) {
  const simpleName =  boosterSimpleName(boosterFullName);
  if (["http", "http-secured"].includes(simpleName)) {
    return `rest-${simpleName}`;
  }
  return simpleName;
}

async function updateMetadataFile(project: Project, sbVersion: string) {
  const file = await project.getFile("metadata.yaml");
  if (!file) {
    return;
  }

  const contentStr = await file.getContent();
  const content = yaml.load(contentStr);
  const runtimes = content.runtimes as any[];
  runtimes.forEach(rt => {
    if (rt.id !== "spring-boot") {
      return;
    }

    const sbVersions = rt.versions as any[];
    sbVersions.forEach(v => {
      if (v.id === "current-community") {
        v.name = `${sbVersion}.RELEASE (Community)`;
      } else if (v.id === "current-redhat") {
        v.name = `${sbVersion}.RELEASE (RHOAR)`;
      }
    });
  });

  const newContent = updateYamlKey("runtimes", runtimes, contentStr, {keepArrayIndent: true, updateAll: false});
  await file.setContent(newContent);
}
