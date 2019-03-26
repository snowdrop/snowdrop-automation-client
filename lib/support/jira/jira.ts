import { get, post } from "request-promise";

export class Jira {
    private readonly options: object;
    private readonly host: string;

    constructor(host: string, user: string, pass: string) {
        this.host = host;
        this.options = {
            json: true,
            auth: {
                user,
                pass,
            },
        };
    }

    /**
     * Get JIRA issue by key as a JSON object.
     *
     * @param key JIRA issue key.
     */
    public async getIssue(key: string) {
        return get(`${this.host}/rest/api/2/issue/${key}`, this.options);
    }

    /**
     * Create a new JIRA issue with provdied fields.
     * See https://docs.atlassian.com/software/jira/docs/api/REST/7.12.1/#api/2/issue-createIssue for the available
     * fields.
     *
     * @param fields Fields to be filled for a new issue. Default: empty object.
     */
    public async createIssue(fields = {}) {
        const createOptions = {
            body: {
                fields,
            },
            ...this.options,
        };
        return post(`${this.host}/rest/api/2/issue`, createOptions);
    }

    /**
     * Clone a JIRA issue by key. The new issue will be assigned to a project based on the provided ID which can be
     * different than the original issue's project.
     * However, if the issue is a subtask its project has to be the same as the parent's project.
     *
     * All issue subtasks will be also cloned recursively.
     *
     * @param key Original JIRA issue key.
     * @param projectId Project to which new issue should be assigned.
     * @param parentId If the issue being cloned is a subtask, it requires a parent id.
     */
    public async cloneIssue(key: string, projectId: string, parentId?: string) {
        const originalIssue = await this.getIssue(key);
        const fields = {
            project: { id: projectId },
            parent: parentId ? { id: parentId } : originalIssue.fields.parent,
            issuetype: originalIssue.fields.issuetype,
            priority: originalIssue.fields.priority,
            assignee: originalIssue.fields.assignee,
            description: originalIssue.fields.description ? originalIssue.fields.description : "",
            summary: originalIssue.fields.summary ? originalIssue.fields.summary : "",
        };

        const newIssue = await this.createIssue(fields);

        await originalIssue.fields.subtasks.forEach(async (subtask: { key: string; }) => {
            await this.cloneIssue(subtask.key, projectId, newIssue.id);
        });

        return newIssue;
    }

    /**
     * Get project ID based on its key.
     *
     * @param projectKey Key of the project.
     */
    public async getProjectId(projectKey: string) {
        const meta = await get(`${this.host}/rest/api/2/issue/createmeta?projectKeys=${projectKey}`, this.options);
        if (meta.projects.length !== 1) {
            throw new Error(`JIRA project ${projectKey} was not found`);
        }
        return meta.projects[0].id;
    }
}
