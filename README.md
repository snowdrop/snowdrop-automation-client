# snowdrop-automation-client

## Table of contents
   * [snowdrop-automation-client](#snowdrop-automation-client)
      * [Basics](#basics)
      * [Running](#running)
         * [Prerequisites](#prerequisites)
         * [Launch application](#launch-application)
      * [Install specific vnm version](#install-specific-vnm-version)
      * [Miscellaneous](#miscellaneous)

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

## Install specific vnm version

To manage specific node versions, as the application requires Node 8.x, install `nvm` (Node Version Manager), instructions [here](https://github.com/nvm-sh/nvm).

With `nvm` installed, use it install the latest 8.x node version.

```bash
$ nvm install 8
```

To use that specific version execute the following.

```bash
$ nvm use 8
```

## Miscellaneous

Run tests: `npm run test` (will need an env var named GITHUB_TOKEN to be present and contain the user's Github token)

Run a single test: `TEST=${TEST_FILE_NAME} npm run test:one`

Lint code (and fix issues automatically): `npm run lint:fix`