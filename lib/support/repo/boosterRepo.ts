import {logger, RepoFilter, RepoId} from "@atomist/automation-client";
import * as GitHubApi from "@octokit/rest";
import * as _ from "lodash";
import {BOOSTER_GITHUB_TOPIC, BOOSTER_NAME_REGEX} from "../../constants";
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

export function boosterSimpleName(fullName: string) {
  const matches = fullName.match(BOOSTER_NAME_REGEX);
  if (matches) {
    return matches[1];
  }

  logger.info(`Booster ${fullName} does not follow the naming conventions`);
  logger.info("Using it's full name as the simple name");
  return fullName;
}
