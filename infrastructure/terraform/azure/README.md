# Azure Terraform Module / Mô-đun Terraform Azure

## Overview / Tổng Quan

L-ERP Azure infrastructure as code using Terraform. Supports both AKS standard and flexible configurations for multi-cloud deployments.

Cơ sở hạ tầng L-ERP Azure dưới dạng code Terraform. Hỗ trợ cấu hình AKS tiêu chuẩn và linh hoạt cho triển khai multi-cloud.

## Architecture / Kiến Trúc

```
Azure Subscription
├── Resource Group
├── Virtual Network
│   ├── AKS Subnet
│   ├── Database Subnet
│   ├── Redis Subnet
│   ├── Network Security Groups
│   └── NAT Gateway
├── AKS Cluster
│   ├── System Node Pool
│   ├── Additional Node Pools
│   ├── Network Policy enabled
│   ├── Pod Security Policy
│   ├── Azure Monitor integration
│   └── RBAC enabled
├── Azure Database for PostgreSQL Flexible Server
│   ├── Private endpoint (VNet integration)
│   ├── Private DNS Zone
│   ├── Automated backups
│   ├── Point-in-time recovery
│   └── HA (production only)
├── Azure Cache for Redis
│   ├── Private connectivity
│   └── TLS encryption
└── Storage Account
    ├── Blob containers (uploads, backups)
    ├── Network rules
    ├── Lifecycle policies
    └── Kubernetes integration
```

## Prerequisites / Điều Kiện Tiên Quyết

1. **Azure Subscription** / **Đăng ký Azure**
   - Active Azure subscription with billing enabled / Đăng ký Azure hoạt động với billing được bật
   - Sufficient quota for AKS, PostgreSQL, and Redis / Đủ hạn ngạch cho AKS, PostgreSQL, và Redis

2. **Terraform** / **Terraform**
   - Terraform >= 1.5 / Terraform >= 1.5
   - Azure Provider >= 3.0 / Azure Provider >= 3.0

3. **Azure CLI** / **Azure CLI**
   - Azure CLI installed and authenticated / Azure CLI được cài đặt và xác thực
   - Appropriate RBAC permissions / Quyền RBAC thích hợp

4. **Authentication** / **Xác Thực**
   - Azure subscription ID / ID đăng ký Azure
   - Service principal or user account with Owner/Contributor role / Service principal hoặc tài khoản người dùng

## Quick Start / Bắt Đầu Nhanh

### 1. Setup Azure Authentication / Thiết lập Xác Thực Azure

```bash
# Login to Azure / Đăng nhập Azure
az login

# Set default subscription / Đặt đăng ký mặc định
az account set --subscription "SUBSCRIPTION_ID"

# Verify authentication / Xác minh xác thực
az account show
```

### 2. Create Storage Account for Terraform State / Tạo Storage Account cho Terraform State

```bash
# Create resource group for state / Tạo resource group cho state
az group create --name lerp-terraform-state --location "Southeast Asia"

# Create storage account / Tạo storage account
az storage account create \
  --name lerptfstate \
  --resource-group lerp-terraform-state \
  --location "Southeast Asia" \
  --sku Standard_LRS

# Create container / Tạo container
az storage container create \
  --name lerp-state \
  --account-name lerptfstate
```

### 3. Initialize Terraform / Khởi tạo Terraform

```bash
cd infrastructure/terraform/azure
terraform init
```

### 4. Configure Variables / Cấu hình Biến

```bash
# Copy example file and edit / Sao chép file ví dụ và chỉnh sửa
cp terraform.tfvars.example terraform.tfvars

# Edit with your values / Chỉnh sửa bằng các giá trị của bạn
vim terraform.tfvars
```

### 5. Plan Deployment / Lên kế hoạch Triển khai

```bash
terraform plan -out=tfplan
```

### 6. Apply Changes / Áp dụng Thay đổi

```bash
terraform apply tfplan
```

### 7. Configure kubectl / Cấu hình kubectl

```bash
# Get kubeconfig from terraform output / Lấy kubeconfig từ output
az aks get-credentials \
  --resource-group $(terraform output -raw resource_group_name) \
  --name $(terraform output -raw aks_cluster_name)

# Verify connection / Xác minh kết nối
kubectl cluster-info
```

## Configuration / Cấu Hình

### Key Variables / Các Biến Chính

