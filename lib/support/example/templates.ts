import {SimpleProjectEditor} from "@atomist/automation-client";
import {doWithFiles} from "@atomist/automation-client/lib/project/util/projectUtils";
import {getCurrentVersion} from "../utils/pom";

export function setTemplateVariables(springBootVersion: string): SimpleProjectEditor {
  return async project => {
    const projectVersion = await getCurrentVersion(project);

    return doWithFiles(project, "**/.openshiftio/application.y*ml",
        async m => m.getContent()
            .then(content => content.replace(new RegExp("BOOSTER_VERSION", "g"), projectVersion))
            .then(content => content.replace(new RegExp("SPRING_BOOT_VERSION", "g"), springBootVersion))
            .then(content => m.setContent(content)),
    );
  };
}
