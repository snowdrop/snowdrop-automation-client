import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {doWithFiles} from "@atomist/automation-client/project/util/projectUtils";
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
              "BOOSTER_VERSION", version),
          );
        });
  };
}
