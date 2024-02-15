# Setup

## Description

This is the Typescript setup project of the Sui Blackjack game. It contains:

- environment variable (`.env`) file reading
- Sui SDK integration
- shell script to publish the smart contracts and populate the `.env` file

## Environment variables

- Create a `.env` file following the format of the `.env.example` file, to insert the target sui network, or any other env. variables you need
- `.env` file is not tracked by Git
- Add the corresponding export statements in the `src/config.ts` file
- Create an environment variable `ADMIN_SECRET_KEY` (OS Variable, not inside the `.env` file) to hold the **secret key** of the **_admin (Dealer) account._**
- Create an environment variable `BJ_PLAYER_SECRET_KEY` (OS Variable, not inside the `.env` file) to hold the secret key of the **_demo player account._**

- The format for the env variables is : `VAR_NAME="your_secret_key_here"`

## Warning!

DO NOT ADD THE ADMIN SECRET KEY IN ANY PLACE INSIDE THE CODE BASE!

## Quickstart

- cd into the setup/ directory: `cd setup/`
- install the npm dependencies with: `npm i`
- initialize your `environmental variables` based on the previous section of the README.md file

- Two ways to run the intergration tests:
  - Run a whole e2e scenario with a single script:
    1. Publish the contracts with: `./publish.sh testnet`
    2. Initialize the house data with: `npm run init-house` (admin account needs to have at least 10 SUI + gas, to top-up the initial house funds)
    3. Run a custom scenario with: `npm run scenario -- request-hit house-hit request-stand house-stand`
  - Run the e2e scenario in multiple steps:
    1. publish the contracts with: `./publish.sh testnet`
    2. Run these scripts consecutively to prepare and run a custom game:
       1. `npm run init-house`
       2. `npm run create-counter`
       3. `npm run create-game`
       4. `npm run initial-deal`
       5. `npm run player-hit-request`
       6. `npm run house-hit`
       7. `npm run player-stand-request`
       8. `npm run house-stand`

## Npm scripts to generate and run e2e flows

A first approach is executing the npm scripts that execute single steps of a whole e2e flow, and store the created objects ids in the .env file, to reuse them in upcoming executions. <br />

> In this approach the following scripts can be executed:
>
> - `npm run init-house`
> - `npm run create-counter`
> - `npm run create-game`
> - `npm run initial-deal`
> - `npm run player-hit-request`
> - `npm run player-stand-request`
> - `npm run house-hit`
> - `npm run house-stand`

Another approach is to use the custom `Scenario` class (as defined in `setup/src/helpers/scenario/Scenario.ts`), in order to generate and run whole e2e flows of a custom game scenario. <br />

> In this approach, we can use the npm script:
>
> - `npm run scenario -- <step> <step> ....`
>
> Where each step is one of the strings:
>
> - request-stand
> - request-hit
> - house-stand
> - house-hit
>
> For example, to generate and run a custom game scenario, where the player just makes a hit and then a stand move, we can just run the script:
>
> - `npm run scenario -- request-hit house-hit request-stand house-stand`

## Project structure

- `publish.sh`: the publish script
- `src/`:
  - `config.ts`: retrieves and exports the specified environmental variables of the .env file (and the host machine)
  - `helpers/`:
    - `actions/`: various helper functions to isolate the reusable steps of the process (eg initialize house data, request hit by player, etc)
    - `bls/`: helper functions for the bls signatures utilities
    - `cards/`: helper functions for the deck of the cards
    - `general/`: general helper functions
    - `getObject/`: helper functions for reading specific objects
    - `keypair/`: helper functions for handling the keypairs
    - `scenario/`: a custom `Scenario` class that is used to create and run easily e2e flows with as much reusability as possible
  - `scripts/`: typescript scripts that can be used to play the game in headless mode step by step, reading and writing the in between object IDs in the `setup/.env` file
    - `00-initializeHouseData`: Invokes the `initialize_house_data` Move function that initializes the game. Should only run once.
    - `01-createCounterObjectByPlayer`: Creates a Counter NFT object for the player. Should only run once if the player does not have a Counter NFT object.
    - `02-createGameByPlayer`: **Player** invokes the `place_bet_and_create_game` Move function that creates a game for the player.
    - `03-initialDeal`: **Dealer** invokes the `first_deal` Move function that performs the initial deal of the game.
    - `04-playerHitRequest`: **Player** invokes the `do_hit` Move function that records the player's intent to hit.
    - `05-HouseRespondtoHitRequest`: **Dealer** invokes the `hit` Move function that performs the hit action.
    - `06-playerStandRequest`: **Player** invokes the `do_stand` Move function that records the player's intent to stand.
    - `07-HouseRespondtoStandRequest`: **Dealer** invokes the `stand` Move function that performs the stand action.
    - `08-GetGameObject`: Retrieves and logs in the console the game object from chain, using the GAME_ID of the .env file
    - `09-TopUpHouse`: Adds 1K SUI to the balance of the HOUSE_DATA object
    - `10-WithDrawHouse`: **Admin** Withdraws all the available balance from the HOUSE_DATA
  - `types/`: the typescript types and interfaces used throughout the setup project
  - `customScenario.ts`: the generic script that is called when executing `npm run scenario -- <args>` to create and run a totally custom e2e test scenario
  - `scenarioStand.ts`: a simple e2e scenario where a new game is initialized, and the player makes only a stand move after the initial deal
  - `scenarioHitAndStand.ts`: a simple e2e scenario where a new game is initialized, and the player makes a hit and a stand move after the initial deal

## Local Deployment

- Run the deployment script: `./publish.sh`

## Testnet Deployment

- Switch your local cli to _testnet_ env first:

```shell
sui client switch --env testnet
cd setup
./publish testnet
```
