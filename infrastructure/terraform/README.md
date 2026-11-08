# L-ERP Multi-Cloud Terraform Infrastructure / Cơ sở hạ tầng Terraform Multi-Cloud L-ERP

This repository contains infrastructure-as-code for deploying L-ERP across multiple cloud providers using Terraform.

Kho lưu trữ này chứa infrastructure-as-code để triển khai L-ERP trên nhiều nhà cung cấp đám mây bằng Terraform.

## Overview / Tổng Quan

L-ERP supports deployment on multiple cloud platforms with consistent infrastructure patterns:

L-ERP hỗ trợ triển khai trên nhiều nền tảng đám mây với các mẫu cơ sở hạ tầng nhất quán:

- **AWS** - Amazon Web Services (EKS, RDS, ElastiCache, S3)
- **GCP** - Google Cloud Platform (GKE, Cloud SQL, Memorystore, GCS)
- **Azure** - Microsoft Azure (AKS, PostgreSQL Flexible Server, Azure Cache for Redis, Storage Account)

## Directory Structure / Cấu trúc Thư mục

```
terraform/
├── README.md                          # This file / File này
├── aws/
│   ├── main.tf                        # AWS provider & backend configuration
│   ├── variables.tf                   # AWS variables
│   ├── outputs.tf                     # AWS outputs
│   ├── vpc.tf, eks.tf, rds.tf, ...    # AWS resource definitions
│   ├── terraform.tfvars.example       # Example variables for AWS
│   └── README.md                      # AWS-specific guide
├── gcp/
│   ├── main.tf                        # GCP provider & backend configuration
│   ├── variables.tf                   # GCP variables
│   ├── outputs.tf                     # GCP outputs
│   ├── vpc.tf, gke.tf, cloudsql.tf, ...  # GCP resource definitions
│   ├── terraform.tfvars.example       # Example variables for GCP
│   └── README.md                      # GCP-specific guide
├── azure/
│   ├── main.tf                        # Azure provider & backend configuration
│   ├── variables.tf                   # Azure variables
│   ├── outputs.tf                     # Azure outputs
│   ├── network.tf, aks.tf, postgresql.tf, ...  # Azure resource definitions
│   ├── terraform.tfvars.example       # Example variables for Azure
│   └── README.md                      # Azure-specific guide
└── modules/
    └── tags/                          # Shared tagging module
        ├── main.tf
        └── variables.tf
```

## Multi-Cloud Strategy / Chiến lược Multi-Cloud

### Architecture Consistency / Tính nhất quán của Kiến trúc

All cloud providers implement the same logical architecture:

Tất cả các nhà cung cấp đám mây đều thực hiện cùng một kiến trúc logic:

1. **Networking** / **Mạng**
   - Virtual Network / Virtual Network / VPC / VNet
   - Private subnets for databases and cache / Các subnet riêng cho cơ sở dữ liệu và cache
   - NAT/Cloud NAT for egress traffic / NAT cho lưu lượng egress
   - Network policies and security groups / Chính sách mạng và nhóm bảo mật

2. **Kubernetes** / **Kubernetes**
   - EKS / GKE / AKS cluster / Cluster EKS / GKE / AKS
   - Multiple node pools / Nhiều nhóm nút
   - Workload Identity / Pod Identity / Managed Identity / Danh tính workload
   - Network policies enabled / Chính sách mạng được bật

3. **Database** / **Cơ sở dữ liệu**
   - PostgreSQL 16 / PostgreSQL 16 / PostgreSQL
   - Private IP connectivity / Kết nối IP riêng tư
   - Automated backups and PITR / Sao lưu tự động và PITR
   - HA for production environments / HA cho môi trường production

4. **Cache** / **Bộ nhớ cache**
   - Redis 7 / Redis 7 / Redis
   - Private connectivity / Kết nối riêng tư
   - HA and replication for production / HA và replication cho production

5. **Object Storage** / **Lưu trữ Đối tượng**
   - S3 / GCS / Azure Blob Storage / S3 / GCS / Azure Storage
   - Lifecycle policies for cost optimization / Chính sách vòng đời để tối ưu hóa chi phí
   - Versioning and backups / Quản lý phiên bản và sao lưu

### Variable Naming Convention / Quy ước Đặt tên Biến

Consistent variable names across all clouds:

Tên biến nhất quán trên tất cả các đám mây:

| Concept / Khái niệm | AWS | GCP | Azure |
|---|---|---|---|
| Project Name | `project_name` | `project_name` | `project_name` |
| Environment | `environment` | `environment` | `environment` |
| Region | `aws_region` | `region` | `location` |
| K8s Version | `kubernetes_version` | `kubernetes_version` | `kubernetes_version` |
| DB Tier | `rds_instance_class` | `cloudsql_tier` | `postgresql_sku_name` |
| DB Engine | `rds_engine_version` | `cloudsql_database_version` | `postgresql_version` |
| Cache Tier | `redis_node_type` | `memorystore_tier` | `redis_sku` |
| Storage | `s3_*_bucket` | `gcs_*_bucket` | `storage_account_*` |

