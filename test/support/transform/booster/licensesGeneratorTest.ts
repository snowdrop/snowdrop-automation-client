import { expect } from "chai";
import { resolve } from "path";
import { tempdir } from "shelljs";
import { LICENSES_GENERATOR_PATH } from "../../../../lib/constants";
import licensesGenerator from "../../../../lib/support/transform/booster/licensesGenerator";
import {InMemoryProject, NodeFsLocalProject, Project} from "@atomist/automation-client";

describe("licensesGenerator", () => {
    it("genereate licenses", () => {
        const inMemoryProject = createInMemoryProject();
        const generator = licensesGenerator(licensesGeneratorPath);

        return NodeFsLocalProject.copy(inMemoryProject, tempdir())
            .then(project => generator(project))
            .then(project => project.findFile(licensesXmlPath))
            .then(file => file.getContent())
            .then(content => expect(content).to.contain("<dependencies/>"));
    });

    it("update licenses", () => {
        const inMemoryProject = createInMemoryProject();
        const generator = licensesGenerator(licensesGeneratorPath);

        return inMemoryProject.addFile(licensesXmlPath, "test")
            .then(project => NodeFsLocalProject.copy(project, tempdir()))
            .then(project => generator(project))
            .then(project => project.findFile(licensesXmlPath))
            .then(file => file.getContent())
            .then(content => expect(content).to.contain("<dependencies/>").and.not.to.contain("test"));
    });
});

const createInMemoryProject = (): Project => {
    return InMemoryProject.from(
        { repo: "test-project", owner: "test", url: "dummy" },
        { path: "pom.xml", content: pomContent },
    );
};

const licensesGeneratorPath = resolve(LICENSES_GENERATOR_PATH);
const licensesXmlPath = "src/licenses/licenses.xml";
/* tslint:disable */
const pomContent = `
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>test</groupId>
    <artifactId>test</artifactId>
    <version>1</version>
</project>
`;
