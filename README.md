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
| ATOMIST_CONFIG    | See [this](https://docs.atomist.com/developer/prerequisites/#environment-variable) | Yes | 
| SENDGRIDKEY      | Sendgrid api key needed for sending email | No |

And example of `ATOMIST_CONFIG` would be:

export ATOMIST_CONFIG='{"token":"xxxxxx","workspaceIds":["xxxx"]}'

The token is the Github token of the user

Also note that the above configuration can be put in a file at `~/.atomist/client.config.json`
which would look like:

```
{
  "workspaceIds": [
    "xxxx"
  ],
  "token": "xxxxxx"
}
~ 
```

Launch application by issuing:

`npm run clean && npm run compile && npm start`

## Miscellaneous

Run tests: `npm run test` (will need an env var named GITHUB_TOKEN to be present and contain the user's Github token)

Lint code (and fix issues automatically): `npm run lint:fix`