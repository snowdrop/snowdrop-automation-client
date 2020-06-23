import { expect } from "chai";
import {
  bomVersionToSpringBootVersion, getNextExampleVersion, versionToBranch, versionToExampleBranch,
} from "../../../lib/support/utils/versions";

describe("versionToBranch", () => {
  it("should get branch for 2.2.5.RELEASE", () => {
    expect(versionToBranch("2.2.2.RELEASE")).to.be.equal("sb-2.2.x");
  });

  it("should get branch for 1.2.3.Final", () => {
    expect(versionToBranch("1.2.3.Final")).to.be.equal("sb-1.2.x");
  });

  it("should fail with wrong version", () => {
    try {
      versionToBranch("wrong-version");
      expect.fail("expected exception");
    } catch (e) {
      expect(e.message).to.equal("Unsupported version format 'wrong-version'");
    }
  });
});

describe("versionToExampleBranch", () => {
  it("should get branch for 1.5.0.RELEASE", () => {
    expect(versionToExampleBranch("1.5.0.RELEASE")).to.be.equal("master");
  });

  it("should get branch for 2.2.5.RELEASE", () => {
    expect(versionToBranch("2.2.2.RELEASE")).to.be.equal("sb-2.2.x");
  });

  it("should fail with wrong version", () => {
    try {
      versionToExampleBranch("wrong-version");
      expect.fail("expected exception");
    } catch (e) {
      expect(e.message).to.equal("Unsupported version format 'wrong-version'");
    }
  });
});

describe("getNextExampleVersion", () => {
  it("should get next version with qualifier", () => {
    expect(getNextExampleVersion("2.2.5-2-SNAPSHOT")).to.be.equal("2.2.5-3-SNAPSHOT");
  });

  it("should get next version without qualifier", () => {
    expect(getNextExampleVersion("2.2.5-2")).to.be.equal("2.2.5-3");
  });

  it("should fail with wrong version", () => {
    try {
      versionToExampleBranch("wrong-version");
      expect.fail("expected exception");
    } catch (e) {
      expect(e.message).to.equal("Unsupported version format 'wrong-version'");
    }
  });
});

describe("bomVersionToSpringBootVersion", () => {
  it("should get spring boot version", () => {
    expect(bomVersionToSpringBootVersion("2.2.6.Final")).to.be.equal("2.2.6.RELEASE");
  });

  it("should fail with wrong version", () => {
    try {
      bomVersionToSpringBootVersion("wrong-version");
      expect.fail("expected exception");
    } catch (e) {
      expect(e.message).to.equal("Unsupported version format 'wrong-version'");
    }
  });
});
