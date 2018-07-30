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
import {doWithMatches} from "@atomist/automation-client/project/util/parseUtils";
import {ParentStanzaGrammar} from "@atomist/sdm-pack-spring/dist/support/maven/parse/grammar/mavenGrammars";

/**
 * Set the Parent POM version to
 * @param {string} desiredVersion
 * @return {ProjectEditor<EditResult>}
 */
export function updateMavenParentVersion(desiredVersion: string): SimpleProjectEditor {
    return p => {
        return doWithMatches(p, "pom.xml",
            ParentStanzaGrammar, m => {
                if (m.version.value !== desiredVersion) {
                    logger.info("Updating Parent POM from [%s] to [%s]",
                        m.version.value, desiredVersion);
                    m.version.value = desiredVersion;
                }
            });
    };
}
