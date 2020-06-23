import {Failure, Success} from "@atomist/automation-client";
import Email = require("email-templates");
// tslint:disable:no-var-requires
const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
const config = require("config");

const transport = nodemailer.createTransport(
    nodemailerSendgrid({
      apiKey: config.get("email.sendgridkey"),
    }),
);

const receiverEmail = config.get("email.test.release.email");
const receiverName = config.get("email.test.release.name");

export function sendTestReleaseEmail(releaseVersion: string) {
  const email = new Email({
    message: {
      from: "rh-spring-engineering@redhat.com",
    },
    send: true,
    preview: false,
    transport,
  });

  email
  .send({
    template: "test-release",
    message: {
      to: receiverEmail,
    },
    locals: {
      name: receiverName,
      release: releaseVersion,
    },
  }).then(Success, Failure);
}
