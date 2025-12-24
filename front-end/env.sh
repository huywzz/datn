#!/bin/sh

# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment
echo "window.env = {" >> /usr/share/nginx/html/env-config.js

# Read each line in .env file
# Each line represents key=value pair
print_var() {
  varname=$1
  varvalue=$(eval echo \$$varname)
  if [ -n "$varvalue" ]; then
    echo "  $varname: \"$varvalue\"," >> /usr/share/nginx/html/env-config.js
  fi
}

print_var "VITE_URL_API"
print_var "VITE_GOOGLE_CLIENT_ID"
print_var "VITE_FIREBASE_API_KEY"
print_var "VITE_FIREBASE_AUTH_DOMAIN"
print_var "VITE_FIREBASE_PROJECT_ID"
print_var "VITE_FIREBASE_STORAGE_BUCKET"
print_var "VITE_FIREBASE_MESSAGING_SENDER_ID"
print_var "VITE_FIREBASE_APP_ID"
print_var "VITE_CLERK_PUBLISHABLE_KEY"

echo "}" >> /usr/share/nginx/html/env-config.js

# Execute the passed command
exec "$@"
