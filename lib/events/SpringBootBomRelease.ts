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
  failure,
  // GraphQL,
  HandlerContext,
  HandlerResult,
  logger,
  MappedParameter,
  MappedParameters,
  Secret,
  Secrets,
  success,
  Success,
  Tags,
} from "@atomist/automation-client";
import * as _ from "lodash";
import {BOM_REPO, BOM_VERSION_REGEX} from "../constants";
import {performUpdatesForBomRelease, UpdateParams} from "../shared/BomReleaseUtil";
import * as graphql from "../typings/types";
// import {EventHandler} from "@atomist/automation-client/lib/decorators";
import {HandleEvent} from "@atomist/automation-client/lib/HandleEvent";

// see also commands/SpringBootBomRelease
//TODO: Fix Disabled for the time being since it broke application startup
// @EventHandler("update master branch of each booster upon a new BOM release", GraphQL.subscription("tag"))
@Tags("bom", "release", "boosters")
export class UpdateBoostersAndBOMForBOMRelease implements HandleEvent<graphql.TagToPush.Subscription> {

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.OrgToken)
  public githubToken: string;

  public handle(e: EventFired<graphql.TagToPush.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
    logger.debug(`Received release event ${JSON.stringify(e.data)}`);

    const repo = this.extractRepo(e);
    if (repo !== BOM_REPO) {
      logger.debug("Ignoring release since it's not a BOM release");
      return Promise.resolve(Success);
    }

    const releasedBOMVersion = e.data.Tag[0].name;
    if (!this.isReleasedVersionValid(releasedBOMVersion)) {
      logger.info(`Ignoring release because the version '${releasedBOMVersion}' is invalid`);
      return Promise.resolve(Success);
    }

    logger.debug(`Attempting to automatically update boosters to new BOM version ${releasedBOMVersion}`);

    return performUpdatesForBomRelease({
      bomVersion: releasedBOMVersion,
      owner: this.owner,
      githubToken: this.githubToken,
      context: ctx,
    } as UpdateParams).then(success, failure);
  }

  private extractRepo(e: EventFired<graphql.TagToPush.Subscription>): string {
    return _.get(e, "data.Tag[0].commit.pushes[0].repo.name");
  }

  private isReleasedVersionValid(releasedBOMVersion: string): boolean {
    return BOM_VERSION_REGEX.test(releasedBOMVersion);
  }
}
