#!/bin/bash

# Quick setup script for bike-data project
# This script helps set up the database and import data

set -e

echo "🚴 Berlin Bike Theft Visualizer - Quick Setup"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please edit it with your PostgreSQL credentials."
        echo ""
        read -p "Press Enter after you've configured .env file..."
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing npm dependencies..."
    npm install
    echo ""
fi

# Setup database
echo "🗄️  Setting up database schema..."
npm run setup-db
echo ""

# Check if bike.csv exists
if [ -f bike.csv ]; then
    echo "📥 Importing data from bike.csv..."
    npm run import
    echo ""
    echo "✅ Setup complete! You can now start the server with: npm start"
else
    echo "⚠️  bike.csv not found. Skipping data import."
    echo "   You can import data later with: npm run import"
    echo ""
    echo "✅ Database setup complete!"
fi

echo ""
echo "🎉 Ready to go! Start the server with: npm start"