| Variable | Default | Description / Mô tả |
|----------|---------|---------------------|
| `subscription_id` | - | Azure subscription ID / ID đăng ký Azure |
| `environment` | - | Deployment environment (dev/staging/prod) / Môi trường triển khai |
| `location` | Southeast Asia | Azure region / Khu vực Azure |
| `kubernetes_version` | 1.29 | Kubernetes version / Phiên bản Kubernetes |
| `postgresql_sku_name` | B_Standard_B1ms | PostgreSQL machine type / Loại máy PostgreSQL |
| `redis_sku` | Basic | Redis tier (Basic/Standard/Premium) / Tier Redis |
| `network_policy` | azure | Network policy plugin / Plugin chính sách mạng |

### Environment-Specific Defaults / Các Giá trị Mặc định Cụ thể Môi trường

#### Development / Phát triển
```hcl
aks_node_pools = {
  system = {
    vm_size     = "Standard_D2s_v3"
    min_count   = 1
    max_count   = 3
    os_disk_size_gb = 50
  }
}
postgresql_sku_name                  = "B_Standard_B1ms"
postgresql_high_availability_enabled = false
redis_sku                            = "Basic"
storage_account_replication_type     = "LRS"
```

#### Production / Sản xuất
```hcl
aks_node_pools = {
  system = {
    vm_size     = "Standard_D4s_v3"
    min_count   = 3
    max_count   = 10
  }
  compute = {
    vm_size     = "Standard_E8s_v3"
    min_count   = 2
    max_count   = 20
  }
}
postgresql_sku_name                  = "GP_Standard_D4s_v3"
postgresql_high_availability_enabled = true
redis_sku                            = "Premium"
storage_account_replication_type     = "GRS"
```

## Security Considerations / Xem Xét Bảo Mật

### Network Security / Bảo mật Mạng

- Network Security Groups (NSGs) restrict traffic between subnets / NSGs hạn chế lưu lượng giữa các subnet
- Network policies enabled on AKS cluster / Chính sách mạng được bật trên cluster AKS
- Private endpoints for database and Redis / Điểm cuối riêng cho cơ sở dữ liệu và Redis

### Private Connectivity / Kết nối Riêng tư

- PostgreSQL uses private endpoint (not internet-exposed) / PostgreSQL sử dụng private endpoint
- Redis uses private connectivity via VNet / Redis sử dụng kết nối riêng qua VNet
- All resources in delegated subnets / Tất cả tài nguyên trong subnet được ủy quyền

### Identity Management / Quản lý Danh tính

- Managed Identity for AKS control plane / Managed Identity cho AKS control plane
- Azure RBAC for role-based access control / Azure RBAC cho kiểm soát truy cập dựa trên vai trò
- Kubernetes RBAC with custom roles / RBAC Kubernetes với vai trò tùy chỉnh

### Pod Security / Bảo mật Pod

- Pod Security Policies enforced / Chính sách bảo mật Pod được thực thi
- Network policies deny all ingress by default / Chính sách mạng từ chối tất cả ingress theo mặc định
- Service accounts with minimal permissions / Tài khoản dịch vụ với quyền tối thiểu

## Deployment Guide / Hướng dẫn Triển khai

### First-Time Deployment / Triển khai Lần Đầu

1. Create storage account for state (see Quick Start) / Tạo storage account cho state
2. Update backend configuration in `main.tf` / Cập nhật cấu hình backend trong `main.tf`
3. Run `terraform init` with backend / Chạy `terraform init` với backend
4. Deploy infrastructure / Triển khai cơ sở hạ tầng

### Scaling / Mở rộng

```bash
# Scale AKS node pools / Mở rộng AKS node pools
terraform apply -var='aks_node_pools={...}'

# Scale PostgreSQL / Mở rộng PostgreSQL
terraform apply -var='postgresql_sku_name=GP_Standard_D8s_v3'

# Scale Redis / Mở rộng Redis
terraform apply -var='redis_sku=Standard'
```

### Updating / Cập nhật

```bash
# Update Kubernetes version / Cập nhật phiên bản Kubernetes
terraform apply -var='kubernetes_version=1.30'
```

## Backup and Recovery / Sao lưu và Khôi phục

### PostgreSQL Backups / Sao lưu PostgreSQL

- Automated backups enabled (7 days retention for dev, 35 for prod) / Sao lưu tự động được bật
- Point-in-time recovery enabled / Khôi phục theo thời điểm được bật
- Geo-redundant backups available for production / Sao lưu dư thừa địa lý có sẵn cho production

```bash
# View backup details / Xem chi tiết sao lưu
az postgres flexible-server backup list \
  --resource-group <rg-name> \
  --server-name <server-name>
```

### Storage Backups / Sao lưu Lưu trữ

