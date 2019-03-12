import {
  HandlerContext,
  HandlerResult,
  Parameter,
  Success,
} from "@atomist/automation-client";
import {sendTestReleaseEmail} from "../support/email/emailUtils";
import {CommandHandler} from "@atomist/automation-client/lib/decorators";
import {HandleCommand} from "@atomist/automation-client/lib/HandleCommand";

@CommandHandler("Send Test release email", "send release email")
export class SendTestReleaseEmail implements HandleCommand {

  @Parameter({
    displayName: "release version",
    description: "The Production Spring Boot release bundle (something like: 1.5.15.ER1)",
    pattern: /^(\d+.\d+.\d+).(ER|CR)\d+/,
    validInput: "1.5.15.ER1",
    minLength: 9,
    maxLength: 20,
    required: true,
  })
  public releaseVersion: string;

  public handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    sendTestReleaseEmail(params.releaseVersion);
    return Promise.resolve(Success);
  }
}
