#!/usr/bin/env bash

printf "Starting snowdrop-automation-client (%s)..." "$(pwd)"

if [[ -n "${SENDGRIDKEY+x}" ]];
then
  export SENDGRIDKEY=${SENDGRIDKEY}
fi

exec "$@"
