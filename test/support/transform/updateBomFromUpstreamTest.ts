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
import {updateBomFromUpstream} from "../../../src/support/transform/updateBomFromUpstream";

describe("updateBomFromUpstreamTest", () => {

  it("all expected properties were updated", async () => {
    const p = InMemoryProject.of(
        {path: "pom.xml", content: Bom},
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
    </dependencies>
  </dependencyManagement>
</project>
`;
