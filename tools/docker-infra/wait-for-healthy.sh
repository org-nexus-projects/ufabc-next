#!/bin/bash
set -e

echo "⏳ Waiting for infrastructure to be healthy..."

retries=30
while [ $retries -gt 0 ]; do
    db_healthy=$(docker ps -q --filter "name=next-db" --filter "health=healthy" 2>/dev/null || true)
    localstack_healthy=$(docker ps -q --filter "name=localstack" --filter "health=healthy" 2>/dev/null || true)
    
    if [ -n "$db_healthy" ] && [ -n "$localstack_healthy" ]; then
        echo "✅ Infrastructure is healthy!"
        exit 0
    fi
    
    echo "  Still waiting... ($retries retries left)"
    sleep 2
    retries=$((retries - 1))
done

echo "⚠️  Infrastructure may still be starting..."
exit 0
