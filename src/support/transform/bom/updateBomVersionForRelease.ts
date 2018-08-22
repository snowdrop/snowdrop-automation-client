import {logger} from "@atomist/automation-client/internal/util/logger";
import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {Project} from "@atomist/automation-client/project/Project";
import {BOM_VERSION_REGEX} from "../../../constants";
import {getCurrentVersionWithoutSnapshot} from "../../utils/pomUtils";
import {updateMavenProjectVersion} from "../booster/updateMavenProjectVersion";

/**
 * Updates the version of the BOM according to the rules in SB-162
 */
export function updateBomVersionForRelease(releasedVersion: string): SimpleProjectEditor {
  const releasedVersionMatches = releasedVersion.match(BOM_VERSION_REGEX);
  if (!releasedVersionMatches) {
    logger.warn(`Released BOM version ${releasedVersion} does not match expected Regex ${BOM_VERSION_REGEX}`);
    logger.warn("No update to BOM version will be performed");
    return (p: Project) => Promise.resolve(p);
  }

  const releasedVersionQualifier = releasedVersionMatches[2];
  if (releasedVersionQualifier.startsWith("Beta")) {
    logger.info(`No update to BOM version needed for release version ${releasedVersion}`);
    return (p: Project) => Promise.resolve(p);
  }

  return async p => {
    const currentVersion = await getCurrentVersionWithoutSnapshot(p);

    return updateMavenProjectVersion(
        `${currentVersion}${calculateNewQualifier(releasedVersionQualifier)}-SNAPSHOT`)(p);
  };

}

function calculateNewQualifier(releasedVersionQualifier: string): string {
  if (releasedVersionQualifier === "Final") {
    return ".SP1";
  } else if (releasedVersionQualifier.startsWith("SP")) {
    return `.SP${Number(releasedVersionQualifier.substr(2)) + 1}`;
  }

  /* tslint:disable */
  logger.warn(`Qualifier '${releasedVersionQualifier}' of release is unexpected and therefore the BOM version will not be changed`);
  return "";
}
