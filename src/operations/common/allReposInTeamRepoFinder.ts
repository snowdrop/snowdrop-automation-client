import { HandlerContext } from "@atomist/automation-client/HandlerContext";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import { RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import {
    ReposQuery,
    ReposQueryVariables,
} from "@atomist/automation-client/schema/schema";
import * as _ from "lodash";

// Hard-coded limit in GraphQL queries. Not sure why we can't pass this
const PageSize = 100;

/**
 * Use a GraphQL query to find all repos for the current team,
 * or look locally if appropriate, in current working directory
 *
 * The method of the same name in @atomist/automation-client
 * doesn't work because the GraphQL query is old
 * so I copied the implementation here.
 * Also the implementation in @atomist/sdm didn't work for some unknown reason
 */
export function allReposInTeam(): RepoFinder {
    return (context: HandlerContext) => {
        return queryForPage(context, 0);
    };
}

const RepoQuery = `
query Repos($offset: Int!) {
    ChatTeam {
        orgs {
            repo(first: 100, offset: $offset) {
                owner
                name
            }
        }
    }
}
`;

/**
 * Recursively query for repos from the present offset
 * @param {HandlerContext} context
 * @param {number} offset
 * @return {Promise<RepoRef[]>}
 */
function queryForPage(context: HandlerContext, offset: number): Promise<RepoRef[]> {
    return context.graphClient.executeQuery<ReposQuery, ReposQueryVariables>(
        RepoQuery,
        { teamId: context.teamId, offset })
        .then(result => {
            return _.flatMap(result.ChatTeam[0].orgs, org =>
                org.repo.map(r => new GitHubRepoRef(r.owner, r.name)));
        })
        .then((repos: RepoRef[]) => {
            return (repos.length < PageSize) ?
                repos :
                queryForPage(context, offset + PageSize)
                    .then(moreRepos => repos.concat(moreRepos));
        });
}
