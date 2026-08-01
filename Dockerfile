ARG NODE_VERSION="24.12.0"

FROM node:${NODE_VERSION}-alpine AS runtime

#Env git secret private key
ARG GIT_SECRET_PRIVATE_KEY
ENV GIT_SECRET_PRIVATE_KEY=$GIT_SECRET_PRIVATE_KEY

#Env git secret password
ARG GIT_SECRET_PASSWORD
ENV GIT_SECRET_PASSWORD=$GIT_SECRET_PASSWORD

# Necessary for turborepo
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /workspace
# enable corepack for pnpm
RUN npm i -g pnpm@10.33.2 tsx

FROM runtime as fetcher
COPY pnpm*.yaml ./

# mount pnpm store as cache & fetch dependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm-store 

RUN pnpm fetch --ignore-scripts

FROM fetcher as builder
# specify the app in apps/ we want to build
ARG APP_NAME=@next/core
ENV APP_NAME=${APP_NAME}


WORKDIR /workspace
COPY . .

RUN pnpm i

# build app

RUN  --mount=type=cache,target=/workspace/node_modules/.cache \
  pnpm turbo run build --filter="${APP_NAME}"

# deploy app
FROM builder as deployer
WORKDIR /workspace
RUN export NODE_ENV=prod
RUN pnpm --filter ${APP_NAME} deploy --prod --ignore-scripts ./out

FROM runtime AS dev
WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

COPY apps/core/package.json apps/core/package.json
COPY apps/core/tsconfig.json apps/core/tsconfig.json
COPY apps/container/package.json apps/container/package.json
COPY apps/extension/package.json apps/extension/package.json
COPY packages/connectors/package.json packages/connectors/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/logger/package.json packages/logger/package.json
COPY packages/queues/package.json packages/queues/package.json
COPY packages/services/package.json packages/services/package.json
COPY packages/testing/package.json packages/testing/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY tools/docker-infra/package.json tools/docker-infra/package.json
COPY tools/tsconfig/package.json tools/tsconfig/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

CMD ["pnpm", "--filter", "@next/core", "run", "dev:local"]

FROM runtime as runner
WORKDIR /workspace

RUN apk update && apk upgrade
RUN apk add --no-cache git
RUN  sh -c "echo 'https://gitsecret.jfrog.io/artifactory/git-secret-apk/latest-stable/main'" >> /etc/apk/repositories
RUN  wget -O /etc/apk/keys/git-secret-apk.rsa.pub 'https://gitsecret.jfrog.io/artifactory/api/security/keypair/public/repositories/git-secret-apk'
RUN  apk add --update --no-cache git-secret
RUN  git init
RUN git config --global --add safe.directory /workspace



# Don't run production as root
RUN addgroup --system --gid 1001 backend
RUN adduser --system --uid 1001 core
USER root

#  copy files needed to run the app

COPY --chown=core:backend --from=deployer /workspace/out/package.json .
COPY --chown=core:backend --from=deployer /workspace/out/node_modules/ ./node_modules
COPY --chown=core:backend --from=deployer /workspace/out/dist/ ./dist
COPY --chown=core:backend --from=deployer /workspace/apps/core/.env.prod.secret apps/core/.env.prod.secret
COPY --chown=core:backend --from=deployer /workspace/.gitsecret  ./.gitsecret

# Decrypt .env.prod file
RUN echo "$GIT_SECRET_PRIVATE_KEY" >> ./private-container-file-key
RUN gpg --batch --yes --pinentry-mode loopback --import ./private-container-file-key

RUN git secret reveal -p ${GIT_SECRET_PASSWORD}
RUN cp apps/core/.env.prod .env.prod

# Remove the secret key file after decryption
RUN rm -f ./private-container-file-key

EXPOSE 5000

# start the app
CMD tsx --env-file=.env.prod dist/server.js
