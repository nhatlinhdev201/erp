# L-ERP Terraform AWS - Documentation Index

## Quick Navigation

### For First-Time Users
1. Start with **README.md** - Bilingual deployment guide
2. Review **terraform.tfvars.example** - Example configurations
3. Run **validate.sh** - Pre-deployment validation
4. Follow deployment steps in README.md

### For Understanding Architecture
1. **STRUCTURE.md** - File organization and architecture
2. **RESOURCES.md** - Complete resource list and AWS services
3. **Terraform files** - Main code with bilingual comments

### For Deployment & Operations
1. **README.md** - Step-by-step deployment instructions
2. **terraform.tfvars.example** - Configuration templates
3. **validate.sh** - Validation script

### For Troubleshooting
1. **README.md** - Troubleshooting section
2. **IMPLEMENTATION_SUMMARY.md** - Checklist and common issues

---

## File Guide

### Core Terraform Modules

#### **main.tf** (88 lines)
Root module configuration with:
- Terraform version and provider requirements
- S3 backend for state management
- Provider configuration (AWS, Kubernetes, Helm)
- Local variables for naming and tagging

**When to modify**: Backend bucket name, provider versions

#### **variables.tf** (345 lines)
All input variables organized by category:
- Basic: project_name, environment, region
- VPC: CIDR ranges, NAT configuration
- EKS: Kubernetes version, node groups
- RDS: Database configuration
- Redis: Cache configuration
- S3: Storage configuration
- Tagging: Custom tags

**When to modify**: Never directly - use terraform.tfvars instead

#### **outputs.tf** (220 lines)
Output values for:
- VPC endpoints (IDs, subnets, NAT IPs)
- EKS endpoints (cluster endpoint, kubeconfig)
- RDS endpoints (database endpoint, connection string)
- Redis endpoints (cluster endpoint, connection string)
- S3 bucket names and ARNs
- IAM role ARNs
- Deployment summary

**Useful for**: Getting endpoints after deployment

#### **vpc.tf** (255 lines)
VPC and networking resources:
- VPC with configurable CIDR
- 3 public subnets (1 per AZ)
- 3 private subnets (1 per AZ)
- Internet Gateway
- NAT Gateway(s)
- Route tables
- VPC Flow Logs

**Key features**: Multi-AZ, configurable NAT count, flow logs

#### **eks.tf** (388 lines)
Kubernetes cluster configuration:
- EKS cluster (v1.29)
- Node groups (general, compute)
- OIDC provider for IRSA
- Add-ons (CoreDNS, kube-proxy, VPC CNI)
- Security groups
- IAM roles
- Cluster autoscaler
- CloudWatch logging

**Key features**: OIDC for pod identities, auto-scaling, managed add-ons

#### **rds.tf** (198 lines)
PostgreSQL database configuration:
- RDS instance (PostgreSQL 16)
- Subnet group
- Parameter group (optimized)
- Security group
- Multi-AZ for production
- Automated backups
- Performance Insights
- Enhanced monitoring
- CloudWatch alarms

**Key features**: Auto-scaling storage, Performance Insights, alarms

#### **redis.tf** (207 lines)
ElastiCache Redis configuration:
- Redis cluster (v7.0)
- Subnet group
- Parameter group
- Security group
- Automatic failover (production)
- Multi-AZ (production)
- Snapshot retention
- CloudWatch alarms
- SNS notifications

**Key features**: HA for production, encryption, alarms

#### **s3.tf** (206 lines)
S3 storage buckets:
- Uploads bucket (file storage)
- Backups bucket (database backups)
- Logs bucket (access logs)
- Versioning on all buckets
- Server-side encryption
- Lifecycle policies
- Access logging
- Bucket policies (HTTPS enforcement)

**Key features**: Lifecycle rules, encryption, versioning

#### **iam.tf** (280 lines)
IAM roles and policies:
- S3 access role for pods
- RDS proxy role
- Backup/restore role
- Monitoring role
- ALB controller role
- Secrets Manager access role
- All use IRSA (OIDC-based identities)

**Key features**: IRSA, least privilege, OIDC trust

### Configuration & Documentation

#### **terraform.tfvars.example** (200+ lines)
Example configurations for three environments:
- Development: Minimal resources
- Staging: Medium resources
- Production: Full HA, Multi-AZ

**How to use**:
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

#### **README.md** (400+ lines)
Complete bilingual guide:
- **English**: Full deployment guide, troubleshooting
- **Vietnamese**: Complete guide with examples
- Quick start
- Prerequisites
- Deployment steps
- Configuration reference
- Monitoring guide
- Troubleshooting

**Read when**: First-time deployment, need to troubleshoot issues

#### **STRUCTURE.md** (300+ lines)
Architecture and organization:
- File descriptions
- Resource architecture diagram
- Naming conventions
- Tagging strategy
- Security features
- HA features
- Cost optimization
- Deployment workflow
- State management

**Read when**: Understanding how everything fits together

#### **IMPLEMENTATION_SUMMARY.md** (400+ lines)
Feature summary and checklist:
- Overview of files and lines
- Implementation details per service
- Configuration examples
- Security features
- HA features
- Cost optimization
- Deployment checklist
- Pre/post deployment steps

**Read when**: Planning deployment, want checklist

