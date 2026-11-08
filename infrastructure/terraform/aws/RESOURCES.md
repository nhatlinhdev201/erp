# AWS Resources Created by Terraform Configuration

## Resource Count Summary

This configuration creates approximately **50+ AWS resources** across multiple services.

## Detailed Resource List

### VPC & Networking (13 resources)

- `aws_vpc.main` - Main VPC
- `aws_internet_gateway.main` - Internet Gateway
- `aws_subnet.public[0-2]` - 3 Public Subnets
- `aws_subnet.private[0-2]` - 3 Private Subnets
- `aws_eip.nat[0-*]` - 1-3 Elastic IPs (depends on environment)
- `aws_nat_gateway.main[0-*]` - 1-3 NAT Gateways
- `aws_route_table.public` - Public Route Table
- `aws_route_table.private[0-2]` - 3 Private Route Tables
- `aws_flow_log.main` - VPC Flow Logs
- `aws_cloudwatch_log_group.vpc_flow_logs` - VPC Flow Logs Log Group
- `aws_iam_role.vpc_flow_logs` - VPC Flow Logs IAM Role
- `aws_iam_role_policy.vpc_flow_logs` - VPC Flow Logs IAM Policy

### EKS Kubernetes (12+ resources)

- `aws_eks_cluster.main` - EKS Cluster
- `aws_eks_node_group.main[general]` - General Node Group
- `aws_eks_node_group.main[compute]` - Compute Node Group
- `aws_eks_addon.coredns` - CoreDNS Add-on
- `aws_eks_addon.kube_proxy` - kube-proxy Add-on
- `aws_eks_addon.vpc_cni` - VPC CNI Add-on
- `aws_iam_openid_connect_provider.eks` - OIDC Provider
- `aws_cloudwatch_log_group.eks` - Cluster Logs
- `aws_security_group.eks_cluster` - Cluster Security Group
- `aws_security_group.eks_nodes` - Node Security Group
- `aws_iam_role.eks_service_role` - EKS Service Role
- `aws_iam_role.eks_node_role` - EKS Node Role
- `aws_iam_role.vpc_cni_role` - VPC CNI Role
- `aws_iam_role.cluster_autoscaler` - Cluster Autoscaler Role (optional)

### RDS PostgreSQL (7 resources)

- `aws_db_instance.main` - RDS Instance
- `aws_db_subnet_group.main` - RDS Subnet Group
- `aws_db_parameter_group.main` - RDS Parameter Group
- `aws_security_group.rds` - RDS Security Group
- `aws_iam_role.rds_monitoring` - RDS Enhanced Monitoring Role
- `aws_cloudwatch_metric_alarm.rds_cpu` - CPU Alarm
- `aws_cloudwatch_metric_alarm.rds_storage` - Storage Alarm
- `aws_cloudwatch_metric_alarm.rds_database_connections` - Connections Alarm

### ElastiCache Redis (8 resources)

- `aws_elasticache_replication_group.main` - Redis Cluster
- `aws_elasticache_subnet_group.main` - Redis Subnet Group
- `aws_elasticache_parameter_group.main` - Redis Parameter Group
- `aws_security_group.redis` - Redis Security Group
- `aws_sns_topic.redis_notifications` - SNS Topic for notifications
- `aws_cloudwatch_metric_alarm.redis_cpu` - CPU Alarm
- `aws_cloudwatch_metric_alarm.redis_memory` - Memory Alarm
- `aws_cloudwatch_metric_alarm.redis_evictions` - Evictions Alarm
- `aws_cloudwatch_metric_alarm.redis_replication_lag` - Replication Lag Alarm (prod only)

### S3 Storage (9 resources)

