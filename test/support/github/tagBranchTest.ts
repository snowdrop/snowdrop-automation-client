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
import {SNOWDROP_ORG} from "../../../lib/constants";
import {githubApi} from "../../../lib/support/github/githubApi";
import {tagBranch} from "../../../lib/support/github/refUtils";
import {githubToken} from "../../github";

const repo = "jaeger-opentracing";
const tagName = "dummy";

describe("tagBranch", () => {

  /**
   * jaeger-opentracing is deprecated
   * making an ideal candidate for testing
   */

  it("tag should be created correctly", done => {
    // delete the tag that might exist before the test starts
    deleteTag()
      .catch(() => { return; }) // ignore error if the tag did not exist
      .then(() => {
        return tagBranch(repo, "master", tagName, githubToken());
      })
      .then(res => {
        assert(res, "Tag should have been created");
        deleteTag().then(() => {return; }); // ignore error if tag could not be deleted
      })
      .then(done).catch(done);
  }).timeout(10000);

});

function deleteTag(): Promise<any> {
  return githubApi(githubToken()).gitdata.deleteReference({
    owner: SNOWDROP_ORG,
    repo,
    ref: `tags/${tagName}`,
  });
}
