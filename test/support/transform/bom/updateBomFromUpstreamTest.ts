/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";

import * as parser from "xml2json";
import {updateBomFromUpstream} from "../../../../lib/support/transform/bom/updateBomFromUpstream";

describe("updateBomFromUpstreamTest", () => {

  it("all expected properties were updated", async () => {
    const p = InMemoryProject.of(
        {path: "pom.xml", content: Bom},
        {path: "README.adoc", content: InitialReadme},
    );

    await updateBomFromUpstream("1.5.15.RELEASE")(p);

    const pomFile = await p.findFile("pom.xml");
    const pomContent = await pomFile.getContent();
    const pomJson = parser.toJson(pomContent, {object: true}) as any;

    const pomProject = pomJson.project;
    assert(pomProject.version === "1.5.15-SNAPSHOT");

    const pomProperties = pomJson.project.properties;
    assert(pomProperties["spring-boot.version"] === "1.5.15.RELEASE");
    assert(pomProperties["httpcore.version"] === "4.4.10");
    assert(pomProperties["hibernate-validator.version"] === "5.3.5.Final");
    assert(pomProperties["tomcat.version"] === "8.5.32");

    const updatedReadme = await p.findFile("README.adoc");
    const updatedReadmeContent = await updatedReadme.getContent();
    assert(updatedReadmeContent === UpdatedReadme);
  }).timeout(10000);

});

/* tslint:disable */

const Bom = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>me.snowdrop</groupId>
  <artifactId>spring-boot-bom</artifactId>
  <version>1.5.14-SNAPSHOT</version>
  <packaging>pom</packaging>

  <name>Snowdrop Spring Boot BOM</name>
  <description>Bill Of Materials (BOM) file for Snowdrop project to facilitate usage of Spring Boot on OpenShift.</description>
  <url>http://www.snowdrop.me</url>

  <properties>
		<hibernate.version>5.0.12.Final</hibernate.version>
    <hibernate-validator.version>5.3.5.Final</hibernate-validator.version>

    <!-- Spring Ecosystem -->
    <spring-boot.version>1.5.14.RELEASE</spring-boot.version>
    <spring-cloud-config.version>1.4.3.RELEASE</spring-cloud-config.version>

    <!-- Spring Boot defined -->
    <antlr2.version>2.7.7</antlr2.version> <!-- For Hibernate core -->
    <httpcore.version>4.4.9</httpcore.version>
    
    <tomcat.version>8.5.29</tomcat.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.apache.httpcomponents</groupId>
        <artifactId>httpcore</artifactId>
        <version>\${httpcore.version}</version>
      </dependency>
      <dependency>
				<groupId>org.hibernate</groupId>
				<artifactId>hibernate-core</artifactId>
				<version>\${hibernate.version}</version>
				<exclusions>
					<exclusion>
						<groupId>xml-apis</groupId>
						<artifactId>xml-apis</artifactId>
					</exclusion>
					<exclusion>
						<groupId>javax.enterprise</groupId>
						<artifactId>cdi-api</artifactId>
					</exclusion>
				</exclusions>
			</dependency>
      <dependency>
        <groupId>org.hibernate</groupId>
        <artifactId>hibernate-validator</artifactId>
        <version>\${hibernate-validator.version}</version>
      </dependency>
      <dependency>
        <groupId>org.apache.tomcat.embed</groupId>
        <artifactId>tomcat-embed-core</artifactId>
        <version>\${tomcat.version}</version>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
`;

const InitialReadme = `// spring-boot
:spring-boot.version:   1.5.14.RELEASE

= Spring Boot BOM - 1.5.x

This Bill Of Materials for Spring Boot 1.5 contains starters which are currently used by the 
https://github.com/snowdrop?utf8=✓&q=topic%3Abooster[Spring Boot Mission Boosters].
This document is updated on a "best effort" basis, based on the information contained in the \`pom.xml\` file. In case of inconsistency between this document and the POM file, the POM information prevails.

This BOM is aligned to: 

.Spring
// spring-boot
- Spring Boot: 1.5.14.RELEASE

.Spring Cloud
- https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Edgware-Release-Notes#edgwaresr3[Edgware.SR3].
- Spring Cloud Starters have been renamed: https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Edgware-Release-Notes#renamed-starters
// spring-cloud-kubernetes
- https://github.com/spring-cloud/spring-cloud-kubernetes[Spring Cloud Kubernetes]: 0.2.0.RELEASE

.Integration
// cxf-spring-boot-starter-jaxrs
- http://cxf.apache.org/docs/springboot.html[Apache CXF Spring Boot Starter]: 3.1.12
// keycloak
- Keycloak: 3.4.3.Final
// tomcat
- Tomcat: 8.5.29

.ORM
// hibernate
- Hibernate: 5.1.10.Final
// hibernate-validator
- Hibernate Validator: 5.3.5.Final

== Versioning scheme

This BOM is using the following versioning scheme:

Note that the Sonatype release plugin is configured to auto-release the artifacts from staging, resulting in a faster, more 
automated release process. This is not mandatory and can be changed in the plugin configuration.
`;

const UpdatedReadme = `// spring-boot
:spring-boot.version: 1.5.15.RELEASE

= Spring Boot BOM - 1.5.x

This Bill Of Materials for Spring Boot 1.5 contains starters which are currently used by the 
https://github.com/snowdrop?utf8=✓&q=topic%3Abooster[Spring Boot Mission Boosters].
This document is updated on a "best effort" basis, based on the information contained in the \`pom.xml\` file. In case of inconsistency between this document and the POM file, the POM information prevails.

This BOM is aligned to: 

.Spring
// spring-boot
- Spring Boot: 1.5.15.RELEASE

.Spring Cloud
- https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Edgware-Release-Notes#edgwaresr3[Edgware.SR3].
- Spring Cloud Starters have been renamed: https://github.com/spring-projects/spring-cloud/wiki/Spring-Cloud-Edgware-Release-Notes#renamed-starters
// spring-cloud-kubernetes
- https://github.com/spring-cloud/spring-cloud-kubernetes[Spring Cloud Kubernetes]: 0.2.0.RELEASE

.Integration
// cxf-spring-boot-starter-jaxrs
- http://cxf.apache.org/docs/springboot.html[Apache CXF Spring Boot Starter]: 3.1.12
// keycloak
- Keycloak: 3.4.3.Final
// tomcat
- Tomcat: 8.5.32

.ORM
// hibernate
- Hibernate: 5.1.10.Final
// hibernate-validator
- Hibernate Validator: 5.3.5.Final

== Versioning scheme

This BOM is using the following versioning scheme:

Note that the Sonatype release plugin is configured to auto-release the artifacts from staging, resulting in a faster, more 
automated release process. This is not mandatory and can be changed in the plugin configuration.
`;
