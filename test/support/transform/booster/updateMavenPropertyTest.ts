import * as assert from "power-assert";
import {updateMavenProperty} from "../../../../lib/support/transform/booster/updateMavenProperty";
import {AbstractProject, InMemoryProject, Project} from "@atomist/automation-client";
import * as parser from "xml2json";

describe("setMavenProperty", () => {

  it("updates single property", async () => {
    const p =
        await updateMavenProperty(
        {name: "spring-boot.version", value: "1.5.14.RELEASE"}
        )(tempProject(PomWithProperties));

    const pomContent = await extractPomAsJson(p);
    assert(pomContent.project.properties["spring-boot.version"] === "1.5.14.RELEASE");
    assert(pomContent.project.properties["dummy.version"] === "3.2.1");
  });

  it("updates multiple properties including a non-existent one", async () => {
    const p =
        await updateMavenProperty(
        {name: "spring-boot.version", value: "1.5.14.RELEASE"},
          {name: "spring-boot-bom.version", value: "1.5.14.Final"},
          {name: "spring.version", value: "5.0.5.RELEASE"},
        )(tempProject(PomWithProperties));

    const pomContent = await extractPomAsJson(p);
    assert(pomContent.project.properties["spring-boot.version"] === "1.5.14.RELEASE");
    assert(pomContent.project.properties["spring-boot-bom.version"] === "1.5.14.Final");
    assert(pomContent.project.properties["dummy.version"] === "3.2.1")
  });

});

function tempProject(content: string): AbstractProject {
  return InMemoryProject.of({path: "pom.xml", content});
}

async function extractPomAsJson(p: Project): Promise<any> {
  const pomFile = await p.findFile("pom.xml");
  const pomStr = await pomFile.getContent();
  return parser.toJson(pomStr, {object: true}) as any;
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
    <spring-boot-bom.version>
      1.5.13.Final
    </spring-boot-bom.version>
    <dummy.version>3.2.1</dummy.version>
  </properties>
</project>`;