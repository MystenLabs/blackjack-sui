## Backend

A simple REST API using NodeJS and ExpressJS.

Main libraries used:

- [dotenv](https://www.npmjs.com/package/dotenv) for loading the env variables
- [helmet](https://www.npmjs.com/package/helmet) and [cors](https://www.npmjs.com/package/cors) for securing the server
- [http-status-codes](https://www.npmjs.com/package/http-status-codes) for ensuring following the best practices in terms of the status codes used in our responses
- [winston](https://www.npmjs.com/package/winston) and [logform](https://www.npmjs.com/package/logform) for logging
- [pm2](https://pm2.keymetrics.io/) for monitoring the backend
- [socket.io](https://socket.io/) for setting up the socket communication between the backend and the frontend

## Quickstart

1. Cd into the backend directory with: `cd backend`
2. Install the required npm dependencies with: `npm i`
3. Prepare your .env file to follow the structure of the `.env.example` file
   ```
   PORT=8080
   DEBUG_LEVEL=info
   SUI_NETWORK=https://rpc.testnet.sui.io:443
   PACKAGE_ADDRESS=
   HOUSE_ADMIN_CAP=
   HOUSE_DATA_ID=
   ADMIN_SECRET_KEY=
   SHINAMI_GAS_STATION_API_KEY=
   ```
4. Start the development server with: `npm run dev`
5. Start the production server:
   1. Update your Dockerfile:
      - If you would like to use pm2, use `CMD ["npm", "run", "start-pm2"]` in the last line of the Dockerfile
      - If you would not like to use pm2, use `CMD ["npm", "run", "start"]` in the last line of the Dockerfile
   2. Run `docker-compose build`
   3. Run `docker-compose up`
6. In the case of using pm2, you can monitor the api by running:
   `docker exec -it <container-name> pm2 monit`
