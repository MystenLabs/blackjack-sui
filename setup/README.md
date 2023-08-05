# Setup

## Description

A Typescript project, with ready-to-use:

- environment variable (.env) file reading
- Sui SDK integration
- publish shell script

## Environment variables

- Create a `.env` file following the format of the `.env.example` file, to insert the target sui network, or any other env. variables you need
- `.env` file is not tracked by Git
- Add the corresponding export statements in the `src/config.ts` file
- Export your admin address by running: `export ADMIN_ADDRESS="your address here"`
- Export your admin Private Key by running: `export ADMIN_SECRET_KEY="your secret key here"`

Note: If you have a custom admin address, you can change the admin phrase in the publish.sh script: `ADMIN_PHRASE="loop other...."`

## Project structure

- `publish.sh`: the publish script
- `src/`:
  - `config.ts`: retrieves and exports the specified environmental variables of the .env file (and the host machine)
  - `examples.ts`: some Typescript modules exporting functions with the example usage of the TS SDK
  - `setup.ts`: the main module, which is ran by `npm run setup`

## Local Deployment

- Run the deployment script: `./publish.sh`

## Testnet Deployment

- Switch your local cli to testnet env:

```shell
sui client switch --env testnet
cd setup
./publish testnet
```
