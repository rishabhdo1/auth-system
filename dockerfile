# Step 1: Use Node 18 on lightweight Alpine Linux
FROM node:18-alpine

# Step 2: Set working directory inside container
WORKDIR /app

# Step 3: Copy dependency files first (for build caching)
COPY package*.json ./

# Step 4: Install only production dependencies
RUN npm install --production

# Step 5: Copy rest of source code
COPY . .

# Step 6: Document the port your app runs on
EXPOSE 5000

# Step 7: Start the server
CMD ["node", "src/app.js"]