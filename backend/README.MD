## Backend

A simple REST API using NodeJS and ExpressJS.

Main libraries used:

- [dotenv](https://www.npmjs.com/package/dotenv) for loading the env variables
- [helmet](https://www.npmjs.com/package/helmet) and [cors](https://www.npmjs.com/package/cors) for securing the server
- [http-status-codes](https://www.npmjs.com/package/http-status-codes) for ensuring following the best practices in terms of the status codes used in our responses
- [winston](https://www.npmjs.com/package/winston) and [logform](https://www.npmjs.com/package/logform) for logging
- [pm2](https://pm2.keymetrics.io/) for monitoring the backend

## Quickstart

1. Move intot the backend directory with: `cd backend`
2. Install the required npm dependencies with: `npm i`
3. Start the development server with: `npm run dev`
4. Start the production server and monitor with pm2 with:
   1. `npm run build`
   2. `npm run start`