- Lifecycle policies automatically transition old backups / Chính sách vòng đời tự động chuyển đổi các sao lưu cũ
- Deleted files can be recovered for 30 days (soft delete) / Các tệp đã xóa có thể được khôi phục trong 30 ngày

## Cost Optimization / Tối Ưu hóa Chi phí

### Development Environment / Môi trường Phát triển

- Use burstable VM sizes (B-series) / Sử dụng kích thước VM burstable
- Use Basic Redis tier / Sử dụng Basic Redis tier
- Use Standard storage replication (LRS) / Sử dụng Standard storage replication

### Reserved Instances / Các Instance Dự trữ

- Consider Azure Reserved Instances for production / Xem xét Azure Reserved Instances cho production
- Saves up to 40% on compute costs / Tiết kiệm tới 40% chi phí tính toán

### Storage Optimization / Tối ưu hóa Lưu trữ

- Use lifecycle policies to tier storage / Sử dụng chính sách vòng đời để phân tầng lưu trữ
- Archive old backups to reduce costs / Lưu trữ các sao lưu cũ để giảm chi phí

## Troubleshooting / Khắc Phục Sự Cố

### Common Issues / Các Vấn đề Thường gặp

#### 1. Authentication Failed / Xác thực thất bại

```bash
# Check current authentication / Kiểm tra xác thực hiện tại
az account show

# Re-authenticate if needed / Xác thực lại nếu cần
az login --subscription SUBSCRIPTION_ID
```

#### 2. Insufficient Quota / Không đủ Hạn ngạch

```bash
# Check current quotas / Kiểm tra hạn ngạch hiện tại
az vm list-usage --location "Southeast Asia"

# Request quota increase / Yêu cầu tăng hạn ngạch
az support ticket create --help
```

#### 3. Private Endpoint Connection Issues / Vấn đề Kết nối Private Endpoint

```bash
# Verify Private DNS Zone / Xác minh Private DNS Zone
az network private-dns zone list

# Check DNS resolution / Kiểm tra phân giải DNS
nslookup <database-fqdn>
```

#### 4. AKS Cluster Connection Issues / Vấn đề Kết nối Cluster AKS

```bash
# Get kubeconfig / Lấy kubeconfig
az aks get-credentials --resource-group <rg> --name <cluster-name>

# Verify connection / Xác minh kết nối
kubectl cluster-info
kubectl get nodes
```

## Outputs / Đầu Ra

After successful deployment, use these outputs in your applications:

Sau triển khai thành công, sử dụng các đầu ra này trong các ứng dụng của bạn:

```bash
# Get all outputs / Lấy tất cả đầu ra
terraform output

# Get specific output / Lấy đầu ra cụ thể
terraform output aks_cluster_name
terraform output postgresql_fqdn
terraform output redis_hostname
```

### Key Outputs / Các Đầu Ra Chính

- `aks_cluster_name` - AKS cluster name / Tên cluster AKS
- `aks_kube_config_raw` - Kubernetes config (sensitive) / Cấu hình Kubernetes
- `postgresql_fqdn` - PostgreSQL server FQDN / FQDN máy chủ PostgreSQL
- `postgresql_host` - PostgreSQL hostname / Tên máy chủ PostgreSQL
- `redis_hostname` - Redis hostname / Tên máy chủ Redis
- `redis_primary_access_key` - Redis access key (sensitive) / Khóa truy cập Redis
- `resource_group_name` - Resource Group name / Tên Resource Group
- `vnet_name` - Virtual Network name / Tên Virtual Network

## Maintenance / Bảo trì

### Regular Tasks / Các Nhiệm vụ Thường xuyên

- Monitor cluster health / Giám sát sức khỏe cluster
- Review backup logs / Xem xét nhật ký sao lưu
- Check storage usage / Kiểm tra mức sử dụng lưu trữ
- Update Kubernetes version / Cập nhật phiên bản Kubernetes
- Rotate credentials / Xoay vòng thông tin xác thực

### Cleanup / Dọn dẹp

To destroy all infrastructure (careful in production!):

Để hủy tất cả cơ sở hạ tầng (cẩn thận ở production!):

```bash
terraform destroy
```

## Support & Documentation / Hỗ trợ & Tài liệu

- [Azure Kubernetes Service Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Azure Database for PostgreSQL Documentation](https://learn.microsoft.com/en-us/azure/postgresql/)
- [Azure Cache for Redis Documentation](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/)
- [Azure CLI Documentation](https://learn.microsoft.com/en-us/cli/azure/)

## License / Giấy phép

This module is part of L-ERP project.
Mô-đun này là một phần của dự án L-ERP.
