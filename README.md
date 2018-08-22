# snowdrop-automation-client

Contains automation used by the snowdrop team

## Basics

The automation client is a NodeJS application that communicates with the Atomist API in order to
perform operations an receive events.

This application can anywhere a NodeJS application can run. One thing to note is that it can also
run inside a private network since it uses Websockets to communicate with the Atomist API.

## Running

### Prerequisites

* Node 8.x or higher

Install dependencies by executing:

`npm install`

### Launch application

Before launching the application the following environment variables need to be set:

| Name        | Purpose           | Mandatory? |
| ------------- |:-------------:| -----: |
| GITHUB_TOKEN      | Github api key needed by Atomist | Yes |
| SENDGRIDKEY      | Sendgrid api key needed for sending email | No |

Launch application by issuing:

`npm run clean && npm run compile && npm start`

## Miscellaneous

Run tests: `npm run test`

Lint code (and fix issues automatically): `npm run lint:fix`