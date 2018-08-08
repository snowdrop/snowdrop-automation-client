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

import {logger} from "@atomist/automation-client/internal/util/logger";
import {SimpleProjectEditor} from "@atomist/automation-client/operations/edit/projectEditor";
import {Project} from "@atomist/automation-client/project/Project";
import {BOOSTER_BOM_PROPERTY_NAME, BOOSTER_SB_PROPERTY_NAME} from "../../constants";
import {updateMavenProjectVersionEditor} from "./updateMavenProjectVersion";
import {updateMavenPropertyEditor} from "./updateMavenProperty";
import {getCurrentVersion} from "../utils/pomUtils";

const BOM_VERSION_REGEX = /^(\d+.\d+.\d+).(\w+)$/;
const BOOSTER_VERSION_REGEX = /^(\d+.\d+.\d+)-(\d+)(?:-\w+)?$/;

/**
 * Performs the necessary updates to a boosters POM(s) for a specific version of the
 * Spring Boot BOM
 *
 * Meant to be called when the Spring Boot BOM has been released
 */
export function updateBoosterForBomVersion(releasedBOMVersion: string): SimpleProjectEditor {
  const bomVersionRegexMatches = releasedBOMVersion.match(BOM_VERSION_REGEX);
  if (!bomVersionRegexMatches) {
    logger.warn(`BOM version ${releasedBOMVersion} cannot be handled since it does match the expected regex`);
    logger.warn(`Examples of valid versions are: 1.5.10.SR2, 1.5.14.Final, 1.5.15.Beta1`);
    return (p: Project) => Promise.resolve(p);
  }

  const numberOnlyOfBOMVersion = bomVersionRegexMatches[1];

  return async (p: Project) => {
    const currentBoosterVersion = await getCurrentVersion(p);

    logger.info(`Current booster version of '${p.name}' is: ${currentBoosterVersion}`);

    const currentBoosterVersionRegexMatches = currentBoosterVersion.match(BOOSTER_VERSION_REGEX);
    const newBoosterVersion =
        getNewBoosterVersion(numberOnlyOfBOMVersion, currentBoosterVersionRegexMatches);

    return updateMavenProjectVersionEditor(newBoosterVersion)(p)
            .then(p2 => {
              return updateMavenPropertyEditor(
                  {name: BOOSTER_BOM_PROPERTY_NAME, value: releasedBOMVersion},
                  {name: BOOSTER_SB_PROPERTY_NAME, value: `${numberOnlyOfBOMVersion}.RELEASE`},
              )(p2);
            });
  };
}

function getNewBoosterVersion(numberOnlyOfBOMVersion: string,
                              boosterVersionRegexMatched: RegExpMatchArray): string {

  const defaultNewBoosterVersion = `${numberOnlyOfBOMVersion}-1-SNAPSHOT`;
  if (!boosterVersionRegexMatched) {
    logger.info(`Current booster version does not match expected version`);
    return defaultNewBoosterVersion;
  }

  const numbersOnlyOfBoosterVersion = boosterVersionRegexMatched[1];
  if (numbersOnlyOfBoosterVersion !== numberOnlyOfBOMVersion) {
    logger.info(`Current booster version corresponds to an old Spring Boot version, so we will update to the new one`);
    return defaultNewBoosterVersion;
  }

  const revisionOnlyOfBoosterVersion = boosterVersionRegexMatched[2];
  logger.info("Will increment revision of booster");
  const newRevision = Number(revisionOnlyOfBoosterVersion) + 1;
  return `${numberOnlyOfBOMVersion}-${newRevision}-SNAPSHOT`;
}
