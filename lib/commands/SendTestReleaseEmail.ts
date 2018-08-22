import {
  CommandHandler,
  HandleCommand,
  HandlerContext,
  HandlerResult,
  Parameter,
  Success,
} from "@atomist/automation-client";
import {sendTestReleaseEmail} from "../support/email/emailUtils";

@CommandHandler("Send Test release email", "send release email")
export class SendTestReleaseEmail implements HandleCommand {

  @Parameter({
    displayName: "release version",
    description: "The Spring Boot release version",
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
