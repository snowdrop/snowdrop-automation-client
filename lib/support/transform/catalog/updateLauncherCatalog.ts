import {HandlerContext, logger, Project, SimpleProjectEditor} from "@atomist/automation-client";
import {relevantRepos} from "@atomist/automation-client/lib/operations/common/repoUtils";
import {allReposInTeam} from "@atomist/sdm";
import {DefaultRepoRefResolver} from "@atomist/sdm-core";
import {updateYamlKey} from "@atomist/yaml-updater/Yaml";
import * as yaml from "js-yaml";
import {REDHAT_QUALIFIER} from "../../../constants";
import {LatestTagRetriever} from "../../github/boosterUtils";
import {boosterRepos, boosterSimpleName} from "../../repo/boosterRepo";

const projectPath = "spring-boot";

const boosterCatalogConfigurationFile = "booster.yaml";

/**
 * Editor for updating the launcher-booster-catalog
 * with the latest booster tags
 */
export function updateLauncherCatalog(context: HandlerContext,
                                      latestTagRetriever: LatestTagRetriever,
                                      sbVersion: string,
                                      token?: string): SimpleProjectEditor {

  const namePrefix = getAppropriateNamePrefixForSpringBootVersion(sbVersion);
  const communityCatalogPath = `${projectPath}/${namePrefix}-community`;
  const prodCatalogPath = `${projectPath}/${namePrefix}-redhat`;
  return async project => {
    const boosterRepoRefs =
        await relevantRepos(context, allReposInTeam(new DefaultRepoRefResolver()), boosterRepos(token));

    for (const boosterRepoRef of boosterRepoRefs) {
      const boosterFullName = boosterRepoRef.repo;
      const latestTags =
          await latestTagRetriever.getLatestTags(boosterFullName, t => t.startsWith(sbVersion), token);

      for (const path of [communityCatalogPath, prodCatalogPath]) {
        const boosterNameInCatalog = getBoosterNameInCatalog(boosterFullName);
        logger.debug(`Attempt to match '${boosterNameInCatalog}' in path '${path}'`);
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

function getAppropriateNamePrefixForSpringBootVersion(sbVersion: string): string {
  return sbVersion.startsWith("1.5") ? "previous" : "current";
}

// Maps the full name of the booster as found in the GitHub URL
// to the name that is used in the booster catalog
// needed because the names don't always match
function getBoosterNameInCatalog(boosterFullName: string) {
  const simpleName =  boosterSimpleName(boosterFullName);
  switch (simpleName) {
    case "secured":
      return "rest-http-secured";
    case "messaging-work-queue":
      return "messaging";
    default:
      return simpleName;
  }
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
    const namePrefix = getAppropriateNamePrefixForSpringBootVersion(sbVersion);
    sbVersions.forEach(v => {
      if (v.id === `${namePrefix}-community`) {
        v.name = `${sbVersion}.RELEASE (Community)`;
      } else if (v.id === `${namePrefix}-redhat`) {
        v.name = `${sbVersion}.RELEASE (RHOAR)`;
      }
    });
  });

  const newContent = updateYamlKey("runtimes", runtimes, contentStr, {keepArrayIndent: true, updateAll: false});
  await file.setContent(newContent);
}
