#!/bin/bash
# Uso: docker-preflight.sh --containers <nome...> [--volumes <nome...>]
# Prepara ambiente local docker com a remoção de containers e volumes que possam causar conflitos.
set -e

mode=""
containers=()
volumes=()

for arg in "$@"; do
  case "$arg" in
    --containers)
      mode="containers"
      ;;
    --volumes)
      mode="volumes"
      ;;
    *)
      if [ "$mode" = "containers" ]; then
        containers+=("$arg")
      elif [ "$mode" = "volumes" ]; then
        volumes+=("$arg")
      fi
      ;;
  esac
done

for name in "${containers[@]}"; do
  id=$(docker ps -aq --filter "name=^${name}$" 2>/dev/null || true)
  [ -z "$id" ] && continue

  managed_by_compose=$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' "$id" 2>/dev/null || true)

  if [ -z "$managed_by_compose" ]; then
    echo "Container '${name}' já existe mas não foi criado pelo Compose. Removendo para evitar conflito..."
    docker rm -f "$id" >/dev/null
  else
    echo "Container '${name}' já existe (gerenciado pelo Compose), será reutilizado."
  fi
done

for name in "${volumes[@]}"; do
  id=$(docker volume ls -q --filter "name=^${name}$" 2>/dev/null || true)
  if [ -n "$id" ]; then
    echo "Volume '${name}' já existe, será reutilizado."
  fi
done
