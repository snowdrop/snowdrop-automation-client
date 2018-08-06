import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {File} from "@atomist/automation-client/project/File";
import {doWithFiles} from "@atomist/automation-client/project/util/projectUtils";

import * as parser from "xml2json";

/**
 * Update the version of a Maven project
 *
 * TODO fix implementation: this only updates the parent pom (and not always correctly)
 */
export function updateMavenProjectVersionEditor(version: string): SimpleProjectEditor {
  return p => {
    return doWithFiles(p, "pom.xml",
         m => {
           doUpdateVersion(m, version, (pomAJsonObj => pomAJsonObj.project.version));
        }).then(p2 => {
            return doWithFiles(p2, "*/pom.xml",
             m => {
               doUpdateVersion(m, version, (pomAJsonObj => pomAJsonObj.project.parent.version));
            });
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
