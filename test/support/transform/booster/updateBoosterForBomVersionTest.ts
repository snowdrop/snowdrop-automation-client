import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import {updateBoosterForBomVersion} from "../../../../lib/support/transform/booster/updateBoosterForBomVersion";

import * as parser from "xml2json";

describe("updateBoosterForBomVersion", () => {

  it("doesn't do anything when an erroneous Spring Boot BOM version is passed", done => {
    const p = createProject();
    updateBoosterForBomVersion("1")(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === "1.5.14-2-SNAPSHOT");
      assert(parentPomJson.project.properties["spring-boot-bom.version"] === "1.5.14.Final");
      assert(parentPomJson.project.properties["spring-boot.version"] === "1.5.14.RELEASE");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === "1.5.14-2-SNAPSHOT");
    }).then(done, done);
  });

  it("updates booster to a new Spring Boot BOM version", done => {
    const newBOMVersion = "1.5.15.Beta1";
    const expectedNewBoosterVersion = "1.5.15-1-SNAPSHOT";
    const p = createProject();
    updateBoosterForBomVersion(newBOMVersion)(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === expectedNewBoosterVersion);
      assert(parentPomJson.project.properties["spring-boot-bom.version"] === newBOMVersion);
      assert(parentPomJson.project.properties["spring-boot.version"] === "1.5.15.RELEASE");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === expectedNewBoosterVersion);
    }).then(done, done);
  });

  it("updates booster to a revision of the Spring Boot BOM", done => {
    const newBOMVersion = "1.5.14.SR1";
    const expectedBoosterVersion = "1.5.14-2-SNAPSHOT";
    const p = createProject();
    updateBoosterForBomVersion(newBOMVersion)(p)
    .then(r => {
      const parentPomSync = p.findFileSync("pom.xml").getContentSync();
      const parentPomJson = parser.toJson(parentPomSync, {object: true}) as any;
      assert(parentPomJson.project.version === expectedBoosterVersion);
      assert(parentPomJson.project.properties["spring-boot-bom.version"] === newBOMVersion);
      assert(parentPomJson.project.properties["spring-boot.version"] === "1.5.14.RELEASE");

      const childPomSync = p.findFileSync("child/pom.xml").getContentSync();
      const childPomJson = parser.toJson(childPomSync, {object: true}) as any;
      assert(childPomJson.project.parent.version === expectedBoosterVersion);
    }).then(done, done);
  });

});

function createProject() {
  return InMemoryProject.from(
      {repo: "test-project", owner: "test"},
      {path: "pom.xml", content: PomWithParent},
      {path: "child/pom.xml", content: PomOfSubModule},
  );
}

/* tslint:disable */

const PomWithParent = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1.5.14-2-SNAPSHOT</version>
  <name>parent</name>
  <packaging>pom</packaging>
  
	<parent>
		<groupId>io.openshift</groupId>
		<artifactId>booster-parent</artifactId>
		<version>23</version>
	</parent>
	
	<properties>
    <openjdk18-openshift.version>1.3</openjdk18-openshift.version>
    <spring-boot-bom.version>1.5.14.Final</spring-boot-bom.version>
    <spring-boot.version>1.5.14.RELEASE</spring-boot.version>	
	</properties>
	
	<modules>
	  <module>child</module>
	</modules>
	
	<dependencyManagement>
	  <dependencies>
      <dependency>
        <groupId>me.snowdrop</groupId>
        <artifactId>spring-boot-bom</artifactId>
        <version>\${spring-boot-bom.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
        <version>\${spring-boot.version}</version>
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

const PomOfSubModule = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>child</artifactId>
  <name>child</name>
  
	<parent>
		<groupId>com.mycompany.app</groupId>
		<artifactId>my-app</artifactId>
		<version>1.5.14-2-SNAPSHOT</version>
	</parent>
	
	<dependencies>
    <dependency>
        <groupId>com.squareup.okhttp3</groupId>
        <artifactId>okhttp</artifactId>
        <version>3.11.0</version>
    </dependency>
  </dependencies>
</project>`;