#!/bin/bash
# Script to drop newsletter tables via SSH
# Usage: Run this on the production server or via SSH

echo "Dropping newsletter tables..."

# Read database credentials from .env file
if [ -f .env ]; then
    source .env
    export DB_HOST DB_USER DB_PASSWORD DB_NAME
fi

# Execute SQL commands
mysql -h "${DB_HOST:-localhost}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" <<EOF
DROP TABLE IF EXISTS \`newsletter_campaigns\`;
DROP TABLE IF EXISTS \`newsletter_email_config\`;
DROP TABLE IF EXISTS \`newsletter_subscriptions\`;
SELECT 'Newsletter tables dropped successfully' AS status;
EOF

if [ $? -eq 0 ]; then
    echo "✓ Newsletter tables dropped successfully"
else
    echo "✗ Error dropping tables"
    exit 1
fi

