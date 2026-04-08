#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_local_mongo() {
    print_status "Checking Docker MongoDB container..."

    if ! docker ps --format "table {{.Names}}" | grep -q "next-db"; then
        print_error "MongoDB container 'next-db' is not running."
        print_status "Please start your Docker Compose setup first:"
        print_status "  docker compose up -d"
        exit 1
    fi

    print_status "MongoDB container is running!"
}

get_remote_mongo_uri() {
    if [ -z "$MONGO_URI" ]; then
        print_error "MONGO_URI environment variable is not set."
        print_status "Please set it with: export MONGO_URI='mongodb://user:pass@host:port/db'"
        exit 1
    fi
    echo "$MONGO_URI"
}

get_remote_db_name() {
    if [ -z "$MONGO_DB_NAME" ]; then
        print_error "MONGO_DB_NAME environment variable is not set."
        print_status "Please set it with: export MONGO_DB_NAME='ufabc-matricula'"
        exit 1
    fi
    echo "$MONGO_DB_NAME"
}

create_backup_dir() {
    local backup_dir="./tmp/mongo-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    chmod 777 "$backup_dir"
    echo "$backup_dir"
}

dump_remote_db() {
    local mongo_uri="$1"
    local db_name="$2"
    local backup_dir="$3"

    print_status "Dumping remote MongoDB database..."

    if docker run --rm \
        -u "$(id -u):$(id -g)" \
        -v "$backup_dir:/backup" \
        mongo:latest mongodump \
        --uri="$mongo_uri" \
        --db="$db_name" \
        --archive="/backup/dump.archive" \
        --gzip; then
        print_status "Remote database dumped successfully to: $backup_dir/dump.archive"
    else
        print_error "Failed to dump remote database"
        exit 1
    fi
}

restore_to_local() {
    local backup_dir="$1"
    local db_name="$2"

    print_status "Restoring to local MongoDB..."

    if docker exec next-db mongorestore \
        --host="localhost:27017" \
        --drop \
        --db="$db_name" \
        --archive="/backup/dump.archive" \
        --gzip; then
        print_status "Database restored successfully to local!"
    else
        print_error "Failed to restore database"
        exit 1
    fi
}

copy_backup_to_container() {
    local backup_dir="$1"

    print_status "Copying backup to container..."

    docker exec next-db mkdir -p /backup
    docker cp "$backup_dir/dump.archive" next-db:/backup/dump.archive

    if [ $? -eq 0 ]; then
        print_status "Backup copied to container: /backup/dump.archive"
    else
        print_error "Failed to copy backup to container"
        exit 1
    fi
}

cleanup_backup() {
    local backup_dir="$1"

    print_status "Cleaning up backup files..."

    rm -rf "$backup_dir"
    docker exec next-db rm -rf /backup/dump.archive

    print_status "Cleanup completed!"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --dry-run      Show what would be done without executing"
    echo ""
    echo "Environment variables required:"
    echo "  MONGO_URI      - Your remote MongoDB connection string "
    echo "  MONGO_DB_NAME  - Name of the database to sync"
    echo ""
    echo "Prerequisites:"
    echo "  - Docker Compose MongoDB container must be running"
    echo "  - Run: docker compose up -d"
    echo ""
    echo "  $0"
}

dry_run() {
    print_status "DRY RUN - No actual changes will be made"
    print_status "Checking Docker Compose MongoDB container..."
    print_status "Checking environment variables..."

    local mongo_uri=$(get_remote_mongo_uri)
    local db_name=$(get_remote_db_name)

    print_status "Remote URI: ${mongo_uri//@*/@***}"
    print_status "Remote DB: $db_name"
    print_status "Local DB: $db_name" 

    local backup_dir="./tmp/mongo-backup-$(date +%Y%m%d-%H%M%S)"
    print_status "Would create backup directory: $backup_dir"
    print_status "Would dump remote database to: $backup_dir/dump.archive"
    print_status "Would copy backup to container: next-db:/backup/dump.archive"
    print_status "Would restore to local MongoDB"
    print_status "Would clean up backup files"

    print_status "DRY RUN completed - all checks passed!"
}

DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

main() {
    print_status "Starting prod to Local MongoDB sync..."

    if [ "$DRY_RUN" = true ]; then
        dry_run
        exit 0
    fi

    check_local_mongo

    local mongo_uri=$(get_remote_mongo_uri)
    local db_name=$(get_remote_db_name)
    local backup_dir=$(create_backup_dir)

    dump_remote_db "$mongo_uri" "$db_name" "$backup_dir"

    copy_backup_to_container "$backup_dir"

    restore_to_local "$backup_dir" "$db_name"

    cleanup_backup "$backup_dir"

    print_status "Railway to Local MongoDB sync completed successfully!"
}

main "$@"
