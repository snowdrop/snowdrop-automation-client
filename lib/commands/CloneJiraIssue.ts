import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { CommandHandler, Parameter } from "@atomist/automation-client/lib/decorators";
import { HandlerContext, HandlerResult, logger } from "@atomist/automation-client";
import { Jira } from "../support/jira/jira";
// tslint:disable:no-var-requires
const config = require("config");

@CommandHandler("Clone JIRA issue", "clone jira issue")
export class CloneJiraIssue implements HandleCommand {
    @Parameter({
        description: "JIRA issue to clone"
    })
    public readonly issueKey: string;

    @Parameter({
        description: "JIRA username",
    })
    public readonly user: string;

    @Parameter({
        description: "JIRA password",
        displayable: false,
    })
    public readonly pass: string;

    @Parameter({
        description: "JIRA host",
        required: false,
    })
    public readonly host: string = config.get("jira.host");

    @Parameter({
        description: "JIRA project key",
        required: false,
    })
    public readonly projectKey: string = config.get("jira.projectKey");

    public async handle(context: HandlerContext): Promise<HandlerResult> {
        const jira = new Jira(this.host, this.user, this.pass);
        const projectId = await jira.getProjectId(this.projectKey);
        const result = await jira.cloneIssue(this.issueKey, projectId);

        const message = `Created a new JIRA issue ${this.host}/browse/${result.key}`;

        logger.debug(message);
        return context.messageClient.respond(message);
    }
}