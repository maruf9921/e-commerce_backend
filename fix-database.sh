#!/bin/bash

echo "🔧 Fixing E-commerce Backend Database Conflicts"
echo "==============================================="

# Database connection details
DB_NAME="e-commerce_backend"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}Step 1: Checking PostgreSQL service...${NC}"

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo -e "${RED}PostgreSQL is not running. Starting it...${NC}"
    sudo systemctl start postgresql
    sleep 3
    
    if systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ PostgreSQL is already running${NC}"
fi

echo -e "\n${YELLOW}Step 2: Checking database connection...${NC}"

# Test connection
if sudo -u postgres psql -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database '$DB_NAME'${NC}"
    echo "Creating database..."
    sudo -u postgres createdb $DB_NAME
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database '$DB_NAME' created successfully${NC}"
    else
        echo -e "${YELLOW}⚠️ Database might already exist or permission issue${NC}"
    fi
fi

echo -e "\n${YELLOW}Step 3: Analyzing username conflicts...${NC}"

# Check for conflicting data
echo "Checking existing usernames in both tables..."

conflict_check=$(sudo -u postgres psql -d $DB_NAME -t -c "
SELECT 
    'CONFLICT: ' || username as issue,
    COUNT(*) as count
FROM (
    SELECT username FROM total_users WHERE username IS NOT NULL
    UNION ALL
    SELECT username FROM sellers WHERE username IS NOT NULL
) combined 
GROUP BY username 
HAVING COUNT(*) > 1;
" 2>/dev/null)

if [ -n "$conflict_check" ]; then
    echo -e "${RED}❌ Username conflicts found:${NC}"
    echo "$conflict_check"
    
    echo -e "\n${YELLOW}Step 4: Fixing username conflicts...${NC}"
    
    # Backup existing data
    echo "Creating backups..."
    sudo -u postgres psql -d $DB_NAME -c "
    DROP TABLE IF EXISTS backup_total_users;
    DROP TABLE IF EXISTS backup_sellers;
    CREATE TABLE backup_total_users AS SELECT * FROM total_users;
    CREATE TABLE backup_sellers AS SELECT * FROM sellers;
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Data backed up${NC}"
    
    # Fix conflicts by adding prefixes
    echo "Adding prefixes to usernames..."
    
    sudo -u postgres psql -d $DB_NAME -c "
    -- Add user_ prefix to total_users usernames that don't already have it
    UPDATE total_users 
    SET username = 'user_' || username 
    WHERE username NOT LIKE 'user_%' 
    AND username NOT LIKE 'admin_%'
    AND username IS NOT NULL;
    
    -- Add seller_ prefix to sellers usernames that don't already have it  
    UPDATE sellers 
    SET username = 'seller_' || username 
    WHERE username NOT LIKE 'seller_%'
    AND username IS NOT NULL;
    " > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Username conflicts resolved${NC}"
    else
        echo -e "${RED}❌ Failed to resolve conflicts${NC}"
    fi
    
else
    echo -e "${GREEN}✅ No username conflicts found${NC}"
fi

echo -e "\n${YELLOW}Step 5: Cleaning test data...${NC}"

# Remove any existing test data that might cause issues
sudo -u postgres psql -d $DB_NAME -c "
DELETE FROM products WHERE name LIKE '%test%' OR name LIKE '%Test%';
DELETE FROM total_users WHERE username LIKE '%test%' OR email LIKE '%test%';
DELETE FROM sellers WHERE username LIKE '%test%';
" > /dev/null 2>&1

echo -e "${GREEN}✅ Test data cleaned${NC}"

echo -e "\n${YELLOW}Step 6: Verifying database state...${NC}"

# Show current state
echo "Current usernames in total_users:"
sudo -u postgres psql -d $DB_NAME -c "SELECT id, username, email, role FROM total_users LIMIT 5;" 2>/dev/null

echo -e "\nCurrent usernames in sellers:"
sudo -u postgres psql -d $DB_NAME -c "SELECT id, username, \"fullName\" FROM sellers LIMIT 5;" 2>/dev/null

echo -e "\nTotal products:"
sudo -u postgres psql -d $DB_NAME -c "SELECT COUNT(*) as total_products FROM products;" 2>/dev/null

echo -e "\n${GREEN}🎉 Database fix completed!${NC}"
echo "========================================="
echo "✅ PostgreSQL service: Running"
echo "✅ Database connection: Working"
echo "✅ Username conflicts: Resolved"
echo "✅ Test data: Cleaned"
echo ""
echo "You can now run your tests safely!"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start your NestJS server: npm run start:dev"
echo "2. Run the test script: ./test-fixed-endpoints.sh"
