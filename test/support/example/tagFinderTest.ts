import { expect } from "chai";
import { latestCommunityTagFinder, latestProdTagFinder } from "../../../lib/support/example/tagFinder";

const tags = [
  "1.5.0-1",
  "1.5.0-1-redhat",
  "1.5.0-2",
  "1.5.0-2-redhat",
  "2.3.0-9",
  "2.3.0-9-redhat",
  "2.3.0-10",
  "2.3.0-10-redhat",
];

describe("latestCommunityTagFinder", () => {
  it("get latest single digit community tag", () => {
    expect(latestCommunityTagFinder.find(tags, "1.5.0.RELEASE")).to.be.equal("1.5.0-2");
  });

  it("get latest double digit community tag", () => {
    expect(latestCommunityTagFinder.find(tags, "2.3.0.RELEASE")).to.be.equal("2.3.0-10");
  });

  it("should not get non-existent community tag", () => {
    expect(latestCommunityTagFinder.find(tags, "1.2.3.RELEASE")).to.be.equal(null);
  });
});

describe("latestProdTagFinder", () => {
  it("get latest single digit prod tag", () => {
    expect(latestProdTagFinder.find(tags, "1.5.0.RELEASE")).to.be.equal("1.5.0-2-redhat");
  });

  it("get latest double digit prod tag", () => {
    expect(latestProdTagFinder.find(tags, "2.3.0.RELEASE")).to.be.equal("2.3.0-10-redhat");
  });

  it("should not get non-existent prod tag", () => {
    expect(latestProdTagFinder.find(tags, "1.2.3.RELEASE")).to.be.equal(null);
  });
});
