#!/bin/bash 
echo "Running tests..." 
docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from test 
exit_code=$? 
docker compose -f docker-compose.test.yml down exit 
$exit_code