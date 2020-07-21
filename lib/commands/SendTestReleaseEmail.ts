import { failure, HandlerContext, HandlerResult, logger, Parameter, success } from "@atomist/automation-client";
import { CommandHandler } from "@atomist/automation-client/lib/decorators";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { sendTestReleaseEmail } from "../support/utils/email";

@CommandHandler("Send Test release email", "send release email")
export class SendTestReleaseEmail implements HandleCommand {

  @Parameter({
    displayName: "release version",
    description: "The Production Spring Boot release bundle, full version string including qualifier (e.g. 1.5.15.ER1)",
    pattern: /^(\d+.\d+.\d+).(ER|CR)\d+/,
    validInput: "1.5.15.ER1",
    minLength: 9,
    maxLength: 20,
    required: true,
  })
  public releaseVersion: string;

  public async handle(context: HandlerContext, params: this): Promise<HandlerResult> {
    try {
      await sendTestReleaseEmail(params.releaseVersion);
    } catch (e) {
      logger.warn(JSON.stringify(e));
      return failure(e);
    }
    return success();
  }
}
