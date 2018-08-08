import {RepoFilter} from "@atomist/automation-client/operations/common/repoFilter";
import {RepoId} from "@atomist/automation-client/operations/common/RepoId";
import * as GitHubApi from "@octokit/rest";
import * as _ from "lodash";
import {BOOSTER_GITHUB_TOPIC} from "../../constants";
import {githubApi} from "../github/githubApi";

/**
 * Booster repos are repos that contain the "booster" Github topic
 *
 * TODO introduce some sort of caching
 */
export function boosterRepos(token?: string): RepoFilter {
  return (r: RepoId) => {
    const params: GitHubApi.ReposGetTopicsParams = {
      owner: r.owner,
      repo: r.repo,
    };

    return githubApi(token).repos.getTopics(params).then(res => {
      return _.includes(res.data.names, BOOSTER_GITHUB_TOPIC);
    });
  };
}
