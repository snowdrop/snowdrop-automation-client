import * as config from "config";
import * as EmailTemplate from "email-templates";
import { createTransport } from "nodemailer";
import * as nodemailerSendgrid from "nodemailer-sendgrid";

const transport = createTransport(
  nodemailerSendgrid({
    apiKey: config.get("email.sendgridkey"),
  }),
);

const receiverEmail: string = config.get("email.test.release.email");
const receiverName: string = config.get("email.test.release.name");

export async function sendTestReleaseEmail(releaseVersion: string) {
  const email = new EmailTemplate({
    message: {
      from: "rh-spring-engineering@redhat.com",
    },
    send: true,
    preview: false,
    transport,
  });
  await email.send({
    template: "test-release",
    message: {
      to: receiverEmail,
    },
    locals: {
      name: receiverName,
      release: releaseVersion,
    },
  });
}
