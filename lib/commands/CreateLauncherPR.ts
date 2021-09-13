import {
  failure,
  GitHubRepoRef,
  HandlerContext,
  HandlerResult,
  logger,
  MappedParameter,
  MappedParameters,
  Parameter,
  Project,
  RepoRef,
  Secret,
  Secrets,
  SimpleProjectEditor,
  success,
} from "@atomist/automation-client";
import { CommandHandler } from "@atomist/automation-client/lib/decorators";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { relevantRepos } from "@atomist/automation-client/lib/operations/common/repoUtils";
import { editOne } from "@atomist/automation-client/lib/operations/edit/editAll";
import { BranchCommit } from "@atomist/automation-client/lib/operations/edit/editModes";
import { File } from "@atomist/automation-client/lib/project/File";
import { allReposInTeam } from "@atomist/sdm";
import { DefaultRepoRefResolver } from "@atomist/sdm-core";
import { BOOSTER_CATALOG_REPO } from "../constants";
import { LauncherCatalogUpdater } from "../support/catalog/LauncherCatalogUpdater";
import GitHub from "../support/github/GitHub";
import OctokitGitHub from "../support/github/OctokitGitHub";
import { boosterRepos } from "../support/repo/boosterRepo";

@CommandHandler("Create launcher PR", "create launcher pr")
export class CreateLauncherPR implements HandleCommand {

  @Parameter({
    displayName: "spring boot version",
    description: "The Spring Boot version - something like: 2.1.12.RELEASE",
    pattern: /^\d+.\d+.\d+.*$/,
    validInput: "2.1.12.RELEASE",
    minLength: 5,
    maxLength: 14,
    required: true,
  })
  public springBootVersion: string;

  @MappedParameter(MappedParameters.GitHubOwner)
  public owner: string;

  @Secret(Secrets.UserToken)
  public githubToken: string;

  public async handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    logger.debug("Attempting to create a Pull Request to the launcher catalog with the latest booster releases");
    const github = new OctokitGitHub(this.owner, params.githubToken);
    const branch = `update-to-spring-boot-${this.springBootVersion}`;
    const message = `Update Spring Boot to ${this.springBootVersion}`;
    try {
      await github.rebase(BOOSTER_CATALOG_REPO, "master", "master");
      await this.edit(context, github, branch, message);
      await github.raisePullRequest(BOOSTER_CATALOG_REPO, branch, "master", message);
    } catch (e) {
      logger.warn(JSON.stringify(e));
      context.messageClient.respond("Failed to update the launcher catalog: " + e.message);
      return failure(e);
    }
    return success();
  }

  private async edit(context: HandlerContext, github: GitHub, branch: string, message: string): Promise<void> {
    await editOne(
      context,
      { token: this.githubToken },
      this.getEditor(context, github, this.springBootVersion),
      { branch, message } as BranchCommit,
      GitHubRepoRef.from({ owner: this.owner, repo: BOOSTER_CATALOG_REPO }),
      undefined,
    );
  }

  private getEditor(context: HandlerContext, github: GitHub, springBootVersion: string): SimpleProjectEditor {
    return async (project): Promise<Project> => {
      const catalogUpdater: LauncherCatalogUpdater = new LauncherCatalogUpdater(github);
      const examples: RepoRef[] = await this.getExamples(context);
      await this.editCatalog(project, catalogUpdater, examples, springBootVersion);
      await this.editMetadata(project, catalogUpdater, springBootVersion);
      return project;
    };
  }

  private async getExamples(context: HandlerContext): Promise<RepoRef[]> {
    return await relevantRepos(
      context,
      allReposInTeam(new DefaultRepoRefResolver()),
      boosterRepos(this.githubToken),
    );
  }

  private async editCatalog(
    project: Project, catalogUpdater: LauncherCatalogUpdater, examples: RepoRef[],
    springBootVersion: string): Promise<void> {

    const catalog: File = project.findFileSync("catalog.json");
    const content: string =
      await catalogUpdater.updateCatalog(catalog.getContentSync(), examples, springBootVersion);
    catalog.setContentSync(content);
  }

  private async editMetadata(
    project: Project, catalogUpdater: LauncherCatalogUpdater, springBootVersion: string): Promise<void> {

    const metadata: File = project.findFileSync("metadata.json");
    const content: string = await catalogUpdater.updateMetadata(metadata.getContentSync(), springBootVersion);
    metadata.setContentSync(content);
  }
}
