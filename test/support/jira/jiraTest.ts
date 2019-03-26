import { assert, expect } from "chai";
import nock = require("nock");
import { Jira } from "../../../lib/support/jira/jira";

const host = "https://example.com";
const user = "luke";
const pass = "secret";

describe("jira api", () => {
    it("should get issue", async () => {
        const expectedIssue = { id: "1", key: "testKey" };
        nock(host)
            .matchHeader("accept", "application/json")
            .get("/rest/api/2/issue/testKey")
            .basicAuth({ user, pass })
            .reply(200, expectedIssue);

        const jira = new Jira(host, user, pass);
        const issue = await jira.getIssue("testKey");

        expect(issue).to.deep.equal(expectedIssue);
    });

    it("should create issue", async () => {
        const expectedIssue = { id: "1", key: "testKey" };
        const fields = { testField: "testValue" };
        nock(host)
            .matchHeader("accept", "application/json")
            .post("/rest/api/2/issue", { fields })
            .basicAuth({ user, pass })
            .reply(201, expectedIssue);

        const jira = new Jira(host, user, pass);
        const issue = await jira.createIssue(fields);

        expect(issue).to.deep.equal(expectedIssue);
    });

    it("should get project id", async () => {
        nock(host)
            .matchHeader("accept", "application/json")
            .get("/rest/api/2/issue/createmeta?projectKeys=testKey")
            .basicAuth({ user, pass })
            .reply(200, { projects: [{ id: "1" }] });

        const jira = new Jira(host, user, pass);
        const id = await jira.getProjectId("testKey");

        expect(id).to.equal("1");
    });

    it("should fail to get project", async () => {
        nock(host)
            .matchHeader("accept", "application/json")
            .get("/rest/api/2/issue/createmeta?projectKeys=testKey")
            .basicAuth({ user, pass })
            .reply(200, { projects: [] });

        const jira = new Jira(host, user, pass);
        try {
            await jira.getProjectId("testKey");
        } catch (e) {
            expect(e.message).to.equal("JIRA project testKey was not found");
            return;
        }
        assert.fail("Exception was expected");
    });

    it("should clone issue", async () => {
        const originalIssue = {
            fields: {
                id: "1",
                key: "SB-1",
                issuetype: "task",
                priority: "high",
                assignee: "luke",
                description: "test task",
                summary: "test task",
                subtasks: new Array(),
            },
        };
        const expectedRequestBody = {
            fields: {
                project: { id: "1" },
                issuetype: "task",
                priority: "high",
                assignee: "luke",
                description: "test task",
                summary: "test task",
            },
        };
        nock(host)
            .matchHeader("accept", "application/json")
            .get("/rest/api/2/issue/SB-1")
            .basicAuth({ user, pass })
            .reply(200, originalIssue);
        nock(host)
            .matchHeader("accept", "application/json")
            .post("/rest/api/2/issue", expectedRequestBody)
            .basicAuth({ user, pass })
            .reply(201, { id: "2" });

        const jira = new Jira(host, user, pass);
        const issue = await jira.cloneIssue("SB-1", "1");

        expect(issue).to.deep.equal({ id: "2" });
    });

    it("should clone subtask", async () => {
        const originalIssue = {
            fields: {
                id: "1",
                key: "SB-1",
                issuetype: "sub-task",
                priority: "high",
                assignee: "luke",
                description: "test task",
                summary: "test task",
                subtasks: new Array(),
            },
        };
        const expectedRequestBody = {
            fields: {
                project: { id: "1" },
                parent: { id: "0" },
                issuetype: "sub-task",
                priority: "high",
                assignee: "luke",
                description: "test task",
                summary: "test task",
            },
        };
        nock(host)
            .matchHeader("accept", "application/json")
            .get("/rest/api/2/issue/SB-1")
            .basicAuth({ user, pass })
            .reply(200, originalIssue);
        nock(host)
            .matchHeader("accept", "application/json")
            .post("/rest/api/2/issue", expectedRequestBody)
            .basicAuth({ user, pass })
            .reply(201, { id: "2" });

        const jira = new Jira(host, user, pass);
        const issue = await jira.cloneIssue("SB-1", "1", "0");

        expect(issue).to.deep.equal({ id: "2" });
    });
});
