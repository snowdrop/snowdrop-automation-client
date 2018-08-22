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
import {DefaultLatestTagRetriever} from "../../../lib/support/github/boosterUtils";
import {githubToken} from "../../github";

describe("getLatestTags", () => {

  /**
   * jaeger-opentracing is deprecated
   * making an ideal candidate for testing
   */

  const latestTagRetriever = new DefaultLatestTagRetriever();

  it("returns the latest tags when no filter is applied", async () => {
    const tags =
        await latestTagRetriever.getLatestTags("jaeger-opentracing", undefined, githubToken());
    assert(tags.community === "1.5.15-2");
    assert(tags.prod === "1.5.15-1-redhat");
  }).timeout(10000);

  it("returns the latest tags when filter is applied", async () => {
    const tags =
        await latestTagRetriever.getLatestTags(
            "jaeger-opentracing", t => t.startsWith("1.5.14"), githubToken());
    assert(tags.community === "1.5.14-3");
    assert(tags.prod === "1.5.14-3-redhat");
  }).timeout(10000);

  it("returns undefined filter is applied and no matching tags found", async () => {
    const tags =
        await latestTagRetriever.getLatestTags(
            "jaeger-opentracing", t => t.includes("redhat"), githubToken());
    assert(tags.community === undefined);
    assert(tags.prod === "1.5.15-1-redhat");
  }).timeout(10000);

});
