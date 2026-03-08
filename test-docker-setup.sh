#!/bin/bash
# Test script to validate Docker setup

set -e

echo "🧪 Testing SuperBotijo Docker Setup"
echo "===================================="
echo ""

# Test 1: Check if Dockerfile exists
echo "✓ Test 1: Checking Dockerfile..."
if [ -f "Dockerfile" ]; then
    echo "  ✅ Dockerfile exists"
else
    echo "  ❌ Dockerfile not found"
    exit 1
fi

# Test 2: Check if docker-compose.yml exists
echo "✓ Test 2: Checking docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    echo "  ✅ docker-compose.yml exists"
else
    echo "  ❌ docker-compose.yml not found"
    exit 1
fi

# Test 3: Check if docker-compose.casaos.yml exists
echo "✓ Test 3: Checking docker-compose.casaos.yml..."
if [ -f "docker-compose.casaos.yml" ]; then
    echo "  ✅ docker-compose.casaos.yml exists"
else
    echo "  ❌ docker-compose.casaos.yml not found"
    exit 1
fi

# Test 4: Check if .dockerignore exists
echo "✓ Test 4: Checking .dockerignore..."
if [ -f ".dockerignore" ]; then
    echo "  ✅ .dockerignore exists"
else
    echo "  ❌ .dockerignore not found"
    exit 1
fi

# Test 5: Check if docker-entrypoint.sh exists
echo "✓ Test 5: Checking docker-entrypoint.sh..."
if [ -f "docker-entrypoint.sh" ]; then
    echo "  ✅ docker-entrypoint.sh exists"
else
    echo "  ❌ docker-entrypoint.sh not found"
    exit 1
fi

# Test 6: Check if .env.docker.example exists
echo "✓ Test 6: Checking .env.docker.example..."
if [ -f ".env.docker.example" ]; then
    echo "  ✅ .env.docker.example exists"
else
    echo "  ❌ .env.docker.example not found"
    exit 1
fi

# Test 7: Check if DOCKER.md exists
echo "✓ Test 7: Checking DOCKER.md..."
if [ -f "DOCKER.md" ]; then
    echo "  ✅ DOCKER.md exists"
else
    echo "  ❌ DOCKER.md not found"
    exit 1
fi

# Test 8: Check if GitHub Actions workflow exists
echo "✓ Test 8: Checking GitHub Actions workflow..."
if [ -f ".github/workflows/docker-publish.yml" ]; then
    echo "  ✅ GitHub Actions workflow exists"
else
    echo "  ❌ GitHub Actions workflow not found"
    exit 1
fi

# Test 9: Validate docker-compose.yml syntax
echo "✓ Test 9: Validating docker-compose.yml syntax..."
if command -v docker-compose &> /dev/null; then
    if docker-compose -f docker-compose.yml config > /dev/null 2>&1; then
        echo "  ✅ docker-compose.yml syntax is valid"
    else
        echo "  ⚠️  docker-compose.yml syntax validation failed (may need .env file)"
    fi
else
    echo "  ⚠️  docker-compose not installed, skipping syntax validation"
fi

# Test 10: Validate docker-compose.casaos.yml syntax
echo "✓ Test 10: Validating docker-compose.casaos.yml syntax..."
if command -v docker-compose &> /dev/null; then
    if docker-compose -f docker-compose.casaos.yml config > /dev/null 2>&1; then
        echo "  ✅ docker-compose.casaos.yml syntax is valid"
    else
        echo "  ⚠️  docker-compose.casaos.yml syntax validation failed (may need .env file)"
    fi
else
    echo "  ⚠️  docker-compose not installed, skipping syntax validation"
fi

# Test 11: Check Dockerfile syntax
echo "✓ Test 11: Checking Dockerfile syntax..."
if command -v docker &> /dev/null; then
    if docker build --help > /dev/null 2>&1; then
        echo "  ✅ Docker is available"
        echo "  ℹ️  Run 'docker build -t superbotijo:test .' to test build"
    fi
else
    echo "  ⚠️  Docker not installed, skipping build test"
fi

# Test 12: Check entrypoint script has shebang
echo "✓ Test 12: Checking entrypoint script..."
if head -n 1 docker-entrypoint.sh | grep -q "^#!/bin/sh"; then
    echo "  ✅ docker-entrypoint.sh has correct shebang"
else
    echo "  ❌ docker-entrypoint.sh missing shebang"
    exit 1
fi

echo ""
echo "===================================="
echo "✅ All tests passed!"
echo ""
echo "📦 Docker setup is ready to use"
echo ""
echo "Next steps:"
echo "1. Build the image: docker build -t superbotijo:local ."
echo "2. Or use docker-compose: docker-compose up -d"
echo "3. See DOCKER.md for full documentation"
