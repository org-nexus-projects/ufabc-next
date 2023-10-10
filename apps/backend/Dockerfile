# Run with `docker build --secret id=env,src=.env -f ./Dockerfile . -t teste-docker:0.0.2 --no-cache`
# see a way to use this later --mount=type=secret,id=env,required=true,target=/workspace/.env

ARG NODE_VERSION="20.8.0"

FROM node:${NODE_VERSION}-alpine AS runtime 
# Necessary for turborepo
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /workspace
# enable corepack for pnpm
RUN corepack enable

FROM runtime as fetcher
COPY pnpm*.yaml ./

# mount pnpm store as cache & fetch dependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm-store \
  pnpm fetch --ignore-scripts

FROM fetcher as builder
# specify the app in apps/ we want to build
ARG APP_NAME=@ufabcnext/core
ENV APP_NAME=${APP_NAME}


WORKDIR /workspace
COPY . .

RUN pnpm i --frozen-lockfile --offline --silent

# build app

RUN  --mount=type=cache,target=/workspace/node_modules/.cache \
  pnpm turbo run build --filter="${APP_NAME}"

# deploy app
FROM builder as deployer
WORKDIR /workspace
RUN export NODE_ENV=prod
RUN pnpm --filter ${APP_NAME} deploy --prod --ignore-scripts ./out

FROM runtime as runner
WORKDIR /workspace
# Don't run production as root
RUN addgroup --system --gid 1001 backend
RUN adduser --system --uid 1001 core
USER core

#  copy files needed to run the app
COPY --chown=core:backend --from=deployer /workspace/out/package.json .
COPY --chown=core:backend --from=deployer /workspace/out/node_modules/ ./node_modules
COPY --chown=core:backend --from=deployer /workspace/out/dist/ ./dist
# COPY --chown=core:backend --from=deployer /workspace/out/.env.production .

EXPOSE 5000

# start the app
CMD pnpm run preview
