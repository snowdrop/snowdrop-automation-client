import {
    CommandHandler,
    failure,
    GitHubRepoRef,
    HandleCommand,
    HandlerContext,
    HandlerResult,
    logger,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    success,
} from "@atomist/automation-client";
import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { editOne } from "@atomist/automation-client/operations/edit/editAll";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { EditResult } from "@atomist/automation-client/operations/edit/projectEditor";
import { resolve } from "path";
import { LICENSES_GENERATOR_PATH } from "../constants";
import licensesGenerator from "../support/transform/booster/licensesGenerator";

@CommandHandler("Generate licenses for a repository", "generate licenses")
export class GenerateLicensesCommand implements HandleCommand {

    @MappedParameter(MappedParameters.GitHubOwner)
    public readonly owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public readonly repository: string;

    @Parameter({
        displayName: "branch",
        required: false,
    })
    public readonly branch: string = "master";

    @Secret(Secrets.UserToken)
    public readonly gitHubToken: string;

    public async handle(context: HandlerContext): Promise<HandlerResult> {
        const editResult =
            await this.generateLicenses(context, this.owner, this.repository, this.branch, this.gitHubToken);
        if (editResult.success) {
            return success();
        }
        return failure(editResult.error);
    }

    private generateLicenses(context: HandlerContext, owner: string, repository: string,
                             branch: string, gitHubToken: string): Promise<EditResult> {
        logger.debug(`Attempting to generate licenses for '${owner}/${repository}' on '${branch}' branch`);

        const credentials = { token: gitHubToken } as TokenCredentials;
        const generator = licensesGenerator(licensesGeneratorPath);
        const commitInfo = { message: "Licenses update", branch } as BranchCommit;
        const repoRef = new GitHubRepoRef(owner, repository, branch);

        return editOne(context, credentials, generator, commitInfo, repoRef);
    }
}

const licensesGeneratorPath = resolve(LICENSES_GENERATOR_PATH);