- `aws_s3_bucket.uploads` - Uploads Bucket
- `aws_s3_bucket.backups` - Backups Bucket
- `aws_s3_bucket.logs` - Logs Bucket
- `aws_s3_bucket_versioning.uploads` - Uploads Versioning
- `aws_s3_bucket_versioning.backups` - Backups Versioning
- `aws_s3_bucket_server_side_encryption_configuration.uploads` - Uploads Encryption
- `aws_s3_bucket_server_side_encryption_configuration.backups` - Backups Encryption
- `aws_s3_bucket_server_side_encryption_configuration.logs` - Logs Encryption
- `aws_s3_bucket_public_access_block.uploads` - Uploads Public Access Block
- `aws_s3_bucket_public_access_block.backups` - Backups Public Access Block
- `aws_s3_bucket_public_access_block.logs` - Logs Public Access Block
- `aws_s3_bucket_lifecycle_configuration.uploads` - Uploads Lifecycle Rules
- `aws_s3_bucket_lifecycle_configuration.backups` - Backups Lifecycle Rules
- `aws_s3_bucket_lifecycle_configuration.logs` - Logs Lifecycle Rules
- `aws_s3_bucket_logging.uploads` - Uploads Logging
- `aws_s3_bucket_logging.backups` - Backups Logging
- `aws_s3_bucket_policy.uploads` - Uploads Bucket Policy
- `aws_s3_bucket_policy.backups` - Backups Bucket Policy

### IAM Roles & Policies (18+ resources)

**S3 Access**
- `aws_iam_role.s3_access_role` - S3 Access Role
- `aws_iam_role_policy.s3_uploads_access` - S3 Uploads Access Policy
- `aws_iam_role_policy.s3_backups_access` - S3 Backups Access Policy

**RDS Proxy**
- `aws_iam_role.rds_proxy_role` - RDS Proxy Role
- `aws_iam_role_policy.rds_proxy_policy` - RDS Proxy Policy

**Backup/Restore**
- `aws_iam_role.backup_restore_role` - Backup/Restore Role
- `aws_iam_role_policy.backup_restore_policy` - Backup/Restore Policy

**Monitoring**
- `aws_iam_role.monitoring_role` - Monitoring Role
- `aws_iam_role_policy.monitoring_policy` - Monitoring Policy

**ALB Controller**
- `aws_iam_role.alb_controller_role` - ALB Controller Role
- `aws_iam_role_policy_attachment.alb_controller_policy` - ALB Controller Policy

**Secrets Manager Access**
- `aws_iam_role.secrets_access_role` - Secrets Access Role
- `aws_iam_role_policy.secrets_access_policy` - Secrets Access Policy

**Service Account Policies (EKS)**
- `aws_iam_role_policy_attachment.eks_service_policy` - EKS Service Policy
- `aws_iam_role_policy_attachment.eks_vpc_cni_policy` - VPC CNI Policy (Service)
- `aws_iam_role_policy_attachment.eks_node_policy` - EKS Node Policy
- `aws_iam_role_policy_attachment.eks_cni_policy` - EKS CNI Policy (Nodes)
- `aws_iam_role_policy_attachment.eks_registry_policy` - ECR Read-Only Policy
- `aws_iam_role_policy_attachment.eks_ssm_policy` - SSM Policy
- `aws_iam_role_policy_attachment.vpc_cni_policy` - VPC CNI Policy (IRSA)
- `aws_iam_role_policy_attachment.rds_monitoring` - RDS Monitoring Policy
- `aws_iam_role_policy_attachment.alb_controller_policy` - ALB Controller Policy

### Data Sources (3 resources)

- `data.aws_availability_zones.available` - Available AZs
- `data.aws_eks_cluster.cluster` - EKS Cluster Info
- `data.aws_eks_cluster_auth.cluster` - EKS Auth Token
- `data.aws_caller_identity.current` - AWS Account ID
- `data.tls_certificate.eks_oidc` - OIDC Certificate
- `data.aws_eks_addon_version.coredns` - CoreDNS Version
- `data.aws_eks_addon_version.kube_proxy` - kube-proxy Version
- `data.aws_eks_addon_version.vpc_cni` - VPC CNI Version

## Resource Naming Convention

All resources follow the pattern: `{project_name}-{environment}-{resource_type}`

### Examples

```
VPC:      lerp-dev-vpc
EKS:      lerp-dev-eks
RDS:      lerp-dev-db (no hyphens due to AWS restrictions)
Redis:    lerp-dev-redis
S3:       lerp-dev-uploads
          lerp-dev-backups
          lerp-dev-logs-123456789012
```

