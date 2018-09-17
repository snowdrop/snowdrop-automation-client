import * as _ from "lodash";
import "mocha";
import * as assert from "power-assert";

import {ApolloGraphClient, RepoRef} from "@atomist/automation-client";
import {allReposInTeam} from "@atomist/sdm";
import {DefaultRepoRefResolver} from "@atomist/sdm-core";
import {SNOWDROP_ORG} from "../../../lib/constants";
import {githubToken, SlackTeamId} from "../../github";

describe("allReposInOrgRepoFinder", () => {

    const graphClient = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
        { Authorization: `token ${githubToken()}` });

    it("finds over 10 repos in org", done => {
        allReposInTeam(new DefaultRepoRefResolver())({ graphClient, teamId: SlackTeamId } as any)
            .then((repos: RepoRef[]) => {
                assert(repos.length > 10, "Expected to find at least 10 repos");

                const names = repos.map(r => r.repo);
                assert(names.length === _.uniq(names).length, "Expected function to return unique repos");

                const orgs = _.uniq(repos.map(r => r.owner));
                assert.deepEqual(orgs, [SNOWDROP_ORG], "Expected to see only snowdrop repos");
            }).then(() => done(), done);
    }).timeout(10000);

});
