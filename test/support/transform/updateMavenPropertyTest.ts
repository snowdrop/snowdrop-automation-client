import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import {AbstractProject} from "@atomist/automation-client/project/support/AbstractProject";
import * as assert from "power-assert";
import {updateMavenPropertyEditor} from "../../../src/support/transform/updateMavenProperty";

describe("setMavenProperty", () => {

  it("updates existing property", done => {
    const p = tempProject(PomWithProperties);
    updateMavenPropertyEditor("spring-boot.version", "1.5.14.RELEASE")(p)
    .then(r => {
      const pomContent = p.findFileSync("pom.xml").getContentSync();
      assert(pomContent.includes("1.5.14.RELEASE"));
      assert(!pomContent.includes("1.5.13.RELEASE"));
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
  </properties>
</project>`;