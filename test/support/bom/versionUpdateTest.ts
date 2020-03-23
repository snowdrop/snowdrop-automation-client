import {InMemoryProject, Project} from "@atomist/automation-client";
import {expect} from "chai";
import * as parser from "xml2json";
import {updateBomVersion, updateExampleParentVersion} from "../../../lib/support/bom/versionUpdate";

describe("updateExampleParentVersion", () => {
  const ORIGINAL_PROJECT_VERSION = "2.2.5-1-SNAPSHOT";
  const ORIGINAL_SNOWDROP_DEPENDENCIES_VERSION = "2.2.5.Final";

  it("ignore wrong snowdrop-dependencies version", done => {
    const project = createProject();
    updateExampleParentVersion("1")(project)
        .then(r => assertProject(project, ORIGINAL_PROJECT_VERSION, ORIGINAL_SNOWDROP_DEPENDENCIES_VERSION))
        .then(done, done);
  });

  it("update booster with a new snowdrop-dependencies version", done => {
    const project = createProject();
    updateExampleParentVersion("2.2.6.Final")(project)
        .then(r => assertProject(project, "2.2.6-1-SNAPSHOT", "2.2.6.Final"))
        .then(done, done);
  });

  it("update booster to a revision of a snowdrop-dependencies version", done => {
    const project = createProject();
    updateExampleParentVersion("2.2.5.SR1")(project)
        .then(r => assertProject(project, ORIGINAL_PROJECT_VERSION, "2.2.5.SR1"))
        .then(done, done);
  });

  function assertProject(project: Project, projectVersion: string, snowdropDependenciesVersion: string) {
    const parentPomContent = project.findFileSync("pom.xml").getContentSync();
    const parentPom = parser.toJson(parentPomContent, {object: true}) as any;
    expect(parentPom.project.parent.version).to.be.equal(snowdropDependenciesVersion);
    expect(parentPom.project.version).to.be.equal(projectVersion);

    const childPomContent = project.findFileSync("child/pom.xml").getContentSync();
    const childPom = parser.toJson(childPomContent, {object: true}) as any;
    expect(childPom.project.parent.version).to.be.equal(projectVersion);
  }

  function createProject() {
    return InMemoryProject.from(
        {repo: "test-project", owner: "test", url: "dummy"},
        {path: "pom.xml", content: PomWithParent},
        {path: "child/pom.xml", content: PomOfSubModule},
    );
  }

  /* tslint:disable */
  const PomWithParent = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>dev.snowdrop</groupId>
    <artifactId>snowdrop-dependencies</artifactId>
    <version>${ORIGINAL_SNOWDROP_DEPENDENCIES_VERSION}</version>
  </parent>
  <artifactId>parent</artifactId>
  <version>${ORIGINAL_PROJECT_VERSION}</version>
  <packaging>pom</packaging>
	<modules>
	  <module>child</module>
	</modules>
</project>`;

  const PomOfSubModule = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
		<groupId>dev.snowdrop</groupId>
		<artifactId>parent</artifactId>
    <version>${ORIGINAL_PROJECT_VERSION}</version>
	</parent>
  <artifactId>child</artifactId>
</project>`;
});

describe("updateBomVersion", () => {
  const ORIGINAL_VERSION = "2.2.5-SNAPSHOT";

  it("Invalid release should not result in a any change to version", async () => {
    await testWithReleasedVersion("2.2.5.Dummy", ORIGINAL_VERSION);
  });

  it("Beta release should not result in a any change to version", async () => {
    await testWithReleasedVersion("2.2.5.Beta2", ORIGINAL_VERSION);
  });

  it("Final release should result in using SP1", async () => {
    await testWithReleasedVersion("2.2.5.Final", "2.2.5.SP1-SNAPSHOT");
  });

  it("SP2 release should result in using SP3", async () => {
    await testWithReleasedVersion("2.2.5.SP2", "2.2.5.SP3-SNAPSHOT");
  });

  async function testWithReleasedVersion(releasedVersion: string, expectedNewVersion: string) {
    const project = InMemoryProject.of(
        {path: "pom.xml", content: POM},
    );
    await updateBomVersion(releasedVersion)(project);
    const pomJson = parser.toJson(project.findFileSync("pom.xml").getContentSync(), {object: true}) as any;
    expect(pomJson.project.version).to.be.equal(expectedNewVersion);
  }

  /* tslint:disable */
  const POM = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-dependencies</artifactId>
    <version>2.2.5.RELEASE</version>
  </parent>
  <groupId>dev.snowdrop</groupId>
  <artifactId>snowdrop-dependencies</artifactId>
  <version>${ORIGINAL_VERSION}</version>
  <packaging>pom</packaging>
</project>
`;
});