#### **RESOURCES.md** (300+ lines)
Complete resource inventory:
- Detailed resource list (50+)
- Naming conventions
- Resource dependencies
- Tags applied
- AWS services used
- Cost estimation
- Monitoring alarms
- Security groups
- Cleanup procedures

**Read when**: Understanding what resources are created, cost analysis

#### **validate.sh** (Executable)
Pre-deployment validation script:
- Checks Terraform installation
- Checks AWS credentials
- Validates Terraform files
- Checks for common issues
- Shows deployment checklist

**Run before**: First deployment

#### **.gitignore**
Git ignore rules for:
- Terraform state files
- IDE files
- OS files
- Local configuration
- Credentials
- Generated files

**Important**: Don't commit terraform.tfvars or .tfstate files!

---

## Typical Workflows

### First-Time Deployment

```bash
# 1. Read
cat README.md

# 2. Prepare
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars  # Edit with your values

# 3. Validate
./validate.sh

# 4. Deploy
terraform init
terraform plan -out=tfplan
terraform show tfplan  # Review
terraform apply tfplan

# 5. Configure kubectl
aws eks update-kubeconfig --region ap-southeast-1 --name lerp-dev-eks
kubectl get nodes
```

### Update Existing Infrastructure

```bash
# 1. Modify variables
vim terraform.tfvars

# 2. Review changes
terraform plan

# 3. Apply selectively
terraform apply -target=aws_eks_node_group.main  # Example
```

### Scale Resources

```bash
# To scale EKS nodes:
# Edit terraform.tfvars, change eks_node_groups.general.desired_size
terraform apply -var 'eks_node_groups={general={desired_size=5}}'

# To scale RDS storage:
terraform apply -var 'rds_allocated_storage=100'
```

### Destroy Infrastructure

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy everything
terraform destroy

# Note: RDS final snapshot preserved if production
```

---

## Key Configuration Files

### For Development
```bash
cp terraform.tfvars.example terraform.tfvars
# Uncomment development section in file
```

### For Staging
```bash
cp terraform.tfvars.example terraform.tfvars
# Uncomment staging section in file
```

### For Production
```bash
cp terraform.tfvars.example terraform.tfvars
# Uncomment production section in file
```

---

## Important Settings by Environment

### Development
- Instance types: t3.medium (EKS), db.t4g.medium (RDS), cache.t4g.micro (Redis)
- Auto-scaling: 1-5 nodes, 50GB storage
- Multi-AZ: Disabled
- NAT Gateways: 1
- Cost: ~$190/month

### Staging
- Instance types: t3.large (EKS), db.t4g.large (RDS), cache.t4g.small (Redis)
- Auto-scaling: 2-10 nodes, 100GB storage
- Multi-AZ: Disabled for RDS/Redis
- NAT Gateways: 1
- Cost: ~$370/month

### Production
- Instance types: t3.xlarge + c6i.2xlarge (EKS), db.r6i.xlarge (RDS), cache.r6g.xlarge (Redis)
- Auto-scaling: 3-20 nodes, 500GB storage
- Multi-AZ: Enabled for RDS/Redis
- NAT Gateways: 3 (one per AZ)
- Cost: ~$2,100+/month

---

## Command Reference

```bash
# Initialization
terraform init                          # Initialize Terraform

# Planning & Review
terraform plan                          # Show what would be created
terraform plan -out=tfplan             # Save plan to file
terraform show tfplan                  # Show saved plan
terraform validate                      # Validate syntax
terraform fmt                          # Format code

# Deployment
terraform apply                         # Apply changes
terraform apply tfplan                 # Apply saved plan
terraform apply -var 'key=value'       # Override variables

# State Management
terraform state list                    # List resources
terraform state show <resource>         # Show resource details
terraform state rm <resource>          # Remove from state

# Destruction
terraform plan -destroy                 # Show what would be deleted
terraform destroy                       # Delete all resources

# Outputs
terraform output                        # Show all outputs
terraform output <name>                 # Show specific output
terraform output -raw <name>           # Raw output (no quotes)
```

---

## Support Resources

**Documentation**
- README.md - Complete guide
- STRUCTURE.md - Architecture details
- IMPLEMENTATION_SUMMARY.md - Feature summary

**Scripts**
- validate.sh - Pre-deployment validation
- .gitignore - Git configuration

**Examples**
- terraform.tfvars.example - Configuration templates
- Code comments - Bilingual comments in all .tf files

**Troubleshooting**
- See README.md "Troubleshooting" section
- Check CloudWatch logs
- Review Terraform output
- Validate AWS permissions

---

## Recommended Reading Order

**For Implementers** (Setting up infrastructure):
1. README.md (English section)
2. terraform.tfvars.example
3. validate.sh
4. Deploy following README instructions

**For Architects** (Understanding design):
1. STRUCTURE.md
2. RESOURCES.md
3. IMPLEMENTATION_SUMMARY.md
4. Individual .tf files with comments

**For Operators** (Managing infrastructure):
1. README.md (Monitoring & Troubleshooting sections)
2. RESOURCES.md (Resource costs)
3. Individual .tf files (for specific components)

**For Developers** (Using the infrastructure):
1. README.md (Application deployment section)
2. outputs.tf (Available endpoints)
3. README.md (Troubleshooting)

---

**Last Updated**: March 29, 2026
**Version**: 1.0 (Complete)
**Status**: Production-Ready
