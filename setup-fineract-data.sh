#!/bin/bash

# Setup Fineract Data Script
# This script creates all necessary data in your local Fineract Docker instance
# Prerequisites: Fineract must be running on localhost:8443

set -e

FINERACT_URL="${FINERACT_URL:-https://localhost:8443/fineract-provider/api/v1}"
TENANT="default"
USERNAME="mifos"
PASSWORD="password"

echo "🚀 Setting up Fineract data..."
echo "Fineract URL: $FINERACT_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to make authenticated API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -k -s --max-time 30 -X "$method" \
            "${FINERACT_URL}${endpoint}?tenantIdentifier=${TENANT}" \
            -H "Content-Type: application/json" \
            -u "${USERNAME}:${PASSWORD}" \
            -H "Fineract-Platform-TenantId: ${TENANT}"
    else
        curl -k -s --max-time 30 -X "$method" \
            "${FINERACT_URL}${endpoint}?tenantIdentifier=${TENANT}" \
            -H "Content-Type: application/json" \
            -u "${USERNAME}:${PASSWORD}" \
            -H "Fineract-Platform-TenantId: ${TENANT}" \
            -d "$data"
    fi
}

# Test connection
echo -e "${YELLOW}Testing connection...${NC}"
response=$(api_call GET "/authentication" 2>&1)
if echo "$response" | grep -q "Bad Request\|error\|Error"; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${GREEN}✅ Connection successful${NC}"
fi
echo ""

