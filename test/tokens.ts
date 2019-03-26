import {logger} from "@atomist/automation-client";
import * as fs from "fs";
import * as os from "os";

export const SlackTeamId = "A7BRBZRRH";

export function githubToken(): string {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    logger.debug("Unable to resolve token from environment (GITHUB_TOKEN)");
  }

  return token;
}

export function apiToken(): string {
  const apiKey = process.env.API_KEY;

  if (apiKey) {
    return apiKey;
  }

  const homedir = os.homedir();
  const fileContent = fs.readFileSync(`${homedir}/.atomist/client.config.json`, "utf8");
  const jsonData = JSON.parse(fileContent) as any;
  return jsonData.apiKey;
}
