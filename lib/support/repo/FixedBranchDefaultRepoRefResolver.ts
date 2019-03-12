import {RemoteRepoRef} from "@atomist/automation-client";
import {CoreRepoFieldsAndChannels} from "@atomist/sdm";
import {DefaultRepoRefResolver} from "@atomist/sdm-core";

export class FixedBranchDefaultRepoRefResolver extends DefaultRepoRefResolver {

    private branch: string;

    constructor(branch: string) {
        super();
        this.branch = branch;
    }

    public toRemoteRepoRef(repo: CoreRepoFieldsAndChannels.Fragment,
                           opts?: { sha?: string; branch?: string }): RemoteRepoRef {
        return super.toRemoteRepoRef(repo, {branch: this.branch});
    }
}
