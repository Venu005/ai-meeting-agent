#!/usr/bin/env bash
# Create Stripe test product + Pro price for local dev.
# Usage:
#   export STRIPE_SECRET_KEY=sk_test_...
#   ./scripts/setup-stripe-dev.sh
#
# Prints STRIPE_PRO_PRICE_ID to add to apps/server/.env

set -euo pipefail

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "Error: STRIPE_SECRET_KEY is not set." >&2
  echo "Get it from https://dashboard.stripe.com/test/apikeys" >&2
  exit 1
fi

API="https://api.stripe.com/v1"

echo "Creating product: AI Meeting Agent Pro..."
PRODUCT_JSON=$(curl -sS -u "${STRIPE_SECRET_KEY}:" \
  -d "name=AI Meeting Agent Pro" \
  -d "description=300 meeting minutes per month" \
  "${API}/products")

PRODUCT_ID=$(echo "$PRODUCT_JSON" | grep -o '"id": "prod_[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -z "$PRODUCT_ID" ]]; then
  echo "Failed to create product:" >&2
  echo "$PRODUCT_JSON" >&2
  exit 1
fi

echo "Product ID: $PRODUCT_ID"

echo "Creating price: \$19/month..."
PRICE_JSON=$(curl -sS -u "${STRIPE_SECRET_KEY}:" \
  -d "currency=usd" \
  -d "unit_amount=1900" \
  -d "recurring[interval]=month" \
  -d "product=${PRODUCT_ID}" \
  "${API}/prices")

PRICE_ID=$(echo "$PRICE_JSON" | grep -o '"id": "price_[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -z "$PRICE_ID" ]]; then
  echo "Failed to create price:" >&2
  echo "$PRICE_JSON" >&2
  exit 1
fi

echo ""
echo "Add these to apps/server/.env:"
echo ""
echo "STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}"
echo "STRIPE_PRO_PRICE_ID=${PRICE_ID}"
echo ""
echo "For webhooks (local), install Stripe CLI and run:"
echo "  stripe listen --forward-to localhost:3001/api/billing/webhook"
echo "Then set STRIPE_WEBHOOK_SECRET=whsec_... from CLI output."
