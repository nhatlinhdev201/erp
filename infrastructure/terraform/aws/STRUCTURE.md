# Terraform AWS Infrastructure - File Structure

## TIP-016 Implementation for L-ERP

This directory contains the complete Infrastructure-as-Code (IaC) configuration for L-ERP's AWS deployment using Terraform.

### File Organization

```
infrastructure/terraform/aws/
├── main.tf                      # Root module configuration, providers, backend setup
├── variables.tf                 # All input variables with validation
├── outputs.tf                   # Output values (endpoints, IDs, connection strings)
├── vpc.tf                       # VPC, subnets, NAT Gateway, route tables, VPC Flow Logs
├── eks.tf                       # EKS cluster, node groups, OIDC provider, add-ons
├── rds.tf                       # RDS PostgreSQL database, monitoring, alarms
├── redis.tf                     # ElastiCache Redis cluster, alarms
├── s3.tf                        # S3 buckets with versioning, encryption, lifecycle rules
├── iam.tf                       # IAM roles, policies for IRSA and service accounts
├── terraform.tfvars.example     # Example configuration for different environments
├── .gitignore                   # Git ignore rules for Terraform files
├── README.md                    # Bilingual deployment guide (English/Vietnamese)
└── STRUCTURE.md                 # This file
```

### File Descriptions

#### main.tf
- Terraform version constraints and required providers
- S3 backend configuration with DynamoDB state locking
- AWS, Kubernetes, and Helm provider setup
- Data sources for availability zones and EKS cluster info
- Local variables for resource naming and common tags

#### variables.tf
- Comprehensive input variables organized by category:
  - Basic: project_name, environment, region
  - VPC: CIDR ranges, subnet configuration
  - EKS: Kubernetes version, node groups, logging
  - RDS: Instance class, storage, backup settings
  - Redis: Node type, engine version, clustering
  - S3: Versioning, encryption, lifecycle rules
  - Tagging: Common tags across all resources

#### outputs.tf
- VPC outputs: VPC ID, subnet IDs, NAT Gateway IPs
- EKS outputs: Cluster endpoint, kubeconfig, OIDC provider URL
- RDS outputs: Database endpoint, connection strings (sensitive)
- Redis outputs: Cluster endpoint, connection strings
- S3 outputs: Bucket names and ARNs
- IAM outputs: Role ARNs for service accounts
- Deployment summary: All-in-one output for quick reference

#### vpc.tf
- VPC with custom CIDR block
- Public subnets with Internet Gateway
- Private subnets with NAT Gateway(s)
- Route tables (separate for public and private)
- VPC Flow Logs with CloudWatch Log Group
- Multi-AZ support (3 availability zones by default)

#### eks.tf
- Security groups for cluster and nodes
- IAM roles for EKS service and node groups
- EKS cluster with managed node groups
- OIDC provider for IRSA (IAM Roles for Service Accounts)
- EKS add-ons: CoreDNS, kube-proxy, VPC CNI
- Cluster Autoscaler IAM role (optional)
- CloudWatch Log Group for cluster logging

#### rds.tf
- RDS PostgreSQL instance with:
  - Multi-AZ support (for production)
  - Automated backups with retention policy
  - Performance Insights enabled
  - Enhanced monitoring
  - Parameter group with optimization settings
- Security group for database access
- CloudWatch alarms for CPU, storage, connections
- IAM role for enhanced monitoring

#### redis.tf
- ElastiCache Redis replication group with:
  - Cluster mode configuration
  - Automatic failover for production
  - Multi-AZ support for production
  - Encryption at rest
  - Snapshot retention
- Security group for Redis access
- Parameter group with eviction policy
- CloudWatch alarms for CPU, memory, evictions, replication lag

#### s3.tf
- S3 bucket for file uploads with:
  - Versioning
  - Server-side encryption
  - Lifecycle policies (Glacier transition, expiration)
  - Access logging
- S3 bucket for backups with similar settings
- S3 bucket for logs
- Bucket policies enforcing HTTPS
- Lifecycle rules for automatic archival and deletion

#### iam.tf
- S3 access role for Pods (IRSA)
- RDS Proxy role (optional)
- Backup/Restore role for snapshots
- Monitoring role for CloudWatch
- ALB controller role for ingress
- Secrets Manager access role
- All roles use OIDC provider for pod identity association

#### terraform.tfvars.example
- Example configurations for three environments:
  - **dev**: Minimal resources, auto-scaling node groups
  - **staging**: Medium-sized setup with replication
  - **prod**: High availability, Multi-AZ, larger instances
- Comments explaining each setting
- Copy to terraform.tfvars before deployment

#### README.md
- Comprehensive deployment guide in English and Vietnamese
- Prerequisites and quick start guide
- Step-by-step deployment instructions
- Configuration variables reference
- Application deployment examples
- Monitoring and logging guide
- Troubleshooting section
- Infrastructure management commands