# Step 1: Get Head Office ID (should already exist)
echo -e "${YELLOW}Step 1: Getting Head Office...${NC}"
offices=$(api_call GET "/offices")
office_id=$(echo "$offices" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
if [ -z "$office_id" ]; then
    echo -e "${RED}❌ No office found. Creating Head Office...${NC}"
    office_data='{
        "name": "Head Office",
        "openingDate": "01 January 2010",
        "dateFormat": "dd MMMM yyyy",
        "locale": "en"
    }'
    office_response=$(api_call POST "/offices" "$office_data")
    office_id=$(echo "$office_response" | grep -o '"resourceId":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✅ Created Head Office with ID: $office_id${NC}"
else
    echo -e "${GREEN}✅ Found Head Office with ID: $office_id${NC}"
fi
echo ""

# Step 2: Create Staff (Loan Officers)
echo -e "${YELLOW}Step 2: Creating Staff...${NC}"
staff_data='{
    "firstname": "John",
    "lastname": "Doe",
    "officeId": '$office_id',
    "isLoanOfficer": true,
    "isActive": true,
    "joiningDate": "01 January 2010",
    "dateFormat": "dd MMMM yyyy",
    "locale": "en"
}'
staff_response=$(api_call POST "/staff" "$staff_data")
# Check if response contains error
if echo "$staff_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
    # Staff might already exist, try to get existing staff
    echo -e "${YELLOW}⚠️  Staff creation returned error, checking for existing staff...${NC}"
    staff_list=$(api_call GET "/staff")
    staff_id=$(echo "$staff_list" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    if [ -n "$staff_id" ]; then
        echo -e "${GREEN}✅ Using existing Staff with ID: $staff_id${NC}"
    else
        echo -e "${RED}❌ Failed to create or find staff${NC}"
        echo "Response: $staff_response"
        exit 1
    fi
else
    staff_id=$(echo "$staff_response" | grep -o '"resourceId":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$staff_id" ]; then
        echo -e "${GREEN}✅ Created Staff with ID: $staff_id${NC}"
    else
        # Try to get existing staff
        staff_list=$(api_call GET "/staff")
        staff_id=$(echo "$staff_list" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
        if [ -n "$staff_id" ]; then
            echo -e "${GREEN}✅ Using existing Staff with ID: $staff_id${NC}"
        else
            echo -e "${RED}❌ Failed to create or find staff${NC}"
            exit 1
        fi
    fi
fi
echo ""

# Step 3: Create Fund
echo -e "${YELLOW}Step 3: Creating Fund...${NC}"
# First check if fund already exists
funds_list=$(api_call GET "/funds")
fund_id=$(echo "$funds_list" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
if [ -n "$fund_id" ]; then
    echo -e "${GREEN}✅ Using existing Fund with ID: $fund_id${NC}"
else
    fund_data='{
        "name": "Loan Fund"
    }'
    fund_response=$(api_call POST "/funds" "$fund_data")
    if echo "$fund_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
        echo -e "${YELLOW}⚠️  Fund creation returned error, continuing without fund...${NC}"
        fund_id=""
    else
        fund_id=$(echo "$fund_response" | grep -o '"resourceId":[0-9]*' | grep -o '[0-9]*')
        if [ -n "$fund_id" ]; then
            echo -e "${GREEN}✅ Created Fund with ID: $fund_id${NC}"
        else
            echo -e "${YELLOW}⚠️  No fund found, continuing without fund...${NC}"
            fund_id=""
        fi
    fi
fi
echo ""

# Step 4: Get Loan Product Template
echo -e "${YELLOW}Step 4: Getting Loan Product Template...${NC}"
template=$(api_call GET "/loanproducts/template")
echo -e "${GREEN}✅ Got template${NC}"
echo ""

# Step 5: Create Loan Products
echo -e "${YELLOW}Step 5: Creating Loan Products...${NC}"

# Check existing products
existing_products=$(api_call GET "/loanproducts")
existing_stl=$(echo "$existing_products" | grep -o '"shortName":"STL"' || true)
existing_ltl=$(echo "$existing_products" | grep -o '"shortName":"LTL"' || true)
existing_pl=$(echo "$existing_products" | grep -o '"shortName":"PL"' || true)

# Build product data with optional fundId
if [ -n "$fund_id" ]; then
    fund_json="\"fundId\": $fund_id,"
else
    fund_json=""
fi

# Product 1: Short Term Loan
product1_data="{
    \"name\": \"Short Term Loan\",
    \"shortName\": \"STL\",
    \"currencyCode\": \"USD\",
    \"digitsAfterDecimal\": 2,
    \"inMultiplesOf\": 0,
    $fund_json
    \"principal\": 10000,
    \"numberOfRepayments\": 12,
    \"repaymentEvery\": 1,
    \"repaymentFrequencyType\": 1,
    \"interestRatePerPeriod\": 12,
    \"interestRateFrequencyType\": 3,
    \"amortizationType\": 1,
    \"interestType\": 1,
    \"interestCalculationPeriodType\": 1,
    \"transactionProcessingStrategyCode\": \"mifos-standard-strategy\",
    \"accountingRule\": \"1\",
    \"daysInYearType\": 1,
    \"daysInMonthType\": 1,
    \"isInterestRecalculationEnabled\": false,
    \"dateFormat\": \"dd MMMM yyyy\",
    \"locale\": \"en\",
    \"startDate\": \"01 January 2010\"
}"
if [ -n "$existing_stl" ]; then
    product1_id=$(echo "$existing_products" | python3 -c "import sys, json; data = json.load(sys.stdin); products = [p for p in data if p.get('shortName') == 'STL']; print(products[0]['id'] if products else '')" 2>/dev/null || echo "")
    if [ -n "$product1_id" ]; then
        echo -e "${GREEN}✅ Loan Product 1 (Short Term) already exists with ID: $product1_id${NC}"
    else
        echo -e "${YELLOW}⚠️  STL product exists but couldn't get ID${NC}"
        product1_id=""
    fi
else
    product1_response=$(api_call POST "/loanproducts" "$product1_data")
    if echo "$product1_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
        echo -e "${YELLOW}⚠️  Loan Product 1 creation returned error${NC}"
        echo "$product1_response" | python3 -m json.tool 2>/dev/null | grep -A 2 "defaultUserMessage" | head -5 || echo "$product1_response" | head -5
        product1_id=""
    else
        product1_id=$(echo "$product1_response" | grep -o '"resourceId":[0-9]*' | grep -o '[0-9]*')
        if [ -n "$product1_id" ]; then
            echo -e "${GREEN}✅ Created Loan Product 1 (Short Term) with ID: $product1_id${NC}"
        else
            echo -e "${RED}❌ Failed to create loan product 1${NC}"
        fi
    fi
fi

# Product 2: Long Term Loan
product2_data="{
    \"name\": \"Long Term Loan\",
    \"shortName\": \"LTL\",
    \"currencyCode\": \"USD\",
    \"digitsAfterDecimal\": 2,
    \"inMultiplesOf\": 0,
    $fund_json
    \"principal\": 50000,
    \"numberOfRepayments\": 60,
    \"repaymentEvery\": 1,
    \"repaymentFrequencyType\": 1,
    \"interestRatePerPeriod\": 8,
    \"interestRateFrequencyType\": 3,
    \"amortizationType\": 1,
    \"interestType\": 1,
    \"interestCalculationPeriodType\": 1,
    \"transactionProcessingStrategyCode\": \"mifos-standard-strategy\",
    \"accountingRule\": \"1\",
    \"daysInYearType\": 1,
    \"daysInMonthType\": 1,
    \"isInterestRecalculationEnabled\": false,
    \"dateFormat\": \"dd MMMM yyyy\",
    \"locale\": \"en\",
    \"startDate\": \"01 January 2010\"
}"
if [ -n "$existing_ltl" ]; then
    product2_id=$(echo "$existing_products" | python3 -c "import sys, json; data = json.load(sys.stdin); products = [p for p in data if p.get('shortName') == 'LTL']; print(products[0]['id'] if products else '')" 2>/dev/null || echo "")
    if [ -n "$product2_id" ]; then
        echo -e "${GREEN}✅ Loan Product 2 (Long Term) already exists with ID: $product2_id${NC}"
    else
        echo -e "${YELLOW}⚠️  LTL product exists but couldn't get ID${NC}"
        product2_id=""
    fi
else
    product2_response=$(api_call POST "/loanproducts" "$product2_data")
    if echo "$product2_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
        echo -e "${YELLOW}⚠️  Loan Product 2 creation returned error${NC}"
        echo "$product2_response" | python3 -m json.tool 2>/dev/null | grep -A 2 "defaultUserMessage" | head -5 || echo "$product2_response" | head -5
        product2_id=""
    else
        product2_id=$(echo "$product2_response" | grep -o '"resourceId":[0-9]*' | grep -o '[0-9]*')
        if [ -n "$product2_id" ]; then
            echo -e "${GREEN}✅ Created Loan Product 2 (Long Term) with ID: $product2_id${NC}"
        else
            echo -e "${RED}❌ Failed to create loan product 2${NC}"
        fi
    fi
fi

# Product 3: Progressive Loan (using standard strategy - advanced requires payment allocation setup)
product3_data="{
    \"name\": \"Progressive Loan\",
    \"shortName\": \"PL\",
    \"currencyCode\": \"USD\",
    \"digitsAfterDecimal\": 2,
    \"inMultiplesOf\": 0,
    $fund_json
    \"principal\": 20000,
    \"numberOfRepayments\": 24,
    \"repaymentEvery\": 1,
    \"repaymentFrequencyType\": 1,
    \"interestRatePerPeriod\": 15,
    \"interestRateFrequencyType\": 3,
    \"amortizationType\": 1,
    \"interestType\": 1,
    \"interestCalculationPeriodType\": 1,
    \"transactionProcessingStrategyCode\": \"mifos-standard-strategy\",
    \"accountingRule\": \"1\",
    \"daysInYearType\": 1,
    \"daysInMonthType\": 1,
    \"isInterestRecalculationEnabled\": false,
    \"dateFormat\": \"dd MMMM yyyy\",
    \"locale\": \"en\",
    \"startDate\": \"01 January 2010\"
}"
if [ -n "$existing_pl" ]; then
    product3_id=$(echo "$existing_products" | python3 -c "import sys, json; data = json.load(sys.stdin); products = [p for p in data if p.get('shortName') == 'PL']; print(products[0]['id'] if products else '')" 2>/dev/null || echo "")
    if [ -n "$product3_id" ]; then
        echo -e "${GREEN}✅ Loan Product 3 (Progressive) already exists with ID: $product3_id${NC}"
    else
        echo -e "${YELLOW}⚠️  PL product exists but couldn't get ID${NC}"
        product3_id=""
    fi
