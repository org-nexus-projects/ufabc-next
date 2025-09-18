#!/bin/bash

# Script para inicializar LocalStack com configurações necessárias

set -e

# Definir endpoint do LocalStack
LOCALSTACK_ENDPOINT="http://localstack:4566"

# Aguardar LocalStack estar pronto
until curl -s ${LOCALSTACK_ENDPOINT}/_localstack/health > /dev/null 2>&1; do
    sleep 1
done
awslocal ses verify-email-identity --email-address contato@ufabcnext.com # Verificar identidade de email
awslocal s3api create-bucket --bucket ufabc-next # Criar bucket S3 para logs

# Criar template de teste no SES
awslocal ses create-template --template '{"TemplateName": "Test", "SubjectPart": "Teste do Sistema UFABC Next", "HtmlPart": "<html><body><h1>Sistema de Notificações</h1><p>Este é um teste do sistema de envio de emails em lote.</p><p>Atenciosamente,<br>Equipe UFABC Next</p></body></html>", "TextPart": "Sistema de Notificações\n\nEste é um teste do sistema de envio de emails em lote.\n\nAtenciosamente,\nEquipe UFABC Next"}'