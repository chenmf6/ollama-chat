# stage base
FROM node:18-alpine AS base
WORKDIR /app

##### client-stages #####

# stage: client-base
FROM base AS client-base
COPY client/package*.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY client/public ./public
COPY client/src ./src

# stage: client-dev
FROM client-base AS client-dev
EXPOSE 3000  # 前端服务器端口 3000
CMD ["pnpm", "start"]  # 启动前端服务

# stage: client-build
FROM client-base AS client-build
RUN pnpm build

##### server-stages #####

# stage: server-base
FROM base AS server-base
COPY server/package*.json server/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY server/ .

# stage: server-dev
FROM server-base AS server-dev
EXPOSE 4000  # 后端端口 4000
CMD ["pnpm", "start"]  # 启动后端服务

# stage: server-build
FROM server-base AS server-build
RUN pnpm build

##### test #####
FROM server-dev AS test
RUN pnpm test


##### final #####
FROM base AS final
ENV NODE_ENV=production
COPY --from=test app/package.json app/pnpm-lock.yaml ./
RUN pnpm install --production --frozen-lockfile
COPY server/. ./src
COPY --from=client-build /app/client/dist ./src/static
EXPOSE 4000 3000
CMD ["node", "src/app.js"]