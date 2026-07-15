FROM node:20-slim

# @napi-rs/canvas ships prebuilt binaries — no native deps needed
WORKDIR /app

# Copy package dependencies
COPY package*.json ./

# Install packages (skip build scripts — @napi-rs/canvas uses prebuilt binaries)
RUN npm install

# Copy source and prisma configuration
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/
COPY assets ./assets/

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Create runtime directories
RUN mkdir -p assets/templates assets/certificates sent_emails

EXPOSE 4000

# Start Express server
CMD ["node", "dist/index.js"]
