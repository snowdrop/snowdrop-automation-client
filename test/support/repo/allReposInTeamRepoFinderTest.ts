import * as _ from "lodash";
import "mocha";
import * as assert from "power-assert";

import {ApolloGraphClient} from "@atomist/automation-client/graph/ApolloGraphClient";
import {SNOWDROP_ORG} from "../../../src/constants";
import {allReposInTeam} from "../../../src/support/repo/allReposInTeamRepoFinder";
import {githubToken, SlackTeamId} from "../../github";

describe("allReposInOrgRepoFinder", () => {

    const graphClient = new ApolloGraphClient(`https://automation.atomist.com/graphql/team/${SlackTeamId}`,
        { Authorization: `token ${githubToken()}` });

    it("finds over 10 repos in org", done => {
        allReposInTeam()({ graphClient, teamId: SlackTeamId } as any)
            .then(repos => {
                assert(repos.length > 10, "Expected to find at least 10 repos");

                const names = repos.map(r => r.repo);
                assert(names.length === _.uniq(names).length, "Expected function to return unique repos");

                const orgs = _.uniq(repos.map(r => r.owner));
                assert.deepEqual(orgs, [SNOWDROP_ORG], "Expected to see only snowdrop repos");
            }).then(() => done(), done);
    }).timeout(10000);

});
