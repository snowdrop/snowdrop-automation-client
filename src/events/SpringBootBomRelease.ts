/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  EventFired,
  EventHandler,
  failure,
  GraphQL,
  HandleEvent,
  HandlerContext,
  HandlerResult,
  logger,
  Secret,
  Secrets,
  success,
  Success,
  Tags,
} from "@atomist/automation-client";

import {editAll} from "@atomist/automation-client/operations/edit/editAll";
import {commitToMaster} from "@atomist/automation-client/operations/edit/editModes";
import {allReposInTeam} from "../support/repo/allReposInTeamRepoFinder";

import * as _ from "lodash";
import {BOM_REPO, BOOSTER_BOM_PROPERTY_NAME, BOOSTER_SB_PROPERTY_NAME} from "../constants";
import {boosterRepos} from "../support/repo/boosterRepoFilter";
import {updateMavenPropertyEditor} from "../support/transform/updateMavenProperty";
import * as graphql from "../typings/types";

@EventHandler("create a PR for each booster upon a new BOM release", GraphQL.subscription("tag"))
@Tags("bom", "release", "boosters")
export class UpdateBoostersOnBOMRelease implements HandleEvent<graphql.TagToPush.Subscription> {

  @Secret(Secrets.OrgToken)
  public githubToken: string;

  private BOM_VERSION_REGEX = /^(\d+.\d+.\d+).(\w+)$/;

  public handle(e: EventFired<graphql.TagToPush.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
    logger.debug(`Received release event ${JSON.stringify(e.data)}`);

    const repo = this.extractRepo(e);
    if (repo !== BOM_REPO) {
      logger.debug("Ignoring release since it's not a BOM release");
      return Promise.resolve(Success);
    }

    const releasedBOMVersion = e.data.Tag[0].name;
    if (!this.isVersionValid(releasedBOMVersion)) {
      logger.info(`Ignoring release because the version '${releasedBOMVersion}' is invalid`);
      return Promise.resolve(Success);
    }

    logger.debug(`Attempting to update boosters to new BOM version ${releasedBOMVersion}`);

    const commit = commitToMaster(`[booster-release] Update BOM to ${releasedBOMVersion}`);

    const numberOnlyVersion = releasedBOMVersion.match(this.BOM_VERSION_REGEX)[1];

    return editAll(ctx,
        {token: this.githubToken},
        updateMavenPropertyEditor(
            {name: BOOSTER_BOM_PROPERTY_NAME, value: releasedBOMVersion},
            {name: BOOSTER_SB_PROPERTY_NAME, value: `${numberOnlyVersion}.RELEASE`},
            ),
        commit,
        undefined,
        allReposInTeam(),
        boosterRepos(this.githubToken),

    )
    .then(success, failure);

  }

  private extractRepo(e: EventFired<graphql.TagToPush.Subscription>): string {
    return _.get(e, "data.Tag[0].commit.pushes[0].repo.name");
  }

  private isVersionValid(releasedBOMVersion: string): boolean {
    return this.BOM_VERSION_REGEX.test(releasedBOMVersion);
  }
}
