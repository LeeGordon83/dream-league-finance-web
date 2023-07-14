# Use the official Node.js 14 base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the app files to the container
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the Hapi.js server
CMD [ "node", "index.js" ]
