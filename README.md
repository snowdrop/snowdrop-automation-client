# snowdrop-automation-client

Contains automation used by the snowdrop team

## Basics

The automation client is a NodeJS application that communicates with the Atomist API in order to
perform operations an receive events.

This application can anywhere a NodeJS application can run. One thing to note is that it can also
run inside a private network since it uses Websockets to communicate with the Atomist API.

## Running

### Prerequisites

* Properly configure your environment in order for Atomist to be able to work. See [this](https://docs.atomist.com/developer/prerequisites/)

Of particular importance is the `Minimal Configuration` section which mentions that at the very least, a file named `$HOME/.atomist/client.config.json`
is needed containing the following information

```
{
  "apiKey": "API_KEY",
  "workspaceIds": [
    "WORKSPACE_ID"
  ]
}
```

with API_KEY and WORKSPACE_ID replaced with your Atomist API key and workspace ID, respectively. 

* Node 8.x or higher

Install dependencies by executing:

`npm install`

### Launch application

Before launching the application the following environment variables need to be set:

| Name        | Purpose           | Mandatory? |
| ------------- |:-------------:| -----: |
| SENDGRIDKEY      | Sendgrid api key needed for sending email | No |

Launch application by issuing:

`npm run clean && npm run compile && npm start`

## Miscellaneous

Run tests: `npm run test` (will need an env var named GITHUB_TOKEN to be present and contain the user's Github token)

Run a single test: `TEST=${TEST_FILE_NAME} npm run test:one`

Lint code (and fix issues automatically): `npm run lint:fix`