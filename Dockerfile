# -------- deps (instala deps en Linux) --------
FROM oven/bun:1-debian AS deps
WORKDIR /app

# toolchain para sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config libsqlite3-dev ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install --ci

# -------- build --------
FROM oven/bun:1-debian AS build
WORKDIR /app

# usa node_modules de la capa deps (Linux)
COPY --from=deps /app/node_modules ./node_modules

# copia tu código (node_modules y .next están ignorados por .dockerignore)
COPY . .

# si prefieres explícito:
# COPY package.json bun.lock* ./
# COPY tsconfig.json next.config.ts postcss.config.js ./
# COPY tailwind.config.* ./
# COPY public ./public
# COPY src ./src
# COPY northwind.db ./northwind.db

RUN bun x next build

# -------- runtime --------
FROM oven/bun:1-debian AS runner
WORKDIR /app
ENV NODE_ENV=production

# trae el build
COPY --from=build /app ./

EXPOSE 3000
CMD ["bun","x","next","start","-p","3000"]