## Resource Dependencies

```
VPC (base)
├── Subnets
├── NAT Gateway
├── Internet Gateway
└── Route Tables

EKS (depends on VPC)
├── Security Groups
├── IAM Roles
├── Node Groups
└── Add-ons

RDS (depends on VPC)
├── Subnet Group
├── Security Group
└── Parameter Group

Redis (depends on VPC)
├── Subnet Group
└── Security Group

S3 (independent)
└── Bucket Policies & Lifecycle Rules

IAM (independent)
└── Trust relationships with EKS OIDC
```

## Tags Applied to All Resources

```hcl
{
  Project     = "lerp"
  Environment = "dev|staging|prod"
  ManagedBy   = "Terraform"
  CreatedAt   = "2026-03-29T..."
  // Plus any custom tags from var.tags
}
```

## AWS Service Usage

| Service | Resources | Purpose |
|---------|-----------|---------|
| **VPC** | 13 | Networking, subnets, routing |
| **EKS** | 12+ | Kubernetes cluster, node groups |
| **RDS** | 7 | PostgreSQL database, monitoring |
| **ElastiCache** | 8 | Redis cluster, caching |
| **S3** | 9+ | Object storage, backups, logs |
| **IAM** | 18+ | Identity and access management |
| **CloudWatch** | 8+ | Logs and monitoring |
| **EC2** | Implicit | Compute instances (via node groups) |

## Cost Estimation (Approximate, USD/month)

### Development Environment (US)
- EKS Cluster: $73/month
- 2 t3.medium nodes: $60/month
- RDS db.t4g.medium: $40/month
- ElastiCache cache.t4g.micro: $12/month
- S3 Storage (100GB): $2.30/month
- **Total: ~$190/month**

### Staging Environment (US)
- EKS Cluster: $73/month
- 3 t3.large nodes: $180/month
- RDS db.t4g.large: $80/month
- ElastiCache cache.t4g.small: $25/month
- S3 Storage (500GB): $11.50/month
- **Total: ~$370/month**

### Production Environment (US)
- EKS Cluster: $73/month
- 5 t3.xlarge + 3 c6i.2xlarge nodes: $1,200+/month
- RDS db.r6i.xlarge (Multi-AZ): $400/month
- ElastiCache cache.r6g.xlarge (Multi-AZ): $300+/month
- S3 Storage (2000GB): $46+/month
- Data transfer, backups, etc.: $100+/month
- **Total: ~$2,100+/month**

*Note: Actual costs depend on usage, data transfer, and AWS pricing in your region.*

## Outputs Generated

After deployment, Terraform outputs:

- EKS cluster endpoint
- RDS database endpoint
- Redis primary endpoint
- S3 bucket names
- VPC and subnet IDs
- IAM role ARNs
- Kubeconfig
- Security group IDs
- Complete deployment summary

## Cleanup

To remove all resources:

```bash
terraform destroy
```

This will delete all 50+ resources except:
- S3 logs bucket (preserved for safety)
- RDS final snapshot (if production)

## Validation

Validate resources with:

```bash
terraform validate        # Syntax validation
terraform plan           # Show changes
terraform fmt            # Format code
terraform state list     # List created resources
terraform state show     # Show specific resource
```

## Monitoring & Alarms

Pre-configured CloudWatch Alarms:

| Alarm | Threshold | Resource |
|-------|-----------|----------|
| CPU Utilization | > 80% | RDS |
| Free Storage | < 10GB | RDS |
| Connections | > 80 | RDS |
| CPU | > 75% | Redis |
| Memory | > 85% | Redis |
| Evictions | > 0 | Redis |
| Replication Lag | > 30s | Redis (prod) |

## Security Groups

Configured with minimal required access:

- **EKS Cluster**: Only from EKS Nodes
- **EKS Nodes**: Node-to-node communication
- **RDS**: Only from EKS Nodes
- **Redis**: Only from EKS Nodes
- **All outbound**: Allow to anywhere

---

**Total Resources**: 50+ AWS resources managed by Terraform
**Configuration**: Highly configurable via variables.tf
**Environment Support**: dev, staging, production
**Status**: Production-ready
