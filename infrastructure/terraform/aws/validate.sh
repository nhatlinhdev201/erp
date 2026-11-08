#!/bin/bash

###############################################################################
# L-ERP Terraform Configuration Validation Script
# Kiểm tra cấu hình Terraform L-ERP
#
# Usage: ./validate.sh
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="lerp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for output
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if commands are available
check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Main validation
main() {
    echo -e "\n${BLUE}L-ERP Terraform Configuration Validator${NC}\n"

    # Check prerequisites
    print_header "Checking Prerequisites"

    MISSING_TOOLS=0

    check_command "terraform" || MISSING_TOOLS=$((MISSING_TOOLS + 1))
    check_command "aws" || MISSING_TOOLS=$((MISSING_TOOLS + 1))
    check_command "kubectl" || MISSING_TOOLS=$((MISSING_TOOLS + 1))

    if [ $MISSING_TOOLS -gt 0 ]; then
        print_warning "Some tools are missing. Please install them before deployment."
    else
        print_success "All required tools are installed"
    fi

    # Check AWS credentials
    print_header "Checking AWS Credentials"

    if aws sts get-caller-identity &> /dev/null; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        ACCOUNT_ARN=$(aws sts get-caller-identity --query Arn --output text)
        print_success "AWS credentials configured"
        echo "  Account ID: $ACCOUNT_ID"
        echo "  ARN: $ACCOUNT_ARN"
    else
        print_error "AWS credentials not configured or invalid"
        return 1
    fi

    # Check Terraform files
    print_header "Checking Terraform Files"

    REQUIRED_FILES=(
        "main.tf"
        "variables.tf"
        "outputs.tf"
        "vpc.tf"
        "eks.tf"
        "rds.tf"
        "redis.tf"
        "s3.tf"
        "iam.tf"
    )

    MISSING_FILES=0
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$SCRIPT_DIR/$file" ]; then
            print_success "$file exists"
        else
            print_error "$file is missing"
            MISSING_FILES=$((MISSING_FILES + 1))
        fi
    done

    if [ $MISSING_FILES -gt 0 ]; then
        print_error "Some Terraform files are missing"
        return 1
    fi

    # Check terraform.tfvars
    print_header "Checking Configuration Files"

    if [ -f "$SCRIPT_DIR/terraform.tfvars" ]; then
        print_success "terraform.tfvars exists"
    else
        if [ -f "$SCRIPT_DIR/terraform.tfvars.example" ]; then
            print_warning "terraform.tfvars not found, but terraform.tfvars.example exists"
            echo "  Run: cp terraform.tfvars.example terraform.tfvars"
        else
            print_error "terraform.tfvars.example not found"
        fi
    fi

    # Validate Terraform syntax
    print_header "Validating Terraform Syntax"

    cd "$SCRIPT_DIR"

    if terraform validate > /dev/null 2>&1; then
        print_success "Terraform configuration is valid"
    else
        print_error "Terraform configuration validation failed"
        terraform validate
        return 1
    fi

    # Check for common issues
    print_header "Checking for Common Issues"

    # Check if using hardcoded values
    if grep -q "hardcoded" *.tf 2>/dev/null; then
        print_warning "Found 'hardcoded' in Terraform files - review for hardcoded values"
    else
        print_success "No obvious hardcoded values found"
    fi

    # Check for TODO comments
    if grep -q "TODO\|FIXME" *.tf 2>/dev/null; then
        print_warning "Found TODO/FIXME comments in Terraform files"
        grep -n "TODO\|FIXME" *.tf
    else
        print_success "No TODO/FIXME comments found"
    fi

    # Check Backend Configuration
    print_header "Backend Configuration"

    if grep -q "bucket.*=.*\"lerp-terraform-state\"" main.tf; then
        print_warning "Backend S3 bucket is set to default value"
        echo "  Update main.tf backend configuration with your bucket name:"
        echo "  - lerp-terraform-state"
        echo "  - lerp-terraform-locks"
    else
        print_success "Backend configuration looks customized"
    fi

    # Show configuration summary
    print_header "Configuration Summary"

    if [ -f "$SCRIPT_DIR/terraform.tfvars" ]; then
        echo "Environment Variables from terraform.tfvars:"
        grep -E "^[a-z_]+ *= *" terraform.tfvars | head -10
        echo ""
    fi

    # Final checks
    print_header "Next Steps"

    echo "1. Review your terraform.tfvars configuration:"
    echo "   - project_name"
    echo "   - environment (dev/staging/prod)"
    echo "   - aws_region"
    echo "   - EKS node group configuration"
    echo "   - RDS instance class and storage"
    echo ""

    echo "2. Create S3 backend (if first time):"
    echo "   aws s3api create-bucket --bucket lerp-terraform-state --region ap-southeast-1"
    echo "   aws dynamodb create-table --table-name lerp-terraform-locks ..."
    echo ""

    echo "3. Initialize Terraform:"
    echo "   terraform init"
    echo ""

    echo "4. Plan deployment:"
    echo "   terraform plan -out=tfplan"
    echo ""

    echo "5. Review and apply:"
    echo "   terraform apply tfplan"
    echo ""

    print_header "Validation Complete"
    print_success "All checks passed! Ready to deploy."
}

# Run validation
main "$@"
