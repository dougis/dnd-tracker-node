#!/bin/bash

# Docker Compose Setup Test Suite
# Tests for issue #68 - Setup Docker Compose development environment

set -e

# Color output for test results
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Test helper functions
print_test() {
    echo -e "${YELLOW}Testing: $1${NC}"
    ((TOTAL_TESTS++))
}

pass_test() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

fail_test() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    echo -e "${RED}  $2${NC}"
    ((TESTS_FAILED++))
}

# Cleanup function for test environment
cleanup() {
    echo "Cleaning up test environment..."
    docker-compose down -v 2>/dev/null || true
    docker volume prune -f 2>/dev/null || true
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

echo "Starting Docker Compose Setup Test Suite..."
echo "============================================="

# Test 1: Docker Compose file exists and is valid
print_test "Docker Compose file exists and is valid YAML"
if [ -f "docker-compose.yml" ]; then
    if docker-compose config >/dev/null 2>&1; then
        pass_test "docker-compose.yml exists and is valid"
    else
        fail_test "docker-compose.yml is invalid YAML" "Run 'docker-compose config' for details"
    fi
else
    fail_test "docker-compose.yml does not exist" "Create docker-compose.yml in project root"
fi

# Test 2: Environment file exists
print_test "Environment configuration file exists"
if [ -f ".env.docker" ]; then
    pass_test ".env.docker exists"
else
    fail_test ".env.docker does not exist" "Create .env.docker for Docker environment variables"
fi

# Test 3: Required services are defined
print_test "Required services are defined in docker-compose.yml"
required_services=("mongodb" "redis" "mongo-express" "redis-commander")
for service in "${required_services[@]}"; do
    if docker-compose config --services | grep -q "^$service$"; then
        pass_test "Service '$service' is defined"
    else
        fail_test "Service '$service' is not defined" "Add $service service to docker-compose.yml"
    fi
done

# Test 4: Services start successfully
print_test "All services start successfully"
if docker-compose up -d; then
    sleep 10  # Give services time to start
    pass_test "Docker Compose services started"
else
    fail_test "Failed to start Docker Compose services" "Check docker-compose.yml configuration"
fi

# Test 5: Service health checks
print_test "Service health and connectivity"

# MongoDB health check
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    pass_test "MongoDB is responding"
else
    fail_test "MongoDB is not responding" "Check MongoDB service configuration"
fi

# Redis health check
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    pass_test "Redis is responding"
else
    fail_test "Redis is not responding" "Check Redis service configuration"
fi

# Test 6: Port accessibility
print_test "Services are accessible on expected ports"
expected_ports=(27017 6379 8081 8082)
for port in "${expected_ports[@]}"; do
    if nc -z localhost $port; then
        pass_test "Port $port is accessible"
    else
        fail_test "Port $port is not accessible" "Check port mapping in docker-compose.yml"
    fi
done

# Test 7: Data persistence
print_test "Data persistence between restarts"
# Create test data
docker-compose exec -T mongodb mongosh --eval "
    use testdb;
    db.testcol.insertOne({test: 'persistence', timestamp: new Date()});
"

# Restart services
docker-compose restart

sleep 5  # Wait for restart

# Check if data persists
if docker-compose exec -T mongodb mongosh --eval "
    use testdb;
    db.testcol.findOne({test: 'persistence'})
" | grep -q "persistence"; then
    pass_test "MongoDB data persists between restarts"
else
    fail_test "MongoDB data does not persist" "Check volume configuration"
fi

# Test 8: Network connectivity between services
print_test "Inter-service network connectivity"
# Test if application can connect to MongoDB via Docker network
if docker-compose exec -T redis redis-cli -h mongodb ping >/dev/null 2>&1; then
    # This should fail as it's testing wrong connection, but tests network exists
    pass_test "Docker network is configured"
else
    # Check if services can resolve each other
    if docker-compose exec -T mongodb nslookup redis >/dev/null 2>&1; then
        pass_test "Services can resolve each other via Docker network"
    else
        fail_test "Inter-service network connectivity failed" "Check Docker network configuration"
    fi
fi

# Test 9: npm scripts exist
print_test "npm scripts for Docker operations exist"
required_scripts=("docker:up" "docker:down" "docker:logs" "docker:reset")
for script in "${required_scripts[@]}"; do
    if npm run | grep -q "$script"; then
        pass_test "npm script '$script' exists"
    else
        fail_test "npm script '$script' does not exist" "Add script to package.json"
    fi
done

# Test 10: Database initialization
print_test "Database initialization scripts work"
if [ -f "scripts/mongo-init.js" ]; then
    pass_test "Database initialization script exists"
    # Test if initialization creates expected database structure
    if docker-compose exec -T mongodb mongosh --eval "
        use dnd_tracker;
        show collections;
    " | grep -q "users\|characters\|encounters"; then
        pass_test "Database initialization creates expected collections"
    else
        fail_test "Database initialization incomplete" "Check mongo-init.js script"
    fi
else
    fail_test "Database initialization script missing" "Create scripts/mongo-init.js"
fi

# Summary
echo ""
echo "============================================="
echo "Test Results Summary:"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $TOTAL_TESTS"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Docker setup is ready.${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi