import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {getCurrentVersion} from "../utils/pomUtils";
import {doWithFiles} from "@atomist/automation-client/project/util/projectUtils";

/**
 * Set the current booster version in the Openshift template files
 */
export function setBoosterVersionWithoutSnapshotInTemplate(): SimpleProjectEditor {
  return async project => {
    const version = await getCurrentVersion(project);

    return doWithFiles(project, "**/.openshiftio/application.y*ml",
        async m => {
          const initialTemplateContent = await m.getContent();
          await m.setContent(initialTemplateContent.replace(
              "BOOSTER_VERSION", version.replace("-SNAPSHOT", ""))
          );
        });
  };
}
