# L-ERP Terraform AWS Infrastructure

## English

### Overview

This Terraform configuration creates a production-ready AWS infrastructure for L-ERP deployment with:

- **VPC & Networking**: Multi-AZ setup with public and private subnets, NAT Gateway, and VPC Flow Logs
- **EKS Kubernetes**: Managed Kubernetes cluster with auto-scaling node groups and OIDC provider for IRSA
- **RDS PostgreSQL**: Multi-AZ database with automated backups, Performance Insights, and monitoring
- **ElastiCache Redis**: Cluster with replication and automatic failover for high availability
- **S3 Storage**: Buckets for file uploads, backups, and access logs with lifecycle policies
- **IAM Roles**: Pre-configured service accounts for pods, monitoring, backups, and more

### Prerequisites

Before deploying, ensure you have:

1. **AWS Account**: Active AWS account with appropriate permissions
2. **Terraform**: Version 1.5 or higher
3. **AWS CLI**: Configured with credentials for your AWS account
4. **kubectl**: For managing the Kubernetes cluster
5. **Helm**: For deploying charts (optional)

### Quick Start

#### Step 1: Prepare Configuration

```bash
# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit configuration with your values
vim terraform.tfvars
```

#### Step 2: Create S3 Backend (First Time Only)

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket lerp-terraform-state \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket lerp-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name lerp-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

#### Step 3: Initialize Terraform

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan -out=tfplan
```

#### Step 4: Apply Configuration

```bash
# Review the plan first!
terraform show tfplan

# Apply the configuration
terraform apply tfplan
```

#### Step 5: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region ap-southeast-1 \
  --name lerp-dev-eks

# Verify cluster access
kubectl get nodes
```

### Configuration Variables

Key variables in `terraform.tfvars`:

```hcl
# Project and Environment
project_name = "lerp"
environment  = "dev"  # dev, staging, or prod
aws_region   = "ap-southeast-1"

# Network
vpc_cidr            = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# EKS
kubernetes_version = "1.29"
eks_node_groups = {
  general = {
    instance_types = ["t3.medium"]
    min_size       = 1
    max_size       = 5
    desired_size   = 2
    disk_size      = 50
  }
}

# RDS
rds_instance_class = "db.t4g.medium"
rds_allocated_storage = 50

# Redis
redis_node_type = "cache.t4g.micro"
redis_engine_version = "7.0"

# S3
s3_versioning_enabled = true
```

See `variables.tf` for complete list and descriptions.

### Outputs

After deployment, get important endpoints:

```bash
# Get all outputs
terraform output

# Get specific outputs
terraform output eks_cluster_endpoint
terraform output rds_endpoint
terraform output redis_endpoint

# Get kubeconfig
terraform output kubeconfig_command
```

### Deploying Applications

#### 1. Configure Database Connection

```bash
# Get RDS endpoint and create secret
RDS_ENDPOINT=$(terraform output -raw rds_address)
RDS_USERNAME=$(terraform output -raw rds_username)

kubectl create secret generic rds-credentials \
  --from-literal=host=$RDS_ENDPOINT \
  --from-literal=port=5432 \
  --from-literal=username=$RDS_USERNAME \
  --from-literal=password=$PASSWORD \
  --namespace lerp
```

#### 2. Deploy L-ERP Helm Chart

```bash
# Add Helm repository (if applicable)
helm repo add lerp https://charts.lerp.io

# Deploy the chart
helm install lerp lerp/lerp \
  --namespace lerp \
  --create-namespace \
  --values values.yaml
```

#### 3. Verify Deployment

```bash
# Check pods
kubectl get pods -n lerp

# Check services
kubectl get svc -n lerp

# Check logs
kubectl logs -n lerp deployment/lerp
```

### Monitoring and Logging

The infrastructure includes:

- **CloudWatch Logs**: Cluster logs, RDS logs
- **CloudWatch Alarms**: CPU, memory, storage alerts
- **VPC Flow Logs**: Network traffic analysis
- **Performance Insights**: RDS performance metrics

View logs:

```bash
# EKS logs
aws logs tail /aws/eks/lerp-dev-eks/cluster --follow

# RDS logs
aws logs tail /aws/rds/instance/lerp-dev-db/postgresql --follow

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=lerp-dev-db \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

### Troubleshooting

#### EKS Cluster Issues

```bash
# Check cluster status
aws eks describe-cluster --name lerp-dev-eks

# Check node groups
aws eks list-nodegroups --cluster-name lerp-dev-eks

# View cluster logs
aws logs tail /aws/eks/lerp-dev-eks/cluster --follow
```

#### Database Connection Issues

```bash
# Check security groups
aws ec2 describe-security-groups --filters Name=group-name,Values=lerp-dev-db-*

