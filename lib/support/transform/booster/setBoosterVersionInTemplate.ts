import {SimpleProjectEditor} from "@atomist/automation-client";
import {doWithFiles} from "@atomist/automation-client/lib/project/util/projectUtils";
import {getCurrentVersion} from "../../utils/pomUtils";

/**
 * Set the current booster version in the Openshift template files
 */
export function setBoosterVersionInTemplate(): SimpleProjectEditor {
  return async project => {
    const version = await getCurrentVersion(project);

    return doWithFiles(project, "**/.openshiftio/application.y*ml",
        async m => {
          const initialTemplateContent = await m.getContent();
          await m.setContent(initialTemplateContent.replace(
              new RegExp("BOOSTER_VERSION", "g"), version),
          );
        });
  };
}
