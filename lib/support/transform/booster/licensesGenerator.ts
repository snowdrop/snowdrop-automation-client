import { logger } from "@atomist/automation-client";
import { SimpleProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { isLocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { Project } from "@atomist/automation-client/project/Project";
import { spawn } from "child_process";

export default function licensesGenerator(generatorPath: string): SimpleProjectEditor {
    return async project => {
        if (!isLocalProject(project)) {
            throw new Error("Can only generate licenses for local project");
        }

        return project.findFile("pom.xml")
            .then(pom => {
                logger.info(`Starting license generation with '${generatorPath}' for '${pom.path}'`);
                return spawn(
                    "java",
                    ["-jar", generatorPath, "-Dpom=" + pom.path, "-Ddestination=src/licenses"],
                    { cwd: project.baseDir },
                );
            })
            .then(process => new Promise<Project>((resolve, reject) => {
                process.on("error", error => {
                    logger.warn(`Failed to generate licenses: ${error}`);
                    reject(error);
                });
                process.on("exit", () => {
                    logger.info("Completed licenses generation");
                    resolve(project);
                });
            }));
    };
}
