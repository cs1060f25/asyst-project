#!/bin/bash
# =============================================
# Test script for POST /api/applications
# =============================================

BASE_URL="http://localhost:3000"
API_ENDPOINT="$BASE_URL/api/applications"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Testing POST /api/applications"
echo "======================================"
echo ""

# Get a valid job_id from the database
echo -e "${YELLOW}Step 0: Fetching available jobs...${NC}"
JOBS_RESPONSE=$(curl -s "$BASE_URL/api/test-supabase")
JOB_ID=$(echo $JOBS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['jobs'][0]['id'])" 2>/dev/null)

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}❌ Failed to get job ID. Make sure the server is running.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Got job ID: $JOB_ID${NC}"
echo ""

# Generate random UUIDs for testing
CANDIDATE_ID_1="550e8400-e29b-41d4-a716-446655440001"
CANDIDATE_ID_2="550e8400-e29b-41d4-a716-446655440002"

# =============================================
# TEST 1: Valid Application (Should Succeed - 201)
# =============================================
echo -e "${YELLOW}Test 1: Valid application (should return 201)${NC}"
echo "POST $API_ENDPOINT"
echo ""

curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"$CANDIDATE_ID_1\",
    \"resume_url\": \"https://example.com/resume.pdf\",
    \"cover_letter\": \"I am very interested in this position...\",
    \"supplemental_answers\": {
      \"question1\": \"Answer to first question\",
      \"question2\": \"Answer to second question\"
    }
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# =============================================
# TEST 2: Duplicate Application (Should Return 409)
# =============================================
echo -e "${YELLOW}Test 2: Duplicate application (should return 409)${NC}"
echo "POST $API_ENDPOINT (same candidate + job)"
echo ""

curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"$CANDIDATE_ID_1\",
    \"resume_url\": \"https://example.com/resume.pdf\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# =============================================
# TEST 3: Missing Required Fields (Should Return 400)
# =============================================
echo -e "${YELLOW}Test 3: Missing required fields (should return 400)${NC}"
echo "POST $API_ENDPOINT (missing candidate_id)"
echo ""

curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"resume_url\": \"https://example.com/resume.pdf\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# =============================================
# TEST 4: Invalid job_id Format (Should Return 400)
# =============================================
echo -e "${YELLOW}Test 4: Invalid job_id format (should return 400)${NC}"
echo "POST $API_ENDPOINT (job_id is not a UUID)"
echo ""

curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"not-a-valid-uuid\",
    \"candidate_id\": \"$CANDIDATE_ID_2\",
    \"resume_url\": \"https://example.com/resume.pdf\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# =============================================
# TEST 5: Invalid resume_url (Should Return 400)
# =============================================
echo -e "${YELLOW}Test 5: Invalid resume_url (should return 400)${NC}"
echo "POST $API_ENDPOINT (resume_url is not a valid URL)"
echo ""

curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"$CANDIDATE_ID_2\",
    \"resume_url\": \"not-a-url\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# =============================================
# TEST 6: Non-existent Job (Should Return 404)
# =============================================
echo -e "${YELLOW}Test 6: Non-existent job (should return 404)${NC}"
echo "POST $API_ENDPOINT (job doesn't exist)"
echo ""

curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"00000000-0000-0000-0000-000000000000\",
    \"candidate_id\": \"$CANDIDATE_ID_2\",
    \"resume_url\": \"https://example.com/resume.pdf\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool

echo ""
echo "---"
echo ""

# =============================================
# TEST 7: Invalid JSON (Should Return 400)
# =============================================
echo -e "${YELLOW}Test 7: Invalid JSON (should return 400)${NC}"
echo "POST $API_ENDPOINT (malformed JSON)"
echo ""

curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{ this is not valid json }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool 2>/dev/null || echo "Invalid JSON response (expected)"

echo ""
echo "---"
echo ""

# =============================================
# TEST 8: GET All Applications (Should Return 200)
# =============================================
echo -e "${YELLOW}Test 8: GET all applications (should return 200)${NC}"
echo "GET $API_ENDPOINT"
echo ""

curl -X GET "$API_ENDPOINT" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | python3 -m json.tool

echo ""
echo "======================================"
echo -e "${GREEN}✓ All tests complete!${NC}"
echo "======================================"
