import compareVersions = require("compare-versions");
import * as _ from "lodash";
import {REDHAT_QUALIFIER, SNOWDROP_ORG} from "../../constants";
import {githubApi} from "./githubApi";

export interface LatestTagRetriever {
  getLatestTags(booster: string,
                tagFilter?: (t: string) => boolean, token?: string): Promise<BoosterTagTuple>;
}

export interface BoosterTagTuple {
  community: string;
  prod: string;
}

export class DefaultLatestTagRetriever implements LatestTagRetriever {

  public async getLatestTags(booster: string,
                             tagFilter?: (t: string) => boolean,
                             token?: string): Promise<BoosterTagTuple> {

    const filter = tagFilter ? tagFilter : () => true;
    const tagsRegex = /refs\/tags\/(.+)/;

    const params = {owner: SNOWDROP_ORG, repo: booster, per_page: 1000, namespace: 'tags/'};
    const response = await githubApi(token).git.listRefs(params);
    const data = response.data as any[];
    const allTagsSorted =
        data
        .map(r => r.ref as string)
        .filter(t => tagsRegex.test(t))
        .map(r => r.match(tagsRegex)[1])
        .filter(filter)
        .sort(compareVersions);

    const allTagsGroupedAndSorted =
        _.groupBy(allTagsSorted, t => t.includes(REDHAT_QUALIFIER));
    const allCommunityTags = allTagsGroupedAndSorted.false;
    const allProdTags = allTagsGroupedAndSorted.true;

    return {community: _.last(allCommunityTags), prod: _.last(allProdTags)};
  }
}