# Check subnet connectivity
aws ec2 describe-network-interfaces --filters Name=subnet-id,Values=subnet-xxxxx

# Test connection from pod
kubectl run -it --rm debug --image=ubuntu:latest --restart=Never -- \
  bash -c "apt-get update && apt-get install -y postgresql-client && \
  psql -h $RDS_ENDPOINT -U $RDS_USERNAME -d lerp"
```

#### Redis Connection Issues

```bash
# Check Redis replication group
aws elasticache describe-replication-groups --replication-group-id lerp-dev-redis

# Check security groups
aws ec2 describe-security-groups --filters Name=group-name,Values=lerp-dev-redis-*
```

### Managing Infrastructure

#### Update Node Group Configuration

```bash
# Update desired capacity
terraform apply -var 'eks_node_groups={general={...desired_size=3...}}'
```

#### Scale RDS Storage

```bash
# Update allocated storage
terraform apply -var 'rds_allocated_storage=100'
```

#### Enable Performance Insights

```bash
# Update RDS configuration
terraform apply -var 'rds_performance_insights_enabled=true'
```

### Cleanup

To destroy the infrastructure:

```bash
# Plan destruction
terraform plan -destroy

# Destroy resources (Be careful!)
terraform destroy

# Note: RDS final snapshot will be created if environment is prod
```

---

## Tiếng Việt

### Tổng Quan

Cấu hình Terraform này tạo ra cơ sở hạ tầng AWS sẵn sàng cho sản xuất cho L-ERP với:

- **VPC & Mạng**: Thiết lập Multi-AZ với public/private subnets, NAT Gateway, và VPC Flow Logs
- **EKS Kubernetes**: Cụm Kubernetes được quản lý với auto-scaling node groups và OIDC provider cho IRSA
- **RDS PostgreSQL**: Cơ sở dữ liệu Multi-AZ với sao lưu tự động, Performance Insights, và giám sát
- **ElastiCache Redis**: Cụm với replication và automatic failover cho high availability
- **S3 Storage**: Các bucket cho uploads, backups, và access logs với lifecycle policies
- **IAM Roles**: Các service account được cấu hình sẵn cho pods, monitoring, backups, v.v.

### Yêu Cầu Tiên Quyết

Trước khi triển khai, đảm bảo bạn có:

1. **Tài khoản AWS**: Tài khoản AWS hoạt động với các quyền thích hợp
2. **Terraform**: Phiên bản 1.5 hoặc cao hơn
3. **AWS CLI**: Được cấu hình với thông tin xác thực cho tài khoản AWS của bạn
4. **kubectl**: Để quản lý cụm Kubernetes
5. **Helm**: Để triển khai các charts (tùy chọn)

### Bắt Đầu Nhanh

#### Bước 1: Chuẩn Bị Cấu Hình

```bash
# Sao chép cấu hình ví dụ
cp terraform.tfvars.example terraform.tfvars

# Chỉnh sửa cấu hình với các giá trị của bạn
vim terraform.tfvars
```

#### Bước 2: Tạo S3 Backend (Lần Đầu Tiên)

```bash
# Tạo S3 bucket cho Terraform state
aws s3api create-bucket \
  --bucket lerp-terraform-state \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1

# Bật versioning
aws s3api put-bucket-versioning \
  --bucket lerp-terraform-state \
  --versioning-configuration Status=Enabled

# Tạo bảng DynamoDB cho state locking
aws dynamodb create-table \
  --table-name lerp-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

#### Bước 3: Khởi Tạo Terraform

```bash
# Khởi tạo Terraform
terraform init

# Xác thực cấu hình
terraform validate

# Lên kế hoạch triển khai
terraform plan -out=tfplan
```

#### Bước 4: Áp Dụng Cấu Hình

```bash
# Kiểm tra kế hoạch trước!
terraform show tfplan

# Áp dụng cấu hình
terraform apply tfplan
```

#### Bước 5: Cấu Hình kubectl

```bash
# Cập nhật kubeconfig
aws eks update-kubeconfig \
  --region ap-southeast-1 \
  --name lerp-dev-eks

# Kiểm tra quyền truy cập cụm
kubectl get nodes
```

### Biến Cấu Hình

Các biến chính trong `terraform.tfvars`:

```hcl
# Project và Environment
project_name = "lerp"
environment  = "dev"  # dev, staging, hoặc prod
aws_region   = "ap-southeast-1"

# Mạng
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# EKS
kubernetes_version = "1.29"
eks_node_groups = {
  general = {
    instance_types = ["t3.medium"]
    min_size       = 1
    max_size       = 5
    desired_size   = 2
    disk_size      = 50
  }
}

# RDS
rds_instance_class     = "db.t4g.medium"
rds_allocated_storage  = 50

# Redis
redis_node_type       = "cache.t4g.micro"
redis_engine_version  = "7.0"

# S3
s3_versioning_enabled = true
```

