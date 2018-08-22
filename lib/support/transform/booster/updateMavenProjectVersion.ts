import {logger} from "@atomist/automation-client/internal/util/logger";
import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {File} from "@atomist/automation-client/project/File";
import {doWithFiles} from "@atomist/automation-client/project/util/projectUtils";

import {Project} from "@atomist/automation-client/project/Project";
import * as parser from "xml2json";
import {BOOSTER_VERSION_REGEX} from "../../../constants";
import {getCurrentVersion, getCurrentVersionWithoutSnapshot} from "../../utils/pomUtils";

/**
 * Update the version of a Maven project to the version specified
 *
 */
export function updateMavenProjectVersion(version: string): SimpleProjectEditor {
  return p => {
    return doWithFiles(p, "pom.xml",
         m => {
           return doUpdateVersion(m, version, (pomAJsonObj => pomAJsonObj.project.version));
        }).then(p2 => {
            return doWithFiles(p2, "*/pom.xml",
             m => {
               return doUpdateVersion(m, version, (pomAJsonObj => pomAJsonObj.project.parent.version));
            });
    });
  };
}

export function bumpMavenProjectRevisionVersion(): SimpleProjectEditor {
  return (p: Project) => {
    return getCurrentVersion(p).then(v => {
      const matches = v.match(BOOSTER_VERSION_REGEX);
      if (!matches) {
        logger.warn(`Booster version ${v} is not valid`);
        return p;
      }
      const currentRevision = matches[2];
      const newRevision = Number(currentRevision) + 1;
      const qualifier = matches[3] ? matches[3] : "";
      return updateMavenProjectVersion(`${matches[1]}-${newRevision}${qualifier}`)(p);
    });
  };
}

export function removeSnapshotFromMavenProjectVersion(): SimpleProjectEditor {
  return (p: Project) => {
    return getCurrentVersionWithoutSnapshot(p).then(v => {
      return updateMavenProjectVersion(v)(p);
    });
  };
}

export function replaceSnapshotFromMavenProjectVersionWithQualifier(qualifier: string): SimpleProjectEditor {
  return (p: Project) => {
    return getCurrentVersionWithoutSnapshot(p).then(v => {
      return updateMavenProjectVersion(`${v}-${qualifier}`)(p);
    });
  };
}

async function doUpdateVersion(m: File, version: string, versionExtractor: (obj: any) => string) {
  const initialContent = await m.getContent();
  const pomAJsonObj = parser.toJson(initialContent, {object: true});
  const oldVersion = versionExtractor(pomAJsonObj);
  const regex = new RegExp(`<version>${oldVersion}<\/version>`, "g");
  const finalContent = initialContent.replace(regex, `<version>${version}</version>`);
  await m.setContent(finalContent);
}
