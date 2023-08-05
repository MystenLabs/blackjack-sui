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

### Local development with Vercel KV

- To be able to connect with the vercel KV storage in the local development environment, please follow the steps:
  - install vercel cli
  - run `vercel link` in the root directory of the project
  - select `Mysten Labs`
  - link to existing project
  - run `vercel env pull app/.env.development.local`
    - the created `app/.env.development.local` file should have the same format with the `app/.env.development.local.example` directory
  - start the dev server with:
    - `pnpm run dev` inside the app directory
    - or `vercel dev` in the project's root directory
  - visit the url: `http://localhost:3000/api/visits` in your browser, and observe the `pageVisits` counter being incremented with each visit
