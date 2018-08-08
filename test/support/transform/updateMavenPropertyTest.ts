import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import {AbstractProject} from "@atomist/automation-client/project/support/AbstractProject";
import * as assert from "power-assert";
import {updateMavenProperty} from "../../../src/support/transform/updateMavenProperty";

describe("setMavenProperty", () => {

  it("updates single property", done => {
    const p = tempProject(PomWithProperties);
    updateMavenProperty({name: "spring-boot.version", value: "1.5.14.RELEASE"})(p)
    .then(r => {
      const pomContent = p.findFileSync("pom.xml").getContentSync();
      assert(pomContent.includes("1.5.14.RELEASE"));
      assert(!pomContent.includes("1.5.13.RELEASE"));
    }).then(done, done);
  });

  it("updates multiple properties including a non-existent one", done => {
    const p = tempProject(PomWithProperties);
    updateMavenProperty(
        {name: "spring-boot.version", value: "1.5.14.RELEASE"},
        {name: "spring-boot-bom.version", value: "1.5.14.Final"},
        {name: "spring.version", value: "5.0.5.RELEASE"},
    )(p)
    .then(r => {
      const pomContent = p.findFileSync("pom.xml").getContentSync();
      assert(pomContent.includes("1.5.14.RELEASE"));
      assert(pomContent.includes("1.5.14.Final"));
      assert(pomContent.includes("3.2.1"));
    }).then(done, done);
  });

});

function tempProject(content: string): AbstractProject {
  return InMemoryProject.of({path: "pom.xml", content});
}

/* tslint:disable */

const PomWithProperties = `<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1</version>
  <packaging>pom</packaging>
  
  <properties>
    <spring-boot.version>1.5.13.RELEASE</spring-boot.version>
    <spring-boot-bom.version>1.5.13.Final</spring-boot-bom.version>
    <dummy.version>3.2.1</dummy.version>
  </properties>
</project>`;