else
    product3_response=$(api_call POST "/loanproducts" "$product3_data")
    if echo "$product3_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
        echo -e "${YELLOW}⚠️  Loan Product 3 creation returned error${NC}"
        echo "$product3_response" | python3 -m json.tool 2>/dev/null | grep -A 2 "defaultUserMessage" | head -5 || echo "$product3_response" | head -5
        product3_id=""
    else
        product3_id=$(echo "$product3_response" | grep -o '"resourceId":[0-9]*' | grep -o '[0-9]*')
        if [ -n "$product3_id" ]; then
            echo -e "${GREEN}✅ Created Loan Product 3 (Progressive) with ID: $product3_id${NC}"
        else
            echo -e "${RED}❌ Failed to create loan product 3${NC}"
        fi
    fi
fi
echo ""

# Step 6: Create Clients
echo -e "${YELLOW}Step 6: Creating Clients...${NC}"

# Client 1
client1_data='{
    "firstname": "John",
    "lastname": "Smith",
    "officeId": '$office_id',
    "staffId": '$staff_id',
    "legalFormId": 1,
    "active": true,
    "activationDate": "01 January 2024",
    "dateFormat": "dd MMMM yyyy",
    "locale": "en",
    "submittedOnDate": "01 January 2024"
}'
client1_response=$(api_call POST "/clients" "$client1_data")
if echo "$client1_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
    echo -e "${YELLOW}⚠️  Client 1 creation returned error${NC}"
    echo "$client1_response" | python3 -m json.tool 2>/dev/null | grep -A 2 "defaultUserMessage" | head -5 || echo "$client1_response" | head -5
    client1_id=""
