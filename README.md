# snowdrop-automation-client

## Table of contents

   * [snowdrop-automation-client](#snowdrop-automation-client)
      * [Table of contents](#table-of-contents)
      * [Introduction](#introduction)
      * [Available commands](#available-commands)
      * [Configuration](#configuration)
      * [Running the client locally](#running-the-client-locally)
      * [Running the client in a container](#running-the-client-in-a-container)
      * [Available npm scripts](#available-npm-scripts)
      * [References](#references)

## Introduction

This project implements automation commands used by the Snowdrop team.
The commands are executed with Slack messages and integrate with Atomist SDM.

This application can run in any environment that can run a Node.js application including a server in a private network.


## Available commands

### Update an example property

This command will update a `pom.xml` property of all of the Snowdrop example applications.

Send the following Slack message to Atomist:
```
update boosters maven property
```

You will need to provide a git branch, property name and a new value of the property.


### Create a launcher pull request

This command updates our fork of the Launcher catalog and raises a pull request upstream.

Send the following Slack message to Atomist:
```
create launcher pr
```

You will need to provide a Spring Boot version that should be used by the Launcher (e.g. 2.3.0.RELEASE). The script will figure out which example tags to use based on that version and will update the Launcher accordingly.

### Update an example

TODO

### Generate licenses

This command generates licenses for a Maven project using [Licenses Generator](https://github.com/snowdrop/licenses-generator) and stores them in a `src/licenses` directory.

Send the following Slack message to Atomist:
```
generate licenses
```

You will need to provide a repository's owner, name and branch.

### Release examples

This command releases all the Snowdrop examples. The release entails process entails the following actions:
1. Creating two tags - one with community release and one with prod release.
1. Generating licenses for each of the created tags (see [Generate licenses](#generate-licenses))
1. Bumping a project version in a branch on which this release is based on.

Send the following Slack message to Atomist:
```
release examples
```

You will need to provide a Spring Boot version to which this release is tied (e.g. 2.3.0.RELEASE) and a prod BOM version of this release (e.g. 2.3.0.Final-redhat-00001).

### Release single example

This command is identical to the [Release examples](#release-examples) except it simply releases a single example.

Send the following Slack message to Atomist:
```
release single example
```

In addition to the properties required by the [Release examples](#release-examples) you will need to specify which example do you want to release.

### Send release email

This commands send an email to our QE notifying them that a particular version has been released.

Send the following Slack message to Atomist:
```
send release email
```

You will need to provide a release version (e.g. 2.3.0.Final).

### Update after the BOM release

This command updates all the repositories that depend on our BOM release.
Firstly, it updates the BOM version in all of the Snowdrop examples. It sets a parent version and a Spring Boot property in the examples `pom.xml` files.
Secondly, it updates the BOM repository by appropriately bumping the development version. It calculates the next qualifier (`Beta`, `SP`, `Final`) based on the release version.

Send the following Slack message to Atomist:
```
update for release
```

You will need to provide an upstream version of the release (e.g. 2.3.0.Final).

## Configuration

### Licenses generator

This client uses [Licenses Generator](https://github.com/snowdrop/licenses-generator) java application to generate the licenses. The jar file of the generator and its different configuration files are located in an `etc` directory.

### Launcher catalog

Launcher catalog uses custom IDs and version names for all the runtimes. Our version IDs and name formats are configurable in a `launcher` section of a `config/default.json` file.

### Email

Release notification email is send to a specific QE person. An email and a name of a person is configurable in an `email` section of a `config/default.json` file.

## Running the client locally

### Configure Atomist

The minimal required configuration is a `$HOME/.atomist/client.config.json` file with an API key and a workspace ID:
```json
{
  "apiKey": "API_KEY",
  "workspaceIds": [
    "WORKSPACE_ID"
  ]
}
```

You can get them from our [Atomist configuration dashboard](https://app.atomist.com).

For all the Atomist prerequisites see its [documentation](https://docs.atomist.com/developer/prerequisites).

### Setup Node.js environment

Node.js 8 or newer is required to run the client.
We recommend using the [nvm](https://github.com/nvm-sh/nvm) tool for your Node.js version control.

Once the Node.js is available, install the project dependencies:
```bash
$ npm ci
```

### Start the client

We need to compile the Typescript files and then start the application:
```bash
$ npm run compile && npm start
```

> Note. If you will use an email sending command, make sure a valid `SENDGRIDKEY` environment variable is available before starting the client.

## Running the client in a container

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


## Available npm scripts

Clean the project:
```bash
$ npm run clean
```

Compile the project:
```bash
$ npm run compile
```

Run all tests:
```bash
$ npm run test
```

Run a single test:
```bash
$ TEST=${TEST_FILE_NAME} npm run test:one
```

Compile and test the project:
```bash
$ npm run build
```

Fix lint issues:
```bash
$ npm run lint:fix
```

> Note. Some of the tests require a `GITHUB_TOKEN` environment variable to be available.


## References

* RedHat: [Podman can now ease the transition to Kubernetes and CRI-O](https://developers.redhat.com/blog/2019/01/29/podman-kubernetes-yaml/) blog article
