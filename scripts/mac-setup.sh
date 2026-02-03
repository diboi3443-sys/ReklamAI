#!/bin/bash
# Mac Setup Script for ReklamAI Studio
# Checks and installs required dependencies for development on macOS

set -e

echo "🍎 ReklamAI Studio - Mac Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Homebrew
if ! command_exists brew; then
    echo -e "${YELLOW}⚠️  Homebrew not found${NC}"
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo -e "${GREEN}✅ Homebrew installed${NC}"
else
    echo -e "${GREEN}✅ Homebrew found${NC}"
fi

# Check for Git
if ! command_exists git; then
    echo -e "${YELLOW}⚠️  Git not found${NC}"
    echo "Installing Git via Homebrew..."
    brew install git
    echo -e "${GREEN}✅ Git installed${NC}"
else
    echo -e "${GREEN}✅ Git found: $(git --version)${NC}"
fi

# Check for Node.js via nvm
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    echo -e "${GREEN}✅ nvm found${NC}"

    # Check if Node is installed
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"

        # Check if .nvmrc exists and suggest using it
        if [ -f ".nvmrc" ]; then
            RECOMMENDED_VERSION=$(cat .nvmrc)
            CURRENT_VERSION=$(node --version | sed 's/v//')
            if [ "$CURRENT_VERSION" != "$RECOMMENDED_VERSION" ]; then
                echo -e "${YELLOW}⚠️  Recommended Node version is $RECOMMENDED_VERSION, but you have $CURRENT_VERSION${NC}"
                echo "Run: nvm use"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Node.js not found${NC}"
        if [ -f ".nvmrc" ]; then
            RECOMMENDED_VERSION=$(cat .nvmrc)
            echo "Installing Node.js $RECOMMENDED_VERSION via nvm..."
            nvm install "$RECOMMENDED_VERSION"
            nvm use "$RECOMMENDED_VERSION"
            echo -e "${GREEN}✅ Node.js $RECOMMENDED_VERSION installed${NC}"
        else
            echo "Installing latest LTS Node.js via nvm..."
            nvm install --lts
            nvm use --lts
            echo -e "${GREEN}✅ Node.js LTS installed${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  nvm not found${NC}"
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

    if [ -f ".nvmrc" ]; then
        RECOMMENDED_VERSION=$(cat .nvmrc)
        echo "Installing Node.js $RECOMMENDED_VERSION via nvm..."
        nvm install "$RECOMMENDED_VERSION"
        nvm use "$RECOMMENDED_VERSION"
    else
        echo "Installing latest LTS Node.js via nvm..."
        nvm install --lts
        nvm use --lts
    fi
    echo -e "${GREEN}✅ nvm and Node.js installed${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please restart your terminal or run:${NC}"
    echo "  source ~/.nvm/nvm.sh"
fi

# Check for npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found (should come with Node.js)${NC}"
    exit 1
fi

# Check for Supabase CLI (optional)
if command_exists supabase; then
    SUPABASE_VERSION=$(supabase --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ Supabase CLI found: $SUPABASE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found (optional)${NC}"
    echo "To install: brew install supabase/tap/supabase"
fi

# Check for Deno (optional, for local Edge Functions testing)
if command_exists deno; then
    DENO_VERSION=$(deno --version 2>/dev/null | head -n1 || echo "unknown")
    echo -e "${GREEN}✅ Deno found: $DENO_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Deno not found (optional, for local Edge Functions testing)${NC}"
    echo "To install: brew install deno"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Setup check complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Create .env file (see .env.example)"
echo "3. Run dev server: npm run dev"
echo ""
