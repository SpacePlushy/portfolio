#!/bin/bash

# Script to set up local testing for three-way portfolio variants

echo "Three-Way Portfolio Local Testing Setup"
echo "======================================"
echo ""

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    HOSTS_FILE="/etc/hosts"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    HOSTS_FILE="/etc/hosts"
else
    echo "This script only supports macOS and Linux"
    exit 1
fi

# Check if entries already exist
if grep -q "palmisano.local" "$HOSTS_FILE"; then
    echo "✓ Local testing entries already exist in $HOSTS_FILE"
    
    # Check if all three variants exist
    if grep -q "swe.palmisano.local" "$HOSTS_FILE"; then
        echo "✓ All three portfolio variants are configured"
    else
        echo "Adding missing SWE subdomain entry..."
        echo "127.0.0.1 swe.palmisano.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo "✓ Added SWE subdomain entry"
    fi
else
    echo "Adding local testing entries to $HOSTS_FILE..."
    echo ""
    echo "This requires sudo access to modify the hosts file."
    echo ""
    
    # Add entries
    echo "# Frank Palmisano Portfolio Local Testing" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "127.0.0.1 palmisano.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "127.0.0.1 swe.palmisano.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "127.0.0.1 csr.palmisano.local" | sudo tee -a "$HOSTS_FILE" > /dev/null
    echo "" | sudo tee -a "$HOSTS_FILE" > /dev/null
    
    echo "✓ Added all local testing entries to $HOSTS_FILE"
fi

echo ""
echo "Setup complete! You can now test all three portfolio variants locally:"
echo ""
echo "1. Start the development server: npm run dev"
echo "2. Visit the general landing page: http://palmisano.local:3000"
echo "3. Visit the Software Engineering portfolio: http://swe.palmisano.local:3000"
echo "4. Visit the Customer Service portfolio: http://csr.palmisano.local:3000"
echo ""
echo "The landing page will allow visitors to choose between the specialized portfolios."
echo ""
echo "To remove these entries later, edit $HOSTS_FILE and remove the lines containing 'palmisano.local'"