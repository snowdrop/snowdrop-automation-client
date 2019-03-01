import {
    CommandHandler,
    HandleCommand,
    HandlerContext,
    HandlerResult,
    logger,
    Parameter,
} from "@atomist/automation-client";
import {createIssue} from "../support/jira/jiraUtils";
// tslint:disable:no-var-requires
const config = require("config");

@CommandHandler("Create a JIRA issue", "create jira issue")
export class CreateJiraIssue implements HandleCommand {

    @Parameter({
        displayName: "JIRA username",
    })
    public readonly username: string;

    @Parameter({
        displayName: "JIRA password",
        displayable: false,
    })
    public readonly password: string;

    @Parameter({
        displayName: "Issue summary",
    })
    public readonly summary: string;

    @Parameter({
        displayName: "JIRA project key",
        required: false,
    })
    public readonly project: string = config.get("jira.projectKey");

    @Parameter({
        displayName: "Assignee",
        required: false,
    })
    public readonly assignee: string = config.get("jira.assignee");

    @Parameter({
        displayName: "JIRA host",
        required: false,
    })
    public readonly host: string = config.get("jira.host");

    public async handle(context: HandlerContext): Promise<HandlerResult> {
        logger.debug(`${this.username} is attempting to create a JIRA issue on ${this.host} for `
            + `project=${this.project} with a summery ='${this.summary}' assigned to ${this.assignee}`);

        const response =
            await createIssue(this.host, this.username, this.password, this.project, this.summary, this.assignee);
        const message = `Created a new JIRA issue ${response.key}`;
        logger.debug(message);
        return context.messageClient.respond(message);
    }
}