Xem `variables.tf` để có danh sách đầy đủ và mô tả.

### Kết Quả Đầu Ra

Sau khi triển khai, lấy các endpoint quan trọng:

```bash
# Lấy tất cả kết quả
terraform output

# Lấy kết quả cụ thể
terraform output eks_cluster_endpoint
terraform output rds_endpoint
terraform output redis_endpoint

# Lấy kubeconfig
terraform output kubeconfig_command
```

### Triển Khai Ứng Dụng

#### 1. Cấu Hình Kết Nối Cơ Sở Dữ Liệu

```bash
# Lấy endpoint RDS và tạo secret
RDS_ENDPOINT=$(terraform output -raw rds_address)
RDS_USERNAME=$(terraform output -raw rds_username)

kubectl create secret generic rds-credentials \
  --from-literal=host=$RDS_ENDPOINT \
  --from-literal=port=5432 \
  --from-literal=username=$RDS_USERNAME \
  --from-literal=password=$PASSWORD \
  --namespace lerp
```

#### 2. Triển Khai L-ERP Helm Chart

```bash
# Thêm Helm repository (nếu có)
helm repo add lerp https://charts.lerp.io

# Triển khai chart
helm install lerp lerp/lerp \
  --namespace lerp \
  --create-namespace \
  --values values.yaml
```

#### 3. Xác Thực Triển Khai

```bash
# Kiểm tra pods
kubectl get pods -n lerp

# Kiểm tra services
kubectl get svc -n lerp

# Kiểm tra logs
kubectl logs -n lerp deployment/lerp
```

### Giám Sát và Ghi Log

Cơ sở hạ tầng bao gồm:

- **CloudWatch Logs**: Logs cụm, logs RDS
- **CloudWatch Alarms**: Cảnh báo CPU, bộ nhớ, lưu trữ
- **VPC Flow Logs**: Phân tích lưu lượng mạng
- **Performance Insights**: Các chỉ số hiệu suất RDS

Xem logs:

```bash
# Logs EKS
aws logs tail /aws/eks/lerp-dev-eks/cluster --follow

# Logs RDS
aws logs tail /aws/rds/instance/lerp-dev-db/postgresql --follow

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=lerp-dev-db \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

### Khắc Phục Sự Cố

#### Vấn Đề Cụm EKS

```bash
# Kiểm tra trạng thái cụm
aws eks describe-cluster --name lerp-dev-eks

# Kiểm tra node groups
aws eks list-nodegroups --cluster-name lerp-dev-eks

# Xem logs cụm
aws logs tail /aws/eks/lerp-dev-eks/cluster --follow
```

#### Vấn Đề Kết Nối Cơ Sở Dữ Liệu

```bash
# Kiểm tra security groups
aws ec2 describe-security-groups --filters Name=group-name,Values=lerp-dev-db-*

# Kiểm tra kết nối subnet
aws ec2 describe-network-interfaces --filters Name=subnet-id,Values=subnet-xxxxx

# Kiểm tra kết nối từ pod
kubectl run -it --rm debug --image=ubuntu:latest --restart=Never -- \
  bash -c "apt-get update && apt-get install -y postgresql-client && \
  psql -h $RDS_ENDPOINT -U $RDS_USERNAME -d lerp"
```

#### Vấn Đề Kết Nối Redis

```bash
# Kiểm tra Redis replication group
aws elasticache describe-replication-groups --replication-group-id lerp-dev-redis

# Kiểm tra security groups
aws ec2 describe-security-groups --filters Name=group-name,Values=lerp-dev-redis-*
```

### Quản Lý Cơ Sở Hạ Tầng

#### Cập Nhật Cấu Hình Node Group

```bash
# Cập nhật desired capacity
terraform apply -var 'eks_node_groups={general={...desired_size=3...}}'
```

#### Mở Rộng Lưu Trữ RDS

```bash
# Cập nhật allocated storage
terraform apply -var 'rds_allocated_storage=100'
```

#### Bật Performance Insights

```bash
# Cập nhật cấu hình RDS
terraform apply -var 'rds_performance_insights_enabled=true'
```

### Dọn Dẹp

Để hủy cơ sở hạ tầng:

```bash
# Lên kế hoạch hủy
terraform plan -destroy

# Hủy tài nguyên (Hãy cẩn thận!)
terraform destroy

# Ghi chú: RDS final snapshot sẽ được tạo nếu environment là prod
```

### Hỗ Trợ

Để được hỗ trợ, vui lòng:

1. Kiểm tra logs: `terraform apply` output
2. Kiểm tra AWS Console cho các warnings/errors
3. Kiểm tra Terraform state: `terraform state show`
4. Liên hệ với platform team

---

## License

This Terraform configuration is part of L-ERP project and follows the project's license.
