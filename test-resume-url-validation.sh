#!/bin/bash
# =============================================
# Test script for resume_url validation fix
# =============================================

BASE_URL="http://localhost:3000"
API_ENDPOINT="$BASE_URL/api/applications"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "Testing Resume URL Validation Fix"
echo "======================================"
echo ""

# Get a valid job_id
JOBS_RESPONSE=$(curl -s "$BASE_URL/api/test-supabase")
JOB_ID=$(echo $JOBS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['jobs'][0]['id'])" 2>/dev/null)

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}❌ Failed to get job ID${NC}"
    exit 1
fi

CANDIDATE_ID="550e8400-e29b-41d4-a716-446655440100"

echo "======================================"
echo "❌ INVALID URLS (Should All Fail)"
echo "======================================"
echo ""

# Test 1: Empty string
echo -e "${YELLOW}Test 1: Empty string resume_url${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"$CANDIDATE_ID\",
    \"resume_url\": \"\"
  }" \
  -s | python3 -m json.tool | grep -E "(error|details|resume_url)" | head -5
echo ""
echo "---"
echo ""

# Test 2: Invalid URL format
echo -e "${YELLOW}Test 2: Invalid URL format (not-a-url)${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440101\",
    \"resume_url\": \"not-a-url\"
  }" \
  -s | python3 -m json.tool | grep -E "(error|details|resume_url)" | head -5
echo ""
echo "---"
echo ""

# Test 3: Dangerous protocol
echo -e "${YELLOW}Test 3: Dangerous protocol (javascript:)${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440102\",
    \"resume_url\": \"javascript:alert('xss')\"
  }" \
  -s | python3 -m json.tool | grep -E "(error|details|resume_url)" | head -5
echo ""
echo "---"
echo ""

# Test 4: File protocol
echo -e "${YELLOW}Test 4: File protocol (file://)${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440103\",
    \"resume_url\": \"file:///etc/passwd\"
  }" \
  -s | python3 -m json.tool | grep -E "(error|details|resume_url)" | head -5
echo ""
echo "---"
echo ""

# Test 5: Invalid file extension
echo -e "${YELLOW}Test 5: Invalid file extension (.exe)${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440104\",
    \"resume_url\": \"https://example.com/malware.exe\"
  }" \
  -s | python3 -m json.tool | grep -E "(error|details|resume_url)" | head -5
echo ""
echo "---"
echo ""

# Test 6: Missing resume_url
echo -e "${YELLOW}Test 6: Missing resume_url field${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440105\"
  }" \
  -s | python3 -m json.tool | grep -E "(error|details|resume_url)" | head -5
echo ""
echo "---"
echo ""

echo "======================================"
echo "✅ VALID URLS (Should All Succeed)"
echo "======================================"
echo ""

# Test 7: Valid PDF URL
echo -e "${GREEN}Test 7: Valid HTTPS URL with .pdf${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440106\",
    \"resume_url\": \"https://example.com/resumes/john-doe.pdf\"
  }" \
  -s | python3 -m json.tool | grep -E "(message|application|resume_url)" | head -3
echo ""
echo "---"
echo ""

# Test 8: Valid DOCX URL
echo -e "${GREEN}Test 8: Valid HTTP URL with .docx${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440107\",
    \"resume_url\": \"http://cdn.example.com/files/resume.docx\"
  }" \
  -s | python3 -m json.tool | grep -E "(message|application|resume_url)" | head -3
echo ""
echo "---"
echo ""

# Test 9: Supabase storage URL
echo -e "${GREEN}Test 9: Supabase storage URL (no extension)${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440108\",
    \"resume_url\": \"https://guczoogfmajuowelwqvi.supabase.co/storage/v1/object/public/resumes/uuid-file\"
  }" \
  -s | python3 -m json.tool | grep -E "(message|application|resume_url)" | head -3
echo ""
echo "---"
echo ""

# Test 10: S3 URL
echo -e "${GREEN}Test 10: AWS S3 URL (no extension)${NC}"
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"candidate_id\": \"550e8400-e29b-41d4-a716-446655440109\",
    \"resume_url\": \"https://my-bucket.s3.amazonaws.com/resumes/candidate-123\"
  }" \
  -s | python3 -m json.tool | grep -E "(message|application|resume_url)" | head -3
echo ""

echo "======================================"
echo -e "${GREEN}✓ Testing complete!${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "  ❌ Tests 1-6: Should return 400 (validation errors)"
echo "  ✅ Tests 7-10: Should return 201 (created successfully)"
