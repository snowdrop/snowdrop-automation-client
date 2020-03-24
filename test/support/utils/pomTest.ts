import {InMemoryProject, Project} from "@atomist/automation-client";
import {expect} from "chai";
import * as parser from "xml2json";
import {setParentVersion, setProjectVersion, setProperty} from "../../../lib/support/utils/pom";

describe("setParentVersion", () => {
  it("should set parent version", async () => {
    const project = await setParentVersion(createProject(), "1.2.3");
    const pom = parser.toJson(project.findFileSync("pom.xml").getContentSync(), {object: true}) as any;
    return expect(pom.project.parent.version).to.be.equal("1.2.3");
  });
});

describe("setVersion", () => {
  it("should set project version in parent and child modules", async () => {
    const project = await setProjectVersion(createProject(), "1.2.3");
    const parentPom = parser.toJson(project.findFileSync("pom.xml").getContentSync(), {object: true}) as any;
    const childPom = parser.toJson(project.findFileSync("child/pom.xml").getContentSync(), {object: true}) as any;
    expect(parentPom.project.version).to.be.equal("1.2.3");
    expect(childPom.project.parent.version).to.be.equal("1.2.3");
  });
});

describe("setProperty", () => {
  it("should set property", async () => {
    const project = await setProperty(createProject(), "some.property", "3.2.1");
    const pom = parser.toJson(project.findFileSync("pom.xml").getContentSync(), {object: true}) as any;
    return expect(pom.project.properties["some.property"]).to.be.equal("3.2.1");
  });
});

function createProject(): Project {
  return InMemoryProject.of(
      {path: "pom.xml", content: parentPomContent},
      {path: "child/pom.xml", content: childPomContent},
  );
}

/* tslint:disable */
const parentPomContent = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-dependencies</artifactId>
    <version>2.2.5.RELEASE</version>
  </parent>
  <groupId>dev.snowdrop</groupId>
  <artifactId>snowdrop-dependencies</artifactId>
  <version>2.2.5-SNAPSHOT</version>
  <properties>
    <some.property>1.2.3</some.property>
  </properties>
  <modules>
	  <module>child</module>
	</modules>
</project>`;

const childPomContent = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>dev.snowdrop</groupId>
    <artifactId>snowdrop-dependencies</artifactId>
    <version>2.2.5-SNAPSHOT</version>
  </parent>
  <artifactId>snowdrop-example</artifactId>
</project>`;