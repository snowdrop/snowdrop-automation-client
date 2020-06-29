# snowdrop-automation-client

## Table of contents

   * [snowdrop-automation-client](#snowdrop-automation-client)
      * [Table of contents](#table-of-contents)
      * [Basics](#basics)
      * [Running](#running)
         * [Prerequisites](#prerequisites)
         * [Launch application](#launch-application)
      * [Install specific nvm version](#install-specific-nvm-version)
      * [Miscellaneous](#miscellaneous)
      * [Run in a container](#run-in-a-container)
         * [buildah/podman](#buildahpodman)
            * [Building the container](#building-the-container)
            * [Running the container](#running-the-container)
            * [k8s](#k8s)
         * [Docker](#docker)
            * [Build with docker-compose](#build-with-docker-compose)
            * [Run with docker](#run-with-docker)
      * [References](#references)

## Introduction

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

## Install specific nvm version

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

## Run as container

The `snowdrop-automation-client` can be ran in a container. This allows having a ready to use environment which isn't affected by local npm or JDK versions, as has been proved to affect the behavior of the application.

To build the container a [`Dockerfile`](Dockerfile) has been prepared.

### buildah/podman

#### Building the container

Remove the existing container.

```bash
$ podman image rm localhost/snowdrop-automation-client
```

Build the new container using the `Dockerfile`.

```bash
$ buildah build-using-dockerfile --tag snowdrop-automation-client
```

#### Running the container

The information described in the [prerequisites](#prerequisites) is not built inside the contaienr and needs to be passed as environment variables. This can be easily done using a file with environement variables.

> NOTE: This file should be out of the git repository folder.

An example of such a file is the following...

```environement
ATOMIST_CONFIG={"apiKey":"API_KEY","workspaceIds":["WORKSPACE_ID"]}
SENDGRIDKEY=SENDGRIDKEY_KEY
```

...replace the `API_KEY`, `WORKSPACE_ID` and `SENDGRIDKEY_KEY` as described above at the [prerequisites](#prerequisites) section.

Start the container with podman.

```bash
$ podman run --rm --env-file ../snowdrop-automation-client.properties --name snowdrop-automation-client localhost/snowdrop-automation-client
```

> NOTE: The `--rm` flag is optional and removes the container once it's finished.

#### k8s

Once the container is running it's possible to generate a kubernetes `yaml` file using podman...

```bash
$ podman generate kube snowdrop-automation-client > snowdrop-automation-client.yml
```

### Docker

*TBD...*

#### Build with `docker-compose`

*TBD...*

#### Run with docker

*TBD...*

## References

* RedHat: [Podman can now ease the transition to Kubernetes and CRI-O](https://developers.redhat.com/blog/2019/01/29/podman-kubernetes-yaml/) blog article
