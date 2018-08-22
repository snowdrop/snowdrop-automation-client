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
import {getShaOfLatestCommit} from "../../../lib/support/github/refUtils";
import {githubToken} from "../../github";

describe("getShaOfLatestCommit", () => {

  /**
   * spring-boot-booster-parent has been archived so it's read-only
   * making an ideal candidate for testing
   */

  it("should return undefined for non-existing branch of repo", done => {
    getShaOfLatestCommit("spring-boot-booster-parent", "dummy", githubToken())
    .then(s => {
      assert(s === undefined);
      done();
    }).catch(done);
  }).timeout(5000);

  it("should return a valid sha for master branch of spring-boot-booster-parent", done => {
    getShaOfLatestCommit("spring-boot-booster-parent", "master", githubToken())
      .then(s => {
        assert(s === "d7198eeee2c006cdf6d3d2cbe8ebd3e963abeb2e");
        done();
      }).catch(done);
  }).timeout(5000);

  it("should return a valid sha for rhoar branch of spring-boot-booster-parent", done => {
    getShaOfLatestCommit("spring-boot-booster-parent", "rhoar", githubToken())
    .then(s => {
      assert(s === "aaea1fa96d663d3f6bbdb9a21b9219275d584861");
      done();
    }).catch(done);
  }).timeout(5000);

});
