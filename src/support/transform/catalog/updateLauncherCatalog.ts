import {HandlerContext, logger} from "@atomist/automation-client";
import {relevantRepos} from "@atomist/automation-client/operations/common/repoUtils";
import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {updateYamlKey} from "@atomist/yaml-updater/Yaml";
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

        const value = {
          git: {
            ref: latestTag,
          },
        };
        logger.info(`Updating booster ${boosterNameInCatalog} in path ${path} with tag ${latestTag}`);
        const newContent = updateYamlKey("source", value, matchingConfigFileContent);
        await matchingConfigFile.setContent(newContent);
      }
    }

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
