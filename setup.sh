#!/bin/bash

echo "Installing MyFeedDeck Electron dependencies..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version:"
node --version
echo

# Install dependencies
echo "Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo
echo "Setup completed successfully!"
echo
echo "To start the application in development mode:"
echo "  npm run dev"
echo
echo "To build the application:"
echo "  npm run build"
echo
echo "To start the production application:"
echo "  npm start"
echo