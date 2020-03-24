import {InMemoryProject, Project} from "@atomist/automation-client";
import {expect} from "chai";
import * as parser from "xml2json";
import {getCommunityEditor, getProdEditor, getVersionBumpEditor} from "../../../lib/support/example/release";

describe("getCommunityEditor", () => {
  it("should release an example", async () => {
    const project = createProject("2.2.5.Final", "2.2.5-1-SNAPSHOT");
    await getCommunityEditor("2.2.5.RELEASE")(project);
    assertReleasedProject(project, "2.2.5.RELEASE", "2.2.5.Final", "2.2.5-1");
  });
});

describe("getProdEditor", () => {
  it("should release an example", async () => {
    const project = createProject("2.2.5.Final", "2.2.5-1-SNAPSHOT");
    await getProdEditor("2.2.5.RELEASE", "2.2.5.Final-redhat-00001")(project);
    assertReleasedProject(project, "2.2.5.RELEASE", "2.2.5.Final-redhat-00001", "2.2.5-1-redhat");
  });
});

describe("getVersionBumpEditor", () => {
  it("should bump an example version", async () => {
    const project = createProject("2.2.5.Final", "2.2.5-1-SNAPSHOT");
    await getVersionBumpEditor()(project);

    const parentPom: any = parser.toJson(project.findFileSync("pom.xml").getContentSync(), {object: true});
    const childPom: any = parser.toJson(project.findFileSync("child/pom.xml").getContentSync(), {object: true});
    expect(parentPom.project.version).to.be.equal("2.2.5-2-SNAPSHOT");
    expect(childPom.project.parent.version).to.be.equal("2.2.5-2-SNAPSHOT");
  });
});

function assertReleasedProject(project: Project, springBootVersion: string, parentVersion: string,
                               projectVersion: string) {
  const parentPom: any = parser.toJson(project.findFileSync("pom.xml").getContentSync(), {object: true});
  const childPom: any = parser.toJson(project.findFileSync("child/pom.xml").getContentSync(), {object: true});

  expect(parentPom.project.parent.version).to.be.equal(parentVersion);
  expect(parentPom.project.version).to.be.equal(projectVersion);
  expect(childPom.project.parent.version).to.be.equal(projectVersion);

  const actualTemplate = project.findFileSync(".openshiftio/application.yml").getContentSync();
  const expectedTemplate = getOpenShiftTemplate()
      .replace("BOOSTER_VERSION", projectVersion)
      .replace("SPRING_BOOT_VERSION", springBootVersion);
  expect(actualTemplate).to.be.equal(expectedTemplate);
}

function createProject(parentVersion: string, projectVersion: string) {
  return InMemoryProject.of(
      {path: "pom.xml", content: getParentPomContent(parentVersion, projectVersion)},
      {path: ".openshiftio/application.yml", content: getOpenShiftTemplate()},
      {path: "child/pom.xml", content: getChildPomContent(projectVersion)},
  );
}

/* tslint:disable */
function getParentPomContent(parentVersion: string, projectVersion: string): string {
  return `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>dev.snowdrop</groupId>
    <artifactId>snowdrop-dependencies</artifactId>
    <version>${parentVersion}</version>
  </parent>
  <artifactId>example-parent</artifactId>
  <version>${projectVersion}</version>
  <modules>
	  <module>child</module>
	</modules>
</project>`;
}

function getChildPomContent(projectVersion: string): string {
  return `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <artifactId>example-parent</artifactId>
  <version>${projectVersion}</version>
  </parent>
  <artifactId>example-child</artifactId>
</project>`;
}

function getOpenShiftTemplate(): string {
  return "booster: BOOSTER_VERSION, spring-boot: SPRING_BOOT_VERSION";
}