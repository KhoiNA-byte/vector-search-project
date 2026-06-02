FROM node:22-bookworm-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# Run the dev server with host binding so it's accessible outside the container
CMD ["pnpm", "run", "dev", "--host"]
