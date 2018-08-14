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
import {SNOWDROP_ORG} from "../../../src/constants";
import {getShaOfLatestCommit, syncWithUpstream} from "../../../src/support/github/refUtils";
import {githubToken} from "../../github";

describe("syncWithUpstream", () => {

  it("sync not do anything for a repo that is not a fork", async () => {
    const repo = "jaeger-opentracing";

    const originalSha =
        await getShaOfLatestCommit(repo, "master", githubToken(), SNOWDROP_ORG);

    const result = await syncWithUpstream("jaeger-opentracing", githubToken(), SNOWDROP_ORG);
    assert(!result, "Repo should have been synced with upstream");

    const shaAfterCall =
        await getShaOfLatestCommit(repo, "master", githubToken(), SNOWDROP_ORG);

    assert(originalSha === shaAfterCall, "No update should have been performed!");
  }).timeout(10000);

  /**
   * launcher-booster-catalog is a fork making it ideal
   * for the test
   */

  it("sync should be performed for actual fork", async () => {
    const repo = "launcher-booster-catalog";

    const result = await syncWithUpstream(repo, githubToken(), SNOWDROP_ORG);
    assert(result, "Repo should have been synced with upstream");

    const shaOfMasterOfFork =
        await getShaOfLatestCommit(repo, "master", githubToken(), SNOWDROP_ORG);

    const shaOfMasterOfUpstream =
        await getShaOfLatestCommit(repo, "master", githubToken(), "fabric8-launcher");

    assert(shaOfMasterOfFork === shaOfMasterOfUpstream,
        "The latest commit of the fork should have been the same as that of upstream");
  }).timeout(10000);

});
