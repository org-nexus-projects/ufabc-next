#!/bin/bash

# Script para inicializar LocalStack com configurações necessárias

set -e

# Definir endpoint do LocalStack
LOCALSTACK_ENDPOINT="http://localstack:4566"

# Aguardar LocalStack estar pronto
until curl -s ${LOCALSTACK_ENDPOINT}/_localstack/health > /dev/null 2>&1; do
    sleep 2
done
awslocal ses verify-email-identity --email-address contato@ufabcnext.com # Verificar identidade de email
awslocal s3api create-bucket --bucket ufabc-templates # Criar bucket S3 para templates
awslocal s3api create-bucket --bucket ufabc-next # Criar bucket S3 para logs