## Getting Started / Bắt Đầu

### Prerequisites / Điều Kiện Tiên Quyết

1. **Terraform** >= 1.5 / Terraform >= 1.5
2. **Cloud CLI tools** / **Công cụ CLI đám mây**
   - `aws` CLI for AWS deployments / CLI AWS cho triển khai AWS
   - `gcloud` CLI for GCP deployments / CLI GCP cho triển khai GCP
   - `az` CLI for Azure deployments / CLI Azure cho triển khai Azure
3. **kubectl** - Kubernetes command-line tool / Công cụ dòng lệnh Kubernetes

### Choose Your Cloud Provider / Chọn Nhà cung cấp Đám mây của bạn

#### AWS Deployment / Triển khai AWS
```bash
cd aws
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars
terraform init
terraform plan
terraform apply
```

See [aws/README.md](aws/README.md) for detailed instructions.

Xem [aws/README.md](aws/README.md) để biết hướng dẫn chi tiết.

#### GCP Deployment / Triển khai GCP
```bash
cd gcp
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars
terraform init
terraform plan
terraform apply
```

See [gcp/README.md](gcp/README.md) for detailed instructions.

Xem [gcp/README.md](gcp/README.md) để biết hướng dẫn chi tiết.

#### Azure Deployment / Triển khai Azure
```bash
cd azure
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars
terraform init
terraform plan
terraform apply
```

See [azure/README.md](azure/README.md) for detailed instructions.

Xem [azure/README.md](azure/README.md) để biết hướng dẫn chi tiết.

## Common Operations / Các Hoạt động Chung

### Plan Infrastructure Changes / Lên kế hoạch Thay đổi Cơ sở hạ tầng

```bash
cd <cloud-provider>
terraform plan -out=tfplan
```

### Apply Infrastructure Changes / Áp dụng Thay đổi Cơ sở hạ tầng

```bash
terraform apply tfplan
```

### View Infrastructure Status / Xem Trạng thái Cơ sở hạ tầng

```bash
terraform show
terraform state list
```

### Get Output Values / Nhận Giá trị Đầu ra

```bash
terraform output
terraform output -json > output.json
```

### Destroy Infrastructure / Hủy Cơ sở hạ tầng

```bash
# WARNING: This will delete all resources!
# CẢNH BÁO: Điều này sẽ xóa tất cả tài nguyên!
terraform destroy
```

## Environment-Specific Configuration / Cấu hình Cụ thể Môi trường

### Development / Phát triển

- Minimal compute resources / Tài nguyên tính toán tối thiểu
- Single zone deployments / Triển khai một zone
- Automated backups with 7-day retention / Sao lưu tự động với giữ lại 7 ngày
- Cost optimization enabled / Tối ưu hóa chi phí được bật

### Staging / Chuẩn bị

- Medium compute resources / Tài nguyên tính toán trung bình
- Multi-zone deployments / Triển khai đa zone
- Automated backups with 14-day retention / Sao lưu tự động với giữ lại 14 ngày
- Monitoring and alerting enabled / Giám sát và cảnh báo được bật

### Production / Sản xuất

- Full compute resources / Tài nguyên tính toán đầy đủ
- Multi-region (where supported) / Đa region (nếu được hỗ trợ)
- HA configurations / Cấu hình HA
- Automated backups with 30+ day retention / Sao lưu tự động với giữ lại 30+ ngày
- Enhanced security and compliance / Bảo mật và tuân thủ nâng cao
- Geo-redundant backups / Sao lưu dự phòng địa lý

## State Management / Quản lý Trạng thái

Each cloud provider uses native backend storage:

Mỗi nhà cung cấp đám mây sử dụng lưu trữ backend gốc:

- **AWS**: S3 + DynamoDB for state locking / S3 + DynamoDB để khóa state
- **GCP**: GCS (Google Cloud Storage) / GCS (Google Cloud Storage)
- **Azure**: Azure Storage Account / Tài khoản Azure Storage

### Configure Remote State / Cấu hình Remote State

1. Create storage bucket/account / Tạo bucket/tài khoản lưu trữ
2. Update backend configuration in `main.tf` / Cập nhật cấu hình backend trong `main.tf`
3. Run `terraform init` / Chạy `terraform init`

## Security Best Practices / Các Thực tiễn Bảo mật Tốt nhất

### Secrets Management / Quản lý Bí mật

- Use cloud-native secret managers / Sử dụng trình quản lý bí mật gốc của đám mây
  - AWS: AWS Secrets Manager / Trình quản lý Bí mật AWS
  - GCP: Google Secret Manager / Trình quản lý Bí mật Google
  - Azure: Azure Key Vault / Azure Key Vault
- Never commit secrets to git / Không bao giờ commit bí mật vào git
- Use Workload Identity / Pod Identity / Managed Identity / Sử dụng Danh tính Workload

