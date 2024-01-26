FROM node:18-alpine3.15
RUN apk add g++ make py3-pip

WORKDIR /usr/src/app

RUN npm install pm2@latest -g
RUN npm install -g typescript

# Copy application files
COPY . .

# Do the install
WORKDIR /usr/src/app/
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]