#!/bin/bash
# =============================================
# Apply Database Migrations to Supabase
# =============================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================"
echo "Asyst Database Migrations"
echo -e "======================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Create .env.local with your Supabase credentials"
    exit 1
fi

# Source environment variables
source .env.local

# Construct database URL
DATABASE_URL="postgresql://postgres.[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

echo -e "${YELLOW}⚠️  This will apply database migrations to your Supabase project${NC}"
echo ""
echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "Migrations to apply:"
echo "  1. 001_add_composite_index_applications.sql"
echo "  2. 002_add_composite_index_jobs.sql"
echo ""

# Prompt for confirmation
read -p "Do you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}Applying migrations...${NC}"
echo ""

# Function to apply a migration via HTTP
apply_migration() {
    local file=$1
    local name=$(basename "$file" .sql)
    
    echo -e "${YELLOW}Applying: $name...${NC}"
    
    # Read SQL file
    SQL_CONTENT=$(cat "$file")
    
    # Apply via Supabase REST API (requires service_role key)
    # For now, we'll output instructions instead
    echo -e "${BLUE}📋 Please run this SQL in your Supabase dashboard:${NC}"
    echo ""
    echo "1. Go to: $NEXT_PUBLIC_SUPABASE_URL (remove /v1 from URL)"
    echo "2. Navigate to SQL Editor"
    echo "3. Click 'New query'"
    echo "4. Copy and paste the following SQL:"
    echo ""
    echo -e "${GREEN}--- START SQL ---${NC}"
    cat "$file"
    echo -e "${GREEN}--- END SQL ---${NC}"
    echo ""
    
    read -p "Press Enter after you've run this migration in Supabase..." -r
    echo ""
}

# Apply each migration
for migration in database/migrations/*.sql; do
    if [ -f "$migration" ]; then
        apply_migration "$migration"
    fi
done

echo -e "${GREEN}✅ Migration instructions provided!${NC}"
echo ""
echo -e "${BLUE}Verification Commands:${NC}"
echo ""
echo "To verify indexes were created, run this SQL:"
echo ""
echo -e "${GREEN}-- Check applications indexes"
echo "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'applications';"
echo ""
echo "-- Check jobs indexes"
echo "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'jobs';"
echo -e "${NC}"
echo ""
echo -e "${BLUE}Performance Testing:${NC}"
echo ""
echo "To verify the composite index is being used:"
echo ""
echo -e "${GREEN}EXPLAIN ANALYZE SELECT * FROM applications WHERE job_id = '...' AND status = 'under_review';"
echo -e "${NC}"
echo "Should show: 'Index Scan using idx_applications_job_status'"
echo ""
echo -e "${GREEN}✓ Done!${NC}"
