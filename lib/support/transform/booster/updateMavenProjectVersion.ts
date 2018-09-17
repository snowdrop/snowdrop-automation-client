import {BOOSTER_VERSION_REGEX} from "../../../constants";
import {getCurrentVersion, getCurrentVersionWithoutSnapshot} from "../../utils/pomUtils";
import {doWithAllMatches, logger, Project, SimpleProjectEditor} from "@atomist/automation-client";
import {XmldocFileParser} from "@atomist/sdm-pack-spring/lib/xml/XmldocFileParser";

/**
 * Update the version of a Maven project to the version specified
 *
 */
export function updateMavenProjectVersion(newVersion: string): SimpleProjectEditor {
  return (p: Project) => {
    return doWithAllMatches(p, new XmldocFileParser(),
        "pom.xml",
        "/project/version",
        n => {
          n.$value = `<version>${newVersion}</version>`
        }).then((p2: Project) => {
            return doWithAllMatches(p2, new XmldocFileParser(),
                "*/pom.xml",
                "/project/parent/version",
                n => {
                  n.$value = `<version>${newVersion}</version>`;
            })
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
