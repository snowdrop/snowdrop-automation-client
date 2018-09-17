import {logger} from "@atomist/automation-client";

export const SlackTeamId = "A7BRBZRRH";

export function githubToken(): string {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    logger.debug("Unable to resolve token from environment (GITHUB_TOKEN)");
  }

  return token;
}
