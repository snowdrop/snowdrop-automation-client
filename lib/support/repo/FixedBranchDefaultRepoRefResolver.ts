import {RemoteRepoRef} from "@atomist/automation-client";
import {DefaultRepoRefResolver} from "@atomist/sdm-core";
import {CoreRepoFieldsAndChannels} from "@atomist/sdm";

export class FixedBranchDefaultRepoRefResolver extends DefaultRepoRefResolver {

    private branch: string;

    constructor(branch: string) {
        super();
        this.branch = branch;
    }

    public toRemoteRepoRef(repo: CoreRepoFieldsAndChannels.Fragment, opts?: { sha?: string; branch?: string }): RemoteRepoRef {
        return super.toRemoteRepoRef(repo, {branch: this.branch});
    }
}
