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
- Create an environment variable `ADMIN_PHRASE` (OS Variable, not inside the `.env` file) to hold the **seed phrase** of the **_admin (Dealer) account._**
- Create an environment variable  `BJ_PLAYER_SECRET_KEY` (OS Variable, not inside the `.env` file) to hold the secret key of the **_demo player account._**

- The format for the env variables is : `VAR_NAME="your_secret_key_here"`


#### Note
The `ADMIN_PHRASE` is used only in the `publish.sh` script to load the admin account. It is not used anywhere else in the code base.

## Warning!
DO NOT ADD THE ADMIN SECRET KEY IN ANY PLACE INSIDE THE CODE BASE!



## Project structure

- `publish.sh`: the publish script
- `src/`:
  - `config.ts`: retrieves and exports the specified environmental variables of the .env file (and the host machine)
  - `00-initializeHouseData`: Invokes the `initialize_house_data` Move function that initializes the game. Should only run once.
  - `01-createCounterObjectByPlayer`: Creates a Counter NFT object for the player. Should only run once if the player does not have a Counter NFT object.
  - `99-RunWebsocketListenerFlow`: Starts the websocket server which listens for incoming websocket connections from the frontend. 
  **This is required for the UI to work correctly!**


  The following Files should be called if you want to play the game in headless (NO UI) mode:
  - `02-createGameByPlayer`: **Player** invokes the `place_bet_and_create_game` Move function that creates a game for the player 
and places the created game id in the `.env` file. 
  - `03-initialDeal`: **Dealer** invokes the `first_deal` Move function that performs the initial deal of the game.
  - `04-playerHitRequest`: **Player** invokes the `do_hit` Move function that records the player's intent to hit.
  - `05-HouseRespondtoHitRequest`: **Dealer** invokes the `hit` Move function that performs the hit action.
  - `06-playerStandRequest`: **Player** invokes the `do_stand` Move function that records the player's intent to stand.
  - `07-HouseRespondtoStandRequest`: **Dealer** invokes the `stand` Move function that performs the stand action.


## Local Deployment

- Run the deployment script: `./publish.sh`

## Testnet Deployment

- Switch your local cli to _testnet_ env first:

```shell
sui client switch --env testnet
cd setup
./publish testnet
```
