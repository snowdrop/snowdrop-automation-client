import { InMemoryProject, Project } from "@atomist/automation-client";
import { expect } from "chai";
import { getProperty } from "../../../lib/support/utils/pomUtils";


describe("pomUtils.getPomProperty", () => {
  it("should get an existing proeprty", async () => {
    const value = await getProperty(createProject(), "spring-boot.version");
    return expect(value).to.be.equal("1.5.14.RELEASE");
  });

  it("should not get nonexistent property", async () => {
    const value = await getProperty(createProject(), "wrong-property");
    return expect(value).to.be.null;
  });
})

const createProject = (): Project => {
  return InMemoryProject.from(
    { repo: "test-project", owner: "test", url: "dummy" },
    { path: "pom.xml", content: pomContent }
  );
};

/* tslint:disable */
const pomContent = `
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>me.snowdrop</groupId>
  <artifactId>spring-boot-bom</artifactId>
  <version>1.5.14.Final</version>
  <url>http://www.snowdrop.me</url>
  <properties>
    <spring-boot.version>1.5.14.RELEASE</spring-boot.version>
  </properties>
</project>`;