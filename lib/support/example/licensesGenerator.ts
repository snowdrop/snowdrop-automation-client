import {isLocalProject, logger, Project, SimpleProjectEditor} from "@atomist/automation-client";
import { spawn } from "child_process";

export default function licensesGenerator(generatorPath: string): SimpleProjectEditor {
    return async project => {
        if (!isLocalProject(project)) {
            logger.warn("Cannot generate licenses for non-local project");
            return project;
        }

        const propertiesPath =
            generatorPath.replace("licenses-generator-shaded.jar", "generator.properties");
        const aliasesPath =
            generatorPath.replace("licenses-generator-shaded.jar", "rh-license-names.json");
        const exceptionsPath =
            generatorPath.replace("licenses-generator-shaded.jar", "rh-license-exceptions.json");

        return project.findFile("pom.xml")
            .then(pom => {
                // tslint:disable-next-line: max-line-length
                logger.info(`Starting license generation with '${generatorPath}' for '${pom.path}' with properties at '${propertiesPath}'`);
                return spawn(
                    "java",
                    // tslint:disable-next-line: max-line-length
                    ["-jar", generatorPath, `-Dpom=${pom.path}`, "-Ddestination=src/licenses", `-DgeneratorProperties=${propertiesPath}`, `-DaliasesFile=${aliasesPath}`, `-DexceptionsFile=${exceptionsPath}`],
                    { cwd: project.baseDir, stdio: "inherit" },
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
