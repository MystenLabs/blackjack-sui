# BlackJack with Sui and Move

This repo contains code for the BlackJack on Sui Blockchain game, built with Move.

## Sui Blackjack Modules

### `single_player_blackjack.move`

Defines the game object and provides methods to create and play a game. The overall flow of invocation is:

- **Admin** (owner of the HouseCap object) invokes the `initialize_house_data` function that can be called only once (Capability is destroyed).
- **Player** invokes the `place_bet_and_create_game` Move function that initializes the game randomness, receives the bet and creates a new game.
- **Dealer** invokes the `first_deal` Move function that performs the initial deal of the game.
- **Player** invokes the `do_hit` Move function that records the player's intent to hit, by minting and transfering a `HitRequest` object to the admin (for the specific game, player, and game's state)
- **Dealer** invokes the `hit` Move function that performs the hit action (providing as input the corresponding HitRequest object)
- **Player** invokes the `do_stand` Move function that records the player's intent to stand, by minting and transfering a `StandRequest` object to the admin (for the specific game, player, and game's state)
- **Dealer** invokes the `stand` Move function that performs the stand action (providing as input the corresponding HitRequest object)

### `counter_nft.move`

This module defines the Counter NFT object and provides methods to create and increment it.<br/>
The Counter NFT is used as the VRF input for every game that a player plays.<br/>
The count always increases after use, ensuring a unique input for every game.<br/>
A player is required to create a Counter NFT before playing their first game.<br/>
The UI can seemlessly create the Counter NFT for the user by including the counter creation along with the game creation function in the same PTB.

## Quickstart

1. cd into the setup/ directory: `cd setup/`
2. install the npm dependencies with: `npm i`
3. initialize your `environmental variables` based on the `Environment variables` section of the `setup/README.md` file
4. Run the following:
  1. Publish the contracts with: `./publish.sh testnet`
  2. Initialize the house data with: `npm run init-house` (admin account needs to have at least 10 SUI + gas, to top-up the initial house funds)
5. cd back into the app/ directory: `cd ../app/`
6. install the pnpm dependencies with `pnpm i`
7. start the development server with `pnpm run dev`

## Gameplay

- This is a 1-1 version of the game, where the player plays against the dealer (machine).
- Dealer has a public BLS key.
- Player creates randomness by moving their mouse over screen, places bet and starts game.
- Dealer backend signs and executes the initial deal transaction, distributing 2 cards for player and 1 for dealer.
- Player can _Hit_ or _Stand_
  - If _Stand_ is selected, then the Dealer draws cards until reaching a sum >= 17.
    - If Dealer reaches a number >= 17, he Stops. Then the Smart Contract compares sums and declares the winner.
  - If _Hit_ is selected, then Dealer draws a card for the player.
- Every action (Deal, Hit, Stand) is comprised from 2 distinct transactions. The first one is initiated from the player
  in order to capture the intent of the user to perform an action. The second one is initiated from the dealer backend,
  as a response action to the first one and performs the actual business logic.

More details are depicted on the [Game Flow](#game-flow) section below.

**_Stake is fixed at 0.2 SUI_**

## Game Flow

The overall game flow is presented in the following sequence diagram:

![Sequence Diagram](sui_blackjack_sequence_diagram.png)

### Source Code Directories structure

- move:

  - Contains the Move code of the smart contracts
  - Contains a move package named `blackjack` which contains the Move code of the smart contracts.

- app

  - Contains The frontend code of the app.
    - React.js
    - Next.js Framework
    - Tailwind CSS

- setup
  - A Typescript project, with a ready-to-use:
    - environment variable (.env) file reading
    - Sui SDK integration
    - [publish shell script](./setup/publish.sh)