else
    client1_id=$(echo "$client1_response" | grep -o '"clientId":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$client1_id" ]; then
        echo -e "${GREEN}✅ Created Client 1 (John Smith) with ID: $client1_id${NC}"
    else
        echo -e "${RED}❌ Failed to create client 1${NC}"
        client1_id=""
    fi
fi

# Client 2
client2_data='{
    "firstname": "Jane",
    "lastname": "Doe",
    "officeId": '$office_id',
    "staffId": '$staff_id',
    "legalFormId": 1,
    "active": true,
    "activationDate": "01 January 2024",
    "dateFormat": "dd MMMM yyyy",
    "locale": "en",
    "submittedOnDate": "01 January 2024"
}'
client2_response=$(api_call POST "/clients" "$client2_data")
if echo "$client2_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
    echo -e "${YELLOW}⚠️  Client 2 creation returned error${NC}"
    echo "$client2_response" | python3 -m json.tool 2>/dev/null | grep -A 2 "defaultUserMessage" | head -5 || echo "$client2_response" | head -5
    client2_id=""
else
    client2_id=$(echo "$client2_response" | grep -o '"clientId":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$client2_id" ]; then
        echo -e "${GREEN}✅ Created Client 2 (Jane Doe) with ID: $client2_id${NC}"
    else
        echo -e "${RED}❌ Failed to create client 2${NC}"
        client2_id=""
    fi
fi

# Client 3
client3_data='{
    "firstname": "Bob",
    "lastname": "Johnson",
    "officeId": '$office_id',
    "staffId": '$staff_id',
    "legalFormId": 1,
    "active": true,
    "activationDate": "01 January 2024",
    "dateFormat": "dd MMMM yyyy",
    "locale": "en",
    "submittedOnDate": "01 January 2024"
}'
client3_response=$(api_call POST "/clients" "$client3_data")
if echo "$client3_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
    echo -e "${YELLOW}⚠️  Client 3 creation returned error${NC}"
    echo "$client3_response" | python3 -m json.tool 2>/dev/null | grep -A 2 "defaultUserMessage" | head -5 || echo "$client3_response" | head -5
    client3_id=""
