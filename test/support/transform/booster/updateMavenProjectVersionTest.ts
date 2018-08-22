import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import {
  bumpMavenProjectRevisionVersion,
  removeSnapshotFromMavenProjectVersion,
  replaceSnapshotFromMavenProjectVersionWithQualifier,
  updateMavenProjectVersion,
} from "../../../../lib/support/transform/booster/updateMavenProjectVersion";

import * as parser from "xml2json";

const newVersion = "1.2.4";

describe("updateMavenProjectVersion", () => {

  it("correctly updates version in both parent module and child module", done => {
    const p = createProject();
    updateMavenProjectVersion(newVersion)(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === newVersion);
      assert(parentPomJson.project.parent.version === "23");
      assert(parentPomJson.project.dependencyManagement.dependencies.dependency.version === "2.0.1.RELEASE");
      assert(parentPomJson.project.build.pluginManagement.plugins.plugin.version === "3.8.0");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === newVersion);
      assert(childPomJson.project.dependencies.dependency.version === "3.11.0");
    }).then(done, done);
  });

});

describe("removeSnapshotFromMavenProjectVersion", () => {

  it("correctly remove snapshot from version in both parent module and child module", done => {
    const p = createProject();
    removeSnapshotFromMavenProjectVersion()(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === "1.2.3");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === "1.2.3");
    }).then(done, done);
  });

});

describe("replaceSnapshotFromMavenProjectVersionWithQualifier", () => {

  it("correctly remove snapshot from version and add qualifier to it for both parent module and child module", done => {
    const p = createProject();
    replaceSnapshotFromMavenProjectVersionWithQualifier("redhat")(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === "1.2.3-redhat");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === "1.2.3-redhat");
    }).then(done, done);
  });

});

describe("bumpMavenProjectRevisionVersion", () => {

  it("correctly bump version with qualifier to it for both parent module and child module", done => {
    const p = createProject("1.5.15-2-SNAPSHOT");
    bumpMavenProjectRevisionVersion()(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === "1.5.15-3-SNAPSHOT");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === "1.5.15-3-SNAPSHOT");
    }).then(done, done);
  });

  it("correctly bump version without qualifier to it for both parent module and child module", done => {
    const p = createProject("1.5.15-2");
    bumpMavenProjectRevisionVersion()(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === "1.5.15-3");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === "1.5.15-3");
    }).then(done, done);
  });

});

function createProject(version: string = "1.2.3-SNAPSHOT") {
  return InMemoryProject.of(
      {path: "pom.xml", content: pomWithParent(version)},
      {path: "child/pom.xml", content: pomOfSubModule(version)},
  );
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