### Network Security / Bảo mật Mạng

- Private subnets for databases / Các subnet riêng cho cơ sở dữ liệu
- Network policies and security groups / Chính sách mạng và nhóm bảo mật
- Encryption in transit and at rest / Mã hóa trong quá trình truyền và khi lưu trữ
- VPC/VNet segregation / Phân chia VPC/VNet

### Access Control / Kiểm soát Truy cập

- RBAC for Kubernetes / RBAC cho Kubernetes
- IAM policies for cloud resources / Chính sách IAM cho tài nguyên đám mây
- Service accounts with minimal permissions / Tài khoản dịch vụ với quyền tối thiểu

## Monitoring and Logging / Giám sát và Ghi nhật ký

### Cloud-Native Monitoring / Giám sát Gốc Đám mây

- AWS CloudWatch / AWS CloudWatch
- GCP Cloud Monitoring (Stackdriver) / GCP Cloud Monitoring
- Azure Monitor / Azure Monitor

### Kubernetes Monitoring / Giám sát Kubernetes

- EKS/GKE/AKS Container Insights / Container Insights
- Prometheus + Grafana (optional) / Prometheus + Grafana (tuỳ chọn)
- Application-level monitoring / Giám sát cấp ứng dụng

## Cost Optimization / Tối ưu hóa Chi phí

### Development

```hcl
# Use smallest instance types / Sử dụng loại instance nhỏ nhất
# Disable Multi-AZ / Vô hiệu hóa Multi-AZ
# Use spot/preemptible instances / Sử dụng instance spot/preemptible
# Minimal storage retention / Giữ lại lưu trữ tối thiểu
```

### Production

```hcl
# Reserved Instances / Các Instance Dự trữ
# Multi-AZ deployments / Triển khai Multi-AZ
# Lifecycle policies for old data / Chính sách vòng đời cho dữ liệu cũ
# Automated scaling / Tự động co giãn
```

## Upgrading / Nâng cấp

### Terraform Upgrade / Nâng cấp Terraform

```bash
# Check for newer provider versions / Kiểm tra phiên bản provider mới hơn
terraform init -upgrade

# Review changes / Xem xét thay đổi
terraform plan

# Apply upgrades / Áp dụng nâng cấp
terraform apply
```

### Kubernetes Upgrade / Nâng cấp Kubernetes

```bash
# Update kubernetes_version variable / Cập nhật biến kubernetes_version
terraform apply -var='kubernetes_version=1.30'

# Monitor upgrade progress / Giám sát tiến độ nâng cấp
kubectl get nodes
```

## Troubleshooting / Khắc Phục Sự Cố

### Authentication Issues / Vấn đề Xác thực

```bash
# Verify cloud credentials / Xác minh thông tin xác thực đám mây
aws sts get-caller-identity        # AWS
gcloud auth list                   # GCP
az account show                    # Azure
```

### Terraform State Issues / Vấn đề Trạng thái Terraform

```bash
# Backup current state / Sao lưu trạng thái hiện tại
terraform state pull > terraform.tfstate.backup

# Remove stale resources / Xóa tài nguyên cũ
terraform state rm <resource>
```

### Cluster Connectivity Issues / Vấn đề Kết nối Cluster

```bash
# Get kubeconfig / Lấy kubeconfig
# AWS: aws eks update-kubeconfig --name <cluster-name> --region <region>
# GCP: gcloud container clusters get-credentials <cluster-name> --region <region>
# Azure: az aks get-credentials --name <cluster-name> --resource-group <rg>

# Verify connectivity / Xác minh kết nối
kubectl cluster-info
kubectl get nodes
```

## Useful Resources / Tài Nguyên Hữu Ích

### AWS
- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/)

### GCP
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/)

### Azure
- [AKS Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/)

### Terraform
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices.html)
- [Terraform Registry](https://registry.terraform.io/)

## Contributing / Đóng góp

### Terraform Formatting / Định dạng Terraform

```bash
# Format all Terraform files / Định dạng tất cả các tệp Terraform
terraform fmt -recursive

# Validate configuration / Xác thực cấu hình
terraform validate
```

### Documentation / Tài liệu

- Keep README.md files updated / Cập nhật các tệp README.md
- Document non-obvious decisions / Tài liệu các quyết định không rõ ràng
- Include examples in comments / Bao gồm ví dụ trong bình luận

## License / Giấy phép

This Terraform configuration is part of the L-ERP project.

Cấu hình Terraform này là một phần của dự án L-ERP.

## Support / Hỗ trợ

For issues and questions:

Để biết vấn đề và câu hỏi:

1. Check relevant cloud provider README / Kiểm tra README của nhà cung cấp đám mây liên quan
2. Review Terraform provider documentation / Xem lại tài liệu provider Terraform
3. Check cloud provider documentation / Kiểm tra tài liệu nhà cung cấp đám mây
4. Open an issue in the main repository / Mở một vấn đề trong kho lưu trữ chính
