import {logger} from "@atomist/automation-client/internal/util/logger";
import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import axios from "axios";
import {Project} from "../../../../node_modules/@atomist/automation-client/project/Project";
import {BOOSTER_SB_PROPERTY_NAME, UPSTREAM_RELEASE_VERSION_REGEX} from "../../../constants";
import {calculateNewPropertyVersions} from "../../utils/bomUtils";
import {updateMavenProjectVersion} from "./updateMavenProjectVersion";
import {NameValuePair, updateMavenProperty} from "./updateMavenProperty";

// these are properties that for policy reasons we don't expect to follow the upstream
// values
const PROPERTIES_THAT_SHOULD_NOT_BE_AUTO_UPDATED = [
    "hibernate.version",
    "hibernate-validator.version",
];

/**
 * Updates our BOM with the updated properties of the upstream BOM
 */
export function updateBomFromUpstream(upstreamVersion: string): SimpleProjectEditor {
  const upstreamVersionMatches = upstreamVersion.match(UPSTREAM_RELEASE_VERSION_REGEX);
  if (!upstreamVersionMatches) {
    logger.warn(`The supplied upstream version '${upstreamVersion}' is invalid`);
    logger.warn("An example of a correct version is: '1.5.15.RELEASE'");
    return (p: Project) => Promise.reject(`Invalid upstream version: '${upstreamVersion}'`);
  }

  return async project => {
    const existingBomFile = await project.getFile("pom.xml");
    const existingBomContent = await existingBomFile.getContent();

    try {
      const axiosResponse =
          /* tslint:disable */
          await axios
                  .get(`https://raw.githubusercontent.com/spring-projects/spring-boot/v${upstreamVersion}/spring-boot-dependencies/pom.xml`);
          /* tslint:enable */

      if (axiosResponse.status !== 200) {
        logger.warn(`No BOM could be fetched from GitHub for upstream version '${upstreamVersion}'`);
        return Promise.reject(`Non-existent upstream version: '${upstreamVersion}'`);
      }

      const propertiesUpdates = calculateNewPropertyVersions(axiosResponse.data, existingBomContent);
      logger.info(`Will update the following properties based on upstream BOM ${upstreamVersion}`);
      logger.info(JSON.stringify([...propertiesUpdates]));

      const nameValuePairs: NameValuePair[] =
          Array
            .from(propertiesUpdates)
            .map(t => ({name: t[0], value: t[1]}))
            .filter(p => !PROPERTIES_THAT_SHOULD_NOT_BE_AUTO_UPDATED.some(v => v === p.name));
      nameValuePairs.push({name: BOOSTER_SB_PROPERTY_NAME, value: upstreamVersion});

      const p2 = await updateMavenProperty(...nameValuePairs)(project);

      return await updateMavenProjectVersion(`${upstreamVersionMatches[1]}-SNAPSHOT`)(p2);
    } catch (e) {
      logger.error("Update to update BOM");
      return Promise.reject(e);
    }
  };
}
