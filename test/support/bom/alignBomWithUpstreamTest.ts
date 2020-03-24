import * as parser from "xml2json";

import {InMemoryProject} from "@atomist/automation-client";
import {expect} from "chai";
import {alignBomWithUpstream} from "../../../lib/support/bom/alignBomWithUpstream";

describe("alignBomWithUpstream", () => {

  it("should not allow wrong Spring Boot version", async () => {
    try {
      alignBomWithUpstream("2.2.5");
      expect.fail("Error was expected");
    } catch (error) {
      expect(error.message).to.be.equal("Invalid Spring Boot version: '2.2.5'");
    }
  });

  it("should align with upstream", async () => {
    const project = getTestProject();

    await alignBomWithUpstream("2.2.4.RELEASE")(project);

    const pomContent = project.findFileSync("pom.xml").getContentSync();
    const pom = parser.toJson(pomContent, {object: true}) as any;

    expect(pom.project.parent.version).to.be.equal("2.2.4.RELEASE");
    expect(pom.project.version).to.be.equal("2.2.4-SNAPSHOT");
    expect(pom.project.properties["spring-boot.version"]).to.be.equal("2.2.4.RELEASE");
    expect(pom.project.properties["artemis.version"]).to.be.equal("2.10.1"); // No change between releases
    expect(pom.project.properties["hibernate.version"]).to.be.equal("5.4.12.Final"); // Forbidden change
    expect(pom.project.properties["tomcat.version"]).to.be.equal("9.0.30");

    const readme = project.findFileSync("README.adoc").getContentSync();
    expect(readme).to.be.equal(UPDATED_README);
  }).timeout(10000);

  it("should keep everything as is if there are no changes", async () => {
    const project = getTestProject();

    await alignBomWithUpstream("2.2.5.RELEASE")(project);

    const pomContent = project.findFileSync("pom.xml").getContentSync();
    const pom = parser.toJson(pomContent, {object: true}) as any;

    expect(pom.project.parent.version).to.be.equal("2.2.5.RELEASE");
    expect(pom.project.version).to.be.equal("2.2.5-SNAPSHOT");
    expect(pom.project.properties["spring-boot.version"]).to.be.equal("2.2.5.RELEASE");
    expect(pom.project.properties["artemis.version"]).to.be.equal("2.10.1");
    expect(pom.project.properties["hibernate.version"]).to.be.equal("5.4.12.Final");
    expect(pom.project.properties["tomcat.version"]).to.be.equal("9.0.31");

    const readme = project.findFileSync("README.adoc").getContentSync();
    expect(readme).to.be.equal(ORIGINAL_README);
  }).timeout(10000);

});

function getTestProject(): InMemoryProject {
  return InMemoryProject.of(
    {
      path: "pom.xml",
      content: POM,
    },
    {
      path: "README.adoc",
      content: ORIGINAL_README,
    },
  );
}

/* tslint:disable */

const POM = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-dependencies</artifactId>
    <version>2.2.5.RELEASE</version>
  </parent>

  <groupId>dev.snowdrop</groupId>
  <artifactId>snowdrop-dependencies</artifactId>
  <version>2.2.5-SNAPSHOT</version>
  <packaging>pom</packaging>

  <properties>
    <spring-boot.version>2.2.5.RELEASE</spring-boot.version>
    <artemis.version>2.10.1</artemis.version>
    <hibernate.version>5.4.12.Final</hibernate.version>
    <tomcat.version>9.0.31</tomcat.version>
  </properties>
</project>
`;

const ORIGINAL_README = `// spring-boot
:spring-boot.version: 2.2.5.RELEASE

= Spring Boot BOM - 2.2.x

.Spring
// spring-boot
- Spring Boot: 2.2.5.RELEASE

.Integration
// tomcat
- Tomcat: 9.0.31

.ORM
// hibernate
- Hibernate: 5.4.12.Final
`;

const UPDATED_README = `// spring-boot
:spring-boot.version: 2.2.4.RELEASE

= Spring Boot BOM - 2.2.x

.Spring
// spring-boot
- Spring Boot: 2.2.4.RELEASE

.Integration
// tomcat
- Tomcat: 9.0.30

.ORM
// hibernate
- Hibernate: 5.4.12.Final
`;