### Resource Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │  Public Subnet1  │  │  Public Subnet2  │  │  Public S3 ││
│  │  (IGW Route)     │  │  (IGW Route)     │  │            ││
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┘│
│           │                     │                           │
│  ┌────────▼────────────────────▼────────┐                  │
│  │      Internet Gateway                 │                  │
│  └──────────────────────────────────────┘                  │
│           │                                                 │
│  ┌────────┴────────────────────────────┐                  │
│  │      NAT Gateway                     │                  │
│  └────────┬────────────────────────────┘                  │
│           │                                                 │
│  ┌────────▼──────────┐  ┌───────────────┐                │
│  │ Private Subnet1   │  │ Private Subnet│                │
│  │ (NAT Route)       │  │ (NAT Route)   │                │
│  │                   │  │               │                │
│  │ ┌───────────────┐ │  │ ┌───────────┐ │                │
│  │ │ EKS Nodes     │ │  │ │ EKS Nodes │ │                │
│  │ └───────────────┘ │  │ └───────────┘ │                │
│  │                   │  │               │                │
│  │ ┌─────────────┐   │  │               │                │
│  │ │ RDS DB      │   │  │               │                │
│  │ └─────────────┘   │  │               │                │
│  └───────────────────┘  └───────────────┘                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │               ElastiCache Redis                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│         S3 Buckets (Regional, Multi-purpose)                │
├─────────────────────────────────────────────────────────────┤
│ • uploads:  File storage with lifecycle rules              │
│ • backups:  Database backups with archival                │
│ • logs:     Application and service logs                  │
└─────────────────────────────────────────────────────────────┘
```

### Naming Conventions

All resources follow a consistent naming pattern:

- **Format**: `{project_name}-{environment}-{resource_type}`
- **Examples**:
  - VPC: `lerp-dev-vpc`
  - EKS: `lerp-dev-eks`
  - RDS: `lerp-dev-db` (without hyphens)
  - Redis: `lerp-dev-redis`
  - S3: `lerp-dev-uploads`, `lerp-dev-backups`, `lerp-dev-logs-{account_id}`

### Tagging Strategy

All resources are tagged with:

```hcl
tags = {
  Project     = var.project_name
  Environment = var.environment
  ManagedBy   = "Terraform"
  CreatedAt   = timestamp()
}
```

Additional custom tags can be added via `var.tags` variable.

### Security Features

- **VPC Isolation**: Private subnets for database and cache
- **Security Groups**: Restrictive ingress rules (EKS nodes only)
- **IAM Policies**: Least privilege access via IRSA
- **Encryption**: S3 SSE, RDS encryption, Redis encryption at rest
- **HTTPS Enforcement**: S3 bucket policies require HTTPS
- **VPC Flow Logs**: Monitor network traffic
- **Performance Insights**: RDS performance monitoring
- **Secrets Manager Ready**: Roles for secret access

### High Availability Features (Production)

- **Multi-AZ RDS**: Automatic failover
- **Redis Cluster**: Replication with automatic failover
- **Multiple NAT Gateways**: One per AZ
- **Auto-scaling Node Groups**: Scale 1-20 nodes
- **Cluster Autoscaler**: Automatic resource provisioning
- **ALB Ready**: Integrated ALB controller role

### Cost Optimization Features

- **Spot Instances Support**: Node group can use spot instances
- **Auto-scaling**: Scales down to 0 for non-critical workloads
- **S3 Lifecycle Rules**: Archive to Glacier after 30-90 days
- **Backup Retention**: Configurable backup retention periods
- **CloudWatch Alarms**: Proactive cost management

### Deployment Workflow

1. **Initialize**: `terraform init`
2. **Validate**: `terraform validate`
3. **Plan**: `terraform plan -out=tfplan`
4. **Review**: `terraform show tfplan`
5. **Apply**: `terraform apply tfplan`
6. **Configure**: `aws eks update-kubeconfig ...`
7. **Verify**: `kubectl get nodes`

### State Management

- **Backend**: S3 with DynamoDB locking
- **Encryption**: S3 bucket with versioning enabled
- **Lock**: DynamoDB table prevents concurrent modifications
- **Remote**: State is stored remotely (not in git)

### Troubleshooting

Common issues and solutions:

1. **Backend S3 bucket not found**: Create bucket and enable versioning
2. **DynamoDB lock table not found**: Create DynamoDB table manually
3. **IAM permissions denied**: Ensure AWS credentials have full admin access
4. **VPC CIDR conflicts**: Update VPC CIDR if overlaps with existing VPCs
5. **EKS cluster creation timeout**: Check CloudFormation events in AWS Console

See README.md for detailed troubleshooting guide.
