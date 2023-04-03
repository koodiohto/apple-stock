# Use the official Node.js image as the build stage
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the source code to the working directory
COPY . .

# Build the React application
RUN npm run build

# Use the official Nginx image
FROM nginx:stable

# Copy the built React application to the Nginx container
COPY --from=build /app/build /usr/share/nginx/html

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx is running on
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]