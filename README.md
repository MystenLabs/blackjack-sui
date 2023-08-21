# BlackJack with Sui and Move

This repo contains code for the BlackJack on Sui Blockchain game, built with Move.



## Gameplay

- This is a 1-1 game, where the player plays against the dealer.
- Dealer has a public BLS key.
- Player creates randomness, places bet and creates a transaction
- Dealer backend listens to the transaction, signs and distributes cards
- 2 cards for player and 1 for dealer
- Player can hit or stand
  - If Stand, User sends a new Tx with new randomness. Then Dealer draws cards until 17 or more
    - If Dealer reaches a number >= 17, he Stops. Then we compare sums. 
  - If Hit, User sends a new Tx with new randomness. Then Dealer draws a card for the player


Stake = 0.2 SUI



## Presentation

More info about the project can be found [in this presentation](https://docs.google.com/presentation/d/13Id6cmSLls8ByVlXXUr4gVO0oAYMZfb-IwroxF1h7zw/edit?usp=sharing)





### Directories structure

- move:

  - Contains the Move code of the smart contracts
  - Contains a sample package named `blackjack` where the developer can add a move module and start building

- app

  - Contains a Typescript NextJS App, with ready-to-use:
    - // TODO: three different user roles
    - // TODO: routing based on the permissions of the current user
    - `api` directory, to utilize vercel serverless functions upon deployment
    - integration with [Vercel KV](https://vercel.com/docs/storage/vercel-kv/quickstart) for having a persistent storage without managing the deployment of a database
    - `Sui TS SDK` integration
    - `Sui Wallet` connection
    - `environment variables` file reading

- setup
  - A Typescript project, with ready-to-use:
    - environment variable (.env) file reading
    - Sui SDK integration
    - publish shell script