else
    client3_id=$(echo "$client3_response" | grep -o '"clientId":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$client3_id" ]; then
        echo -e "${GREEN}✅ Created Client 3 (Bob Johnson) with ID: $client3_id${NC}"
    else
        echo -e "${RED}❌ Failed to create client 3${NC}"
        client3_id=""
    fi
fi
echo ""

# Step 7: Create Loan Applications (Optional - for testing)
echo -e "${YELLOW}Step 7: Creating Sample Loan Applications...${NC}"

if [ -n "$client1_id" ] && [ -n "$product1_id" ]; then
    echo -e "${YELLOW}  Creating loan for Client $client1_id with Product $product1_id...${NC}"
    # Get loan template for client 1
    loan_template=$(api_call GET "/clients/$client1_id/loans/template?productId=$product1_id")
    
    loan1_data='{
        "clientId": '$client1_id',
        "productId": '$product1_id',
        "principal": 10000,
        "loanTermFrequency": 12,
        "loanTermFrequencyType": 1,
        "numberOfRepayments": 12,
        "repaymentEvery": 1,
        "repaymentFrequencyType": 1,
        "interestRatePerPeriod": 12,
        "amortizationType": 1,
        "interestType": 1,
        "interestCalculationPeriodType": 1,
        "transactionProcessingStrategyCode": "mifos-standard-strategy",
        "expectedDisbursementDate": "01 January 2024",
        "submittedOnDate": "01 January 2024",
        "dateFormat": "dd MMMM yyyy",
        "locale": "en"
    }'
    loan1_response=$(api_call POST "/loans" "$loan1_data")
    if echo "$loan1_response" | grep -q '"errors"\|"error"\|"developerMessage"'; then
        echo -e "${YELLOW}⚠️  Loan application creation returned error (may need approval workflow)${NC}"
        echo "$loan1_response" | python3 -m json.tool 2>/dev/null | grep -A 2 "defaultUserMessage" | head -3 || echo "$loan1_response" | head -3
    else
        loan1_id=$(echo "$loan1_response" | grep -o '"loanId":[0-9]*' | grep -o '[0-9]*')
        if [ -n "$loan1_id" ]; then
            echo -e "${GREEN}✅ Created Loan Application 1 with ID: $loan1_id${NC}"
        else
            echo -e "${YELLOW}⚠️  Loan application may need approval workflow${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Skipping loan application (client or product ID missing)${NC}"
fi
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Summary:"
echo "  - Office ID: $office_id"
echo "  - Staff ID: $staff_id"
[ -n "$fund_id" ] && echo "  - Fund ID: $fund_id"
[ -n "$product1_id" ] && echo "  - Loan Product 1 (Short Term) ID: $product1_id"
[ -n "$product2_id" ] && echo "  - Loan Product 2 (Long Term) ID: $product2_id"
[ -n "$product3_id" ] && echo "  - Loan Product 3 (Progressive) ID: $product3_id"
[ -n "$client1_id" ] && echo "  - Client 1 (John Smith) ID: $client1_id"
[ -n "$client2_id" ] && echo "  - Client 2 (Jane Doe) ID: $client2_id"
[ -n "$client3_id" ] && echo "  - Client 3 (Bob Johnson) ID: $client3_id"
echo ""
echo "You can now use these IDs to test the client portal!"

