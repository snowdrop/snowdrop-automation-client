import {logger} from "@atomist/automation-client/internal/util/logger";
import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {Project} from "@atomist/automation-client/project/Project";
import axios from "axios";
import {BOOSTER_SB_PROPERTY_NAME, UPSTREAM_RELEASE_VERSION_REGEX} from "../../../constants";
import {calculateNewPropertyVersions} from "../../utils/bomUtils";
import {updateMavenProjectVersion} from "../booster/updateMavenProjectVersion";
import {NameValuePair, updateMavenProperty} from "../booster/updateMavenProperty";

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

      const propertiesUpdates =
          new Map(
              calculateNewPropertyVersions(
                axiosResponse.data, existingBomContent, PROPERTIES_THAT_SHOULD_NOT_BE_AUTO_UPDATED),
          );
      propertiesUpdates.set(BOOSTER_SB_PROPERTY_NAME, upstreamVersion);

      logger.info(`Will update the following properties based on upstream BOM ${upstreamVersion}`);
      logger.info(JSON.stringify([...propertiesUpdates]));

      const nameValuePairs: NameValuePair[] =
          Array
            .from(propertiesUpdates)
            .map(t => ({name: t[0], value: t[1]}));

      const p2 = await updateMavenProperty(...nameValuePairs)(project);

      // update README
      const existingReadme = await project.getFile("README.adoc");
      const existingReadmeContent = await existingReadme.getContent();
      const newReadmeContent = updateReadme(existingReadmeContent, propertiesUpdates);
      await existingReadme.setContent(newReadmeContent);

      return await updateMavenProjectVersion(`${upstreamVersionMatches[1]}-SNAPSHOT`)(p2);
    } catch (e) {
      logger.error("Failed to update BOM");
      return Promise.reject(e);
    }
  };
}

function updateReadme(readme: string, propertiesUpdates: ReadonlyMap<string, string>): string {
    const strings = readme.split("\n");
    const result = strings;
    let targetProperty: string;
    strings.forEach((line, index) => {
        let toAppend = line;
        if (line.startsWith("//")) {
            // if line is a comment, record the name of the property to use
            targetProperty = line.slice(2).trim();
        } else if (targetProperty) {
            // if we have previously set property (i.e. the previous line was a comment)
            // check if it matches a property that was updated in the BOM
            const version = propertiesUpdates.get(targetProperty + ".version");
            if (version) {
                // if it is an updated property, replace the end of the line after the last ':' with the new version
                const lastColumn = line.lastIndexOf(":");
                toAppend = line.slice(0, lastColumn) + `: ${version}`;
            }
            // reset the property state
            targetProperty = undefined;
        }

        result[index] = toAppend;
    });
    
    return result.join("\n");
}
