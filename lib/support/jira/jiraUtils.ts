import { get, post } from "request-promise";

async function getCreateMeta(host: string, username: string, password: string, projectKey: string): Promise<any> {
    const options = {
        auth: {
            user: username,
            pass: password
        },
        json: true
    }
    return get(`${host}/rest/api/2/issue/createmeta?projectKeys=${projectKey}`, options);
}

export async function createIssue(host: string, username: string, password: string, projectKey: string, summary: string, assignee: string): Promise<any> {
    // Project ID is set later once createmeta is received. This could also be done for an issue type id
    const options = {
        auth: {
            user: username,
            pass: password
        },
        body: {
            fields: {
                project: {
                    id: ""
                },
                summary: summary,
                issuetype: {
                    id: 3
                },
                assignee: {
                    name: assignee
                }
            }
        },
        json: true
    };

    return getCreateMeta(host, username, password, projectKey)
        .then(meta => {
            if (meta.projects.length == 1) {
                return meta.projects[0];
            }
            throw new Error(`JIRA project ${projectKey} was not found`);
        })
        .then(project => options.body.fields.project.id = project.id)
        .then(() => post(`${host}/rest/api/2/issue`, options))
        .catch(error => {
            if (error.statusCode) {
                throw new Error(`Failed to create JIRA issue. HTTP status code ${error.statusCode}`);
            }
            throw error;
        });
}