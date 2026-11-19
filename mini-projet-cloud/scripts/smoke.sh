#!/bin/sh
set -eu

echo "Attente de la boutique..."
curl -fsS --retry 40 --retry-delay 3 --retry-all-errors http://localhost:8000/health
echo
curl -fsS http://localhost:8000/api/products
echo
curl -fsS -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":1,"customer_name":"Amira Ben Ali","customer_email":"amira@example.com"}'
echo
curl -fsS http://localhost:8000/api/notifications
echo
echo "Smoke test OK"
