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
import {updateMavenParentVersion} from "../../../../lib/support/transform/booster/updateMavenParentVersion";

describe("updateMavenParentVersion", () => {

  it("doesn't edit empty project", async () => {
    const p = new InMemoryProject();
    await updateMavenParentVersion("24")(p);
  });

  it("only updates version of parent in root module", done => {
    const p = InMemoryProject.of(
        {path: "pom.xml", content: PomWithParent},
        {path: "child/pom.xml", content: PomOfSubModule},
    );
    updateMavenParentVersion("24")(p)
    .then(r => {
      assert(p.findFileSync("pom.xml").getContentSync().includes("24"));
      assert(p.findFileSync("child/pom.xml").getContentSync().includes("1"));
    }).then(done, done);
  });

});

/* tslint:disable */

const PomWithParent = `<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>my-app</artifactId>
  <version>1</version>
  <packaging>pom</packaging>
  
	<parent>
		<groupId>io.openshift</groupId>
		<artifactId>booster-parent</artifactId>
		<version>23</version>
	</parent>
	
	<modules>
	  <module>child</module>
	</modules>
</project>`;

const PomOfSubModule = `<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.mycompany.app</groupId>
  <artifactId>child</artifactId>
  
	<parent>
		<groupId>com.mycompany.app</groupId>
		<artifactId>my-app</artifactId>
		<version>1</version>
	</parent>
</project>`;
