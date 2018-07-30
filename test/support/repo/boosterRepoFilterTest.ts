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

import {fromListRepoFinder} from "@atomist/automation-client/operations/common/fromProjectList";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {RepoRef} from "@atomist/automation-client/operations/common/RepoId";
import {RepoLoader} from "@atomist/automation-client/operations/common/repoLoader";
import {doWithAllRepos} from "@atomist/automation-client/operations/common/repoUtils";
import {InMemoryProject} from "@atomist/automation-client/project/mem/InMemoryProject";
import {Project} from "@atomist/automation-client/project/Project";
import * as assert from "power-assert";
import {SNOWDROP_ORG} from "../../../src/constants";
import {BoosterRepos} from "../../../src/support/repo/boosterRepoFilter";

describe("boosterRepoFilterTest", function() {
  this.timeout(15000);

  it("filter should only include boosters with the necessary topic", done => {
    const firstBoosterRepo = new InMemoryProject(new GitHubRepoRef(SNOWDROP_ORG, "spring-boot-cache-booster"));
    const nonBoosterRepo = new InMemoryProject(new GitHubRepoRef(SNOWDROP_ORG, "k8s-supervisor"));
    const secondBoosterRepo =
        new InMemoryProject(new GitHubRepoRef(SNOWDROP_ORG, "spring-boot-istio-security-booster"));

    const allRepos = fromListRepoFinder([
      firstBoosterRepo, secondBoosterRepo, nonBoosterRepo,
    ]);

    const noOpLoader: RepoLoader = (r: RepoRef) => {
      return Promise.resolve({ id: r } as Project);
    };

    // test that the filter works as expected by utilizing 'doWithAllRepos'
    // which will make sure that every project that it operates on is one of the
    // expected boosters
    doWithAllRepos(null, null,
        p => {
          assert(p.id.repo === firstBoosterRepo.id.repo
              || p.id.repo === secondBoosterRepo.id.repo);
          return Promise.resolve(p);
        }, null,
        allRepos, BoosterRepos, noOpLoader)
    .then(results => {
      assert(results.length === 2, `Got ${results.length} results`);
      done();
    }).catch(done);
  });

});
