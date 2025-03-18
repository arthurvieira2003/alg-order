#!/bin/bash

# Verifica se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verifica se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "Iniciando Jaeger usando Docker Compose..."
docker-compose up -d

echo "Verificando se os serviços estão rodando..."
docker-compose ps

echo "Jaeger UI disponível em: http://localhost:16686"
echo "Use Ctrl+C para encerrar este script, mas o Jaeger continuará rodando em background."
echo "Para parar o Jaeger, use: docker-compose down" 