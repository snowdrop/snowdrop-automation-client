import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import {Project} from "@atomist/automation-client/project/Project";
import * as yaml from "js-yaml";
import * as assert from "power-assert";
import {setBoosterVersionInTemplate} from "../../../../src/support/transform/booster/setBoosterVersionInTemplate";

describe("setBoosterVersionInTemplate", () => {

  it("updates yaml openshift template files only", done => {
    const p = createProject();
    setBoosterVersionInTemplate()(p)
    .then( r => {
      assertTemplate(r, "child1");
      assertTemplate(r, "child2");

      // ensure that non openshift templates files are not changed
      assert(p.findFileSync("child1/src/main/resources/application.yml")
        .getContentSync().includes("BOOSTER_VERSION"));
    }).then(done, done);
  });

});

function createProject() {
  return InMemoryProject.from(
      {repo: "test-project", owner: "test"},
      {path: "pom.xml", content: PomWithParent},
      {path: "child1/pom.xml", content: pomOfSubModule("child1")},
      {path: "child1/src/main/resources/application.yml", content: "name: BOOSTER_VERSION"},
      {path: "child1/.openshiftio/application.yml", content: openshiftTemplate("child1")},
      {path: "child2/pom.xml", content: pomOfSubModule("child2")},
      {path: "child2/.openshiftio/application.yaml", content: openshiftTemplate("child2")},
  );
}

function assertTemplate(p: Project, name: string) {
  const templateContent = getContent(p, name);
  const data = yaml.load(templateContent);
  assert(!templateContent.includes("BOOSTER_VERSION"));
  assert(data.objects[0].spec.output.to.name === `${name}:1.5.14-2`);
}

function getContent(p: Project, name: string) {
  const extensions = ["yml", "yaml"];
  return extensions
          .map(e => p.findFileSync(`${name}/.openshiftio/application.${e}`))
          .find(f => f !== undefined)
          .getContentSync();
}

/* tslint:disable */

const PomWithParent = `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1.5.14-2</version>
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
</project>`;

function pomOfSubModule(name: string): string {
  return `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>${name}</artifactId>
  <name>${name}</name>
  
	<parent>
		<groupId>com.mycompany.app</groupId>
		<artifactId>my-app</artifactId>
		<version>1.5.14-2</version>
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

function openshiftTemplate(name: string): string {
  return `apiVersion: v1
kind: Template
metadata:
  name: ${name}
parameters:
- name: RUNTIME_VERSION
  displayName: OpenJDK 8 image version to use
  description: Specifies which version of the OpenShift OpenJDK 8 image to use
  value: 1.3-8
  required: true 
objects:
- apiVersion: v1
  kind: BuildConfig
  metadata:
    name: spring-boot-cache-greeting
  spec:
    output:
      to:
        kind: ImageStreamTag
        name: ${name}:BOOSTER_VERSION     
  `;
}