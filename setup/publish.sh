#!/bin/bash

# A script to publish the smart contract under ../move/blackjack
# On successful deployment, the script updates the env files setup/.env and app/.env
# The env files are updated with env variables to represent the newly created objects

# check this is being run from the right location
if [[ "$PWD" != *"/setup" ]]; then
    echo "Please run this from ./setup"
    exit 0
fi

# check dependencies are available
for dep in jq curl sui; do
    if !command -V ${i} 2>/dev/null; then
        echo "Please install lib ${dep}"
        exit 1
    fi
done

# check for command line arg
if [ $# -ne 1 ]; then
    echo "Usage: ./publish.sh <testnet|devnet|local>"
    exit 1
fi

# check for admin address env var
if [ -z "${ADMIN_ADDRESS}" ]; then
    echo "Please setup env var ADMIN_ADDRESS with the client address to publish from"
    echo "E.g. export ADMIN_ADDRESS=\$(sui client active-address)"
    exit 1
fi

MOVE_PACKAGE_PATH="../move/blackjack"
ENV=$1
NETWORK=
SUFFIX=

# setup network
case "$ENV" in
"testnet")
    NETWORK="https://fullnode.testnet.sui.io:443"
    ;;
"devnet")
    NETWORK="https://fullnode.devnet.sui.io:443"
    ;;
"local")
    ENV="local"
    NETWORK="http://localhost:9000"
    SUFFIX=".local"
    ;;
*)
    echo "Unknown env $ENV"
    exit 1 
esac

# Switch to client to publish
echo "Switching to client: ${ADMIN_ADDRESS}"
sui client switch --address ${ADMIN_ADDRESS}

# Switch to selected env
echo "Switching to env: {$ENV}"
sui client switch --env $ENV

# Do actual puslish
echo "Do actual publish"
PUBLISH_RES=$(sui client publish --skip-fetch-latest-git-deps --json ${MOVE_PACKAGE_PATH})

echo ${PUBLISH_RES} > .publish.res.json

# Check if the command succeeded (exit status 0) and for success in text
if [[ "$PUBLISH_RES" =~ "error" && "$PUBLISH_RES" != *"Success"* ]]; then
    # If yes, print the error message and exit the script
    echo "Error during move contract publishing. Details : $PUBLISH_RES"
    exit 1
fi

# Publish success
echo "Publish successful"
echo "Creating new env variables"
PUBLISHED_OBJS=$(echo "$PUBLISH_RES" | jq -r '.objectChanges[] | select(.type == "published")')
PACKAGE_ID=$(echo "$PUBLISHED_OBJS" | jq -r '.packageId')
CREATED_OBJS=$(echo "$PUBLISH_RES" | jq -r '.objectChanges[] | select(.type == "created")')
HOUSE_ADMIN_CAP=$(echo "$CREATED_OBJS" | jq -r 'select (.objectType | contains("single_player_blackjack::HouseAdminCap")).objectId')

echo "Publish new env var to setup/.env: "
echo "SUI_NETWORK=$NETWORK"
echo "PACKAGE_ADDRESS=$PACKAGE_ID"
echo "ADMIN_ADDRESS=$ADMIN_ADDRESS"
echo "HOUSE_ADMIN_CAP=$HOUSE_ADMIN_CAP"
cat >.env<<-API_ENV
SUI_NETWORK=$NETWORK
PACKAGE_ADDRESS=$PACKAGE_ID
ADMIN_ADDRESS=$ADMIN_ADDRESS
HOUSE_ADMIN_CAP=$HOUSE_ADMIN_CAP
API_ENV

echo "Publish new env var to app/.env"
echo "NEXT_PUBLIC_SUI_NETWORK=$NETWORK"
echo "NEXT_PUBLIC_PACKAGE_ADDRESS=$PACKAGE_ID"
echo "NEXT_PUBLIC_ADMIN_ADDRESS=$ADMIN_ADDRESS"
cat >../app/.env$SUFFIX<<-VITE_API_ENV
NEXT_PUBLIC_SUI_NETWORK=$NETWORK
NEXT_PUBLIC_PACKAGE_ADDRESS=$PACKAGE_ID
NEXT_PUBLIC_ADMIN_ADDRESS=$ADMIN_ADDRESS
VITE_API_ENV

echo "Done - Proceed to run the setup scripts"
