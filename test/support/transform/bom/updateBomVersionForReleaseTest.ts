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

import * as assert from "power-assert";

import * as parser from "xml2json";
import {updateBomVersionForRelease} from "../../../../lib/support/transform/bom/updateBomVersionForRelease";
import {InMemoryProject} from "@atomist/automation-client";

describe("updateBomVersionForRelease", () => {

  it("Invalid release should not result in a any change to version", async () => {
    await testWithReleasedVersion("1.5.15.Dummy", "1.5.15-SNAPSHOT");
  });

  it("Beta release should not result in a any change to version", async () => {
    await testWithReleasedVersion("1.5.15.Beta2", "1.5.15-SNAPSHOT");
  });

  it("Final release should result in using SP1", async () => {
    await testWithReleasedVersion("1.5.15.Final", "1.5.15.SP1-SNAPSHOT");
  });

  it("SP2 release should result in using SP3", async () => {
    await testWithReleasedVersion("1.5.15.SP2", "1.5.15.SP3-SNAPSHOT");
  });

});

async function testWithReleasedVersion(releasedVersion: string, expectedNewVersion: string) {
  const p = InMemoryProject.of(
      {path: "pom.xml", content: Bom},
  );

  await updateBomVersionForRelease(releasedVersion)(p);

  const pomFile = await p.findFile("pom.xml");
  const pomContent = await pomFile.getContent();
  const pomJson = parser.toJson(pomContent, {object: true}) as any;

  const pomProject = pomJson.project;
  assert(pomProject.version === expectedNewVersion);
}

/* tslint:disable */

const Bom = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>me.snowdrop</groupId>
  <artifactId>spring-boot-bom</artifactId>
  <version>1.5.15-SNAPSHOT</version>
  <packaging>pom</packaging>

  <name>Snowdrop Spring Boot BOM</name>
  <description>Bill Of Materials (BOM) file for Snowdrop project to facilitate usage of Spring Boot on OpenShift.</description>
  <url>http://www.snowdrop.me</url>

  <properties>
    <hibernate-validator.version>5.3.5.Final</hibernate-validator.version>
  </properties>

  <dependencyManagement>>
    <dependencies>
      <dependency>
        <groupId>org.hibernate</groupId>
        <artifactId>hibernate-validator</artifactId>
        <version>\${hibernate-validator.version}</version>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
`;
