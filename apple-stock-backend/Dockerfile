# Use the official Node.js image as the base image
FROM node:16

# Set the working directory
WORKDIR /app

# Define a build argument for the server URL
ARG STOCK_API_KEY
ENV STOCK_API_KEY=$STOCK_API_KEY

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies
RUN npm ci

# Install TypeScript globally
RUN npm install -g typescript

# Copy the rest of the source code to the working directory
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]