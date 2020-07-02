import { expect } from "chai";
import { SNOWDROP_ORG } from "../../../lib/constants";
import GitHub from "../../../lib/support/github/GitHub";
import OctokitGitHub from "../../../lib/support/github/OctokitGitHub";
import { githubToken } from "../../tokens";

describe("OctokitGitHub", () => {
  const github: GitHub = new OctokitGitHub(SNOWDROP_ORG, githubToken());

  it("should get http example tags", async () => {
    const tags: string[] = await github.getTags("rest-http-example");
    expect(tags).to.contain("2.2.6-1", "Contains a known community release");
    expect(tags).to.contain("2.2.6-1-redhat", "Contains a known prod release");
  }).timeout(2000);

  it("should not get tags from a non-existent repo", async () => {
    await github.getTags("wrong-repo")
      .then(tags => Promise.reject(new Error("Wrong repo access error was expected")))
      .catch(error => expect(error).to.be.an("error").with.property("message", "Could not get tags for wrong-repo"));
  }).timeout(2000);
});
