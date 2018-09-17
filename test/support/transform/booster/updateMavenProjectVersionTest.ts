import * as assert from "power-assert";
import {
  bumpMavenProjectRevisionVersion,
  removeSnapshotFromMavenProjectVersion,
  replaceSnapshotFromMavenProjectVersionWithQualifier,
  updateMavenProjectVersion,
} from "../../../../lib/support/transform/booster/updateMavenProjectVersion";

import * as parser from "xml2json";
import {File, InMemoryProject, Project} from "@atomist/automation-client";

const newVersion = "1.2.4";


describe("updateMavenProjectVersion", () => {

  it("correctly updates version in both parent module and child module", async () => {
    const p = await updateMavenProjectVersion(newVersion)(createProject());

    const parentPomJson = await extractParentPomAsJson(p);
    assert(parentPomJson.project.version === newVersion);
    assert(parentPomJson.project.parent.version === "23");
    assert(parentPomJson.project.dependencyManagement.dependencies.dependency.version === "2.0.1.RELEASE");
    assert(parentPomJson.project.build.pluginManagement.plugins.plugin.version === "3.8.0");

    const childPomJson = await extractChildPomAsJson(p);
    assert(childPomJson.project.parent.version === newVersion);
    assert(childPomJson.project.dependencies.dependency.version === "3.11.0");

  });

});

describe("removeSnapshotFromMavenProjectVersion", () => {

  it("correctly remove snapshot from version in both parent module and child module", async () => {
    const p = await removeSnapshotFromMavenProjectVersion()(createProject());

    const parentPomJson = await extractParentPomAsJson(p);
    assert(parentPomJson.project.version === "1.2.3");

    const childPomJson = await extractChildPomAsJson(p);
    assert(childPomJson.project.parent.version === "1.2.3");
  });

});

describe("replaceSnapshotFromMavenProjectVersionWithQualifier", () => {

  it("correctly remove snapshot from version and add qualifier to it for both parent module and child module", async () => {
    const p = await replaceSnapshotFromMavenProjectVersionWithQualifier("redhat")(createProject());
    const parentPomJson = await extractParentPomAsJson(p);
    assert(parentPomJson.project.version === "1.2.3-redhat");

    const childPomJson = await extractChildPomAsJson(p);
    assert(childPomJson.project.parent.version === "1.2.3-redhat");
  });

});

describe("bumpMavenProjectRevisionVersion", () => {

  it("correctly bump version with qualifier to it for both parent module and child module", async () => {
    const p = await bumpMavenProjectRevisionVersion()(createProject("1.5.15-2-SNAPSHOT"));
    const parentPomJson = await extractParentPomAsJson(p);
    assert(parentPomJson.project.version === "1.5.15-3-SNAPSHOT");

    const childPomJson = await extractChildPomAsJson(p);
    assert(childPomJson.project.parent.version === "1.5.15-3-SNAPSHOT");
  });

  it("correctly bump version without qualifier to it for both parent module and child module", async () => {
    const p = await bumpMavenProjectRevisionVersion()(createProject("1.5.15-2"));
    const parentPomJson = await extractParentPomAsJson(p);
    assert(parentPomJson.project.version === "1.5.15-3");

    const childPomJson = await extractChildPomAsJson(p);
    assert(childPomJson.project.parent.version === "1.5.15-3");
  });

});

function createProject(version: string = "1.2.3-SNAPSHOT") {
  return InMemoryProject.of(
      {path: "pom.xml", content: pomWithParent(version)},
      {path: "child/pom.xml", content: pomOfSubModule(version)},
  );
}

async function extractParentPomAsJson(p: Project): Promise<any> {
  const parentPomFile = await p.findFile("pom.xml");
  return await extractContentAsJson(parentPomFile);
}

async function extractChildPomAsJson(p: Project): Promise<any> {
  const childPomFile = await p.findFile("child/pom.xml");
  return await extractContentAsJson(childPomFile);
}

async function extractContentAsJson(file: File): Promise<any> {
  const pomStr = await file.getContent();
  return parser.toJson(pomStr, {object: true}) as any;
}

/* tslint:disable */

function pomWithParent(version: string): string {
  return `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>${version}</version>
  <packaging>pom</packaging>
  
	<parent>
		<groupId>io.openshift</groupId>
		<artifactId>booster-parent</artifactId>
		<version>23</version>
	</parent>
	
	<modules>
	  <module>child</module>
	</modules>
	
	<dependencyManagement>
	  <dependencies>
	    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-stream</artifactId>
        <version>2.0.1.RELEASE</version>
      </dependency>
    </dependencies>
  </dependencyManagement>
	
  <build>
    <pluginManagement>
      <plugins>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-compiler-plugin</artifactId>
          <version>3.8.0</version>
          <configuration>
            <!-- put your configurations here -->
          </configuration>
        </plugin>
      </plugins>
    </pluginManagement>
  </build>
</project>`;
}

function pomOfSubModule(version: string) {

  return `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>child</artifactId>
  
	<parent>
		<groupId>com.mycompany.app</groupId>
		<artifactId>my-app</artifactId>
		<version>${version}</version>
	</parent>
	
	<dependencies>
    <dependency>
        <groupId>com.squareup.okhttp3</groupId>
        <artifactId>okhttp</artifactId>
        <version>3.11.0</version>
    </dependency>
  </dependencies>
</project>`;
}