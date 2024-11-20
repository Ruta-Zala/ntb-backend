# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
# node.js v18
# This image comes with Node.js and NPM already installed
FROM node:18

# Create app directory (a directory to hold the application code inside the image)
WORKDIR /usr/src/app

# Install app dependencies using the npm binary. 
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# Note that, rather than copying the entire working directory, we are only copying the package.json file. 
# This allows us to take advantage of cached Docker layers.
COPY package*.json ./

RUN npm install

# If you are building your code for production
# the npm ci command helps provide faster, reliable, reproducible builds for production environments.
#RUN npm ci --only=production
RUN npm ci --omit=dev

# Bundle app source
COPY . .

EXPOSE 30001

CMD [ "node", "src" ]