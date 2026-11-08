# GCP Terraform Module / Mô-đun Terraform GCP

## Overview / Tổng Quan

L-ERP GCP infrastructure as code using Terraform. Supports both standard GKE and GKE Autopilot cluster modes.

Cơ sở hạ tầng L-ERP GCP dưới dạng code Terraform. Hỗ trợ cả hai chế độ cluster GKE tiêu chuẩn và GKE Autopilot.

## Architecture / Kiến Trúc

```
GCP Project
├── VPC Network
│   ├── Primary Subnet (GKE Nodes)
│   ├── Secondary Subnets (optional)
│   ├── Cloud NAT for egress
│   └── Cloud Router
├── GKE Cluster
│   ├── GKE Control Plane
│   ├── Node Pools (Standard mode)
│   ├── Workload Identity enabled
│   └── Network Policy enabled
├── Cloud SQL (PostgreSQL 16)
│   ├── Private IP (VPC peering)
│   ├── Automated backups
│   └── HA (production only)
├── Memorystore Redis
│   ├── Private Service Access
│   └── Auth enabled
└── Cloud Storage
    ├── Uploads bucket
    ├── Backups bucket
    └── Lifecycle policies
```

## Prerequisites / Điều Kiện Tiên Quyết

1. **GCP Project** / **Dự án GCP**
   - Active GCP project with billing enabled / Dự án GCP hoạt động với billing được bật
   - Required APIs enabled / Các API cần thiết được bật

2. **Terraform** / **Terraform**
   - Terraform >= 1.5 / Terraform >= 1.5
   - Google Provider >= 5.0 / Google Provider >= 5.0

3. **Authentication** / **Xác Thực**
   - GCP service account key with appropriate permissions / Khóa tài khoản dịch vụ GCP với quyền thích hợp
   - Or use Application Default Credentials / Hoặc sử dụng Application Default Credentials

4. **GCP APIs to Enable** / **Các API GCP cần bật**
   ```bash
   gcloud services enable \
     compute.googleapis.com \
     container.googleapis.com \
     sqladmin.googleapis.com \
     redis.googleapis.com \
     storage.googleapis.com \
     servicenetworking.googleapis.com \
     iam.googleapis.com \
     cloudkms.googleapis.com
   ```

## Quick Start / Bắt Đầu Nhanh

### 1. Setup GCP Authentication / Thiết lập Xác Thực GCP

```bash
# Option 1: Using Application Default Credentials / Sử dụng Application Default Credentials
gcloud auth application-default login

# Option 2: Using service account key / Sử dụng khóa tài khoản dịch vụ
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 2. Initialize Terraform / Khởi tạo Terraform

```bash
cd infrastructure/terraform/gcp
terraform init
```

### 3. Configure Variables / Cấu hình Biến

```bash
# Copy example file and edit / Sao chép file ví dụ và chỉnh sửa
cp terraform.tfvars.example terraform.tfvars

# Edit with your values / Chỉnh sửa bằng các giá trị của bạn
vim terraform.tfvars
```

### 4. Plan Deployment / Lên kế hoạch Triển khai

```bash
terraform plan -out=tfplan
```

### 5. Apply Changes / Áp dụng Thay đổi

```bash
terraform apply tfplan
```

### 6. Get Kubeconfig / Lấy Kubeconfig

```bash
gcloud container clusters get-credentials \
  $(terraform output -raw gke_cluster_name) \
  --region $(terraform output -raw gke_region)
```

## Configuration / Cấu Hình

### Key Variables / Các Biến Chính

| Variable | Default | Description / Mô tả |
|----------|---------|---------------------|
| `project_id` | - | GCP Project ID / ID dự án GCP |
| `environment` | - | Deployment environment (dev/staging/prod) / Môi trường triển khai |
| `region` | asia-southeast1 | GCP Region / Khu vực GCP |
| `gke_mode` | standard | GKE cluster mode (autopilot/standard) / Chế độ cluster GKE |
| `kubernetes_version` | 1.29 | Kubernetes version / Phiên bản Kubernetes |
| `cloudsql_tier` | db-f1-micro | Cloud SQL machine type / Loại máy Cloud SQL |
| `memorystore_tier` | BASIC | Redis tier (BASIC/STANDARD) / Tier Redis |

### Environment-Specific Defaults / Các Giá trị Mặc định Cụ thể Môi trường

#### Development / Phát triển
```hcl
gke_node_pools = {
  default = {
    machine_type = "n2-standard-2"
    min_size     = 1
    max_size     = 3
    disk_size_gb = 50
  }
}
cloudsql_tier           = "db-f1-micro"
cloudsql_availability_type = "ZONAL"
memorystore_tier        = "BASIC"
memorystore_size_gb     = 5
```

#### Production / Sản xuất
```hcl
gke_node_pools = {
  general = {
    machine_type = "n2-standard-4"
    min_size     = 3
    max_size     = 10
  }
  compute = {
    machine_type = "n2-highmem-8"
    min_size     = 2
    max_size     = 20
  }
}
cloudsql_tier           = "db-custom-2-8192"
cloudsql_availability_type = "REGIONAL"
memorystore_tier        = "STANDARD"
memorystore_size_gb     = 50
```

## Security Considerations / Xem Xét Bảo Mật

### Workload Identity / Danh tính Workload

- All GKE pods use Workload Identity instead of service account keys / Tất cả GKE pod sử dụng Workload Identity thay vì khóa tài khoản dịch vụ
- Each workload has its own service account with minimal permissions / Mỗi workload có tài khoản dịch vụ riêng với quyền tối thiểu

### Private IP / IP Riêng tư

- Cloud SQL uses private IP with VPC peering / Cloud SQL sử dụng IP riêng với VPC peering
- Memorystore Redis uses Private Service Access / Memorystore Redis sử dụng Private Service Access
- All communication is encrypted / Tất cả liên lạc được mã hóa

### Network Policy / Chính sách Mạng

- Network Policy enabled on GKE cluster / Chính sách Mạng được bật trên cluster GKE
- Configure firewall rules in `vpc.tf` / Cấu hình quy tắc tường lửa trong `vpc.tf`

### Secret Management / Quản lý Bí mật

- Use Google Secret Manager for sensitive data / Sử dụng Google Secret Manager cho dữ liệu nhạy cảm
- Database passwords auto-generated if not provided / Mật khẩu cơ sở dữ liệu được tự động tạo nếu không được cung cấp

## Deployment Guide / Hướng dẫn Triển khai

### First-Time Deployment / Triển khai Lần Đầu

1. Create GCS bucket for Terraform state / Tạo bucket GCS cho trạng thái Terraform
2. Update backend configuration in `main.tf` / Cập nhật cấu hình backend trong `main.tf`
3. Run `terraform init` with backend / Chạy `terraform init` với backend
4. Deploy infrastructure / Triển khai cơ sở hạ tầng

### Scaling / Mở rộng

```bash
# Update node pool size / Cập nhật kích thước node pool
terraform apply -var='gke_node_pools={...}'

# Scale Cloud SQL / Mở rộng Cloud SQL
terraform apply -var='cloudsql_tier=db-custom-4-16384'

# Increase Redis size / Tăng kích thước Redis
terraform apply -var='memorystore_size_gb=25'
```

### Disaster Recovery / Khôi phục sau Thảm họa

```bash
# Cloud SQL automated backups are enabled / Sao lưu tự động Cloud SQL được bật
# Restore from backup: / Khôi phục từ sao lưu:
gcloud sql backups describe BACKUP_ID --instance=INSTANCE_NAME

# Point-in-time recovery is enabled / Khôi phục theo thời điểm được bật
gcloud sql backups restore BACKUP_ID --backup-instance=INSTANCE_NAME
```

## Cost Optimization / Tối Ưu hóa Chi phí

### Development Environment / Môi trường Phát triển

- Use preemptible nodes / Sử dụng nút có thể bị chiếm quyền
- Use minimal machine types / Sử dụng loại máy tối thiểu
- Enable cluster autoscaling / Bật tự động co giãn cluster

```bash
# Add to gke_node_pools / Thêm vào gke_node_pools
node_config {
  preemptible = true
}
```

### Storage Cost / Chi phí Lưu trữ

- Use lifecycle policies to transition old data to cheaper storage classes / Sử dụng chính sách vòng đời để chuyển dữ liệu cũ sang các lớp lưu trữ rẻ hơn
- Archive backups after 30 days / Lưu trữ sao lưu sau 30 ngày
- Delete old uploads after 1 year / Xóa tải lên cũ sau 1 năm

### Database Cost / Chi phí Cơ sở dữ liệu

- Use shared-core instances for dev / Sử dụng shared-core instances cho dev
- Enable automated backups with retention policies / Bật sao lưu tự động với chính sách giữ lại

## Troubleshooting / Khắc Phục Sự Cố

### Common Issues / Các Vấn đề Thường gặp

#### 1. Authentication Failed / Xác thực thất bại

```bash
# Check credentials / Kiểm tra thông tin xác thực
gcloud auth list

# Set credentials / Đặt thông tin xác thực
gcloud auth application-default login
```

#### 2. API Not Enabled / API không được bật

```bash
# Enable required APIs / Bật các API cần thiết
gcloud services enable compute.googleapis.com \
  container.googleapis.com sqladmin.googleapis.com
```

#### 3. VPC Peering Failed / VPC Peering thất bại

```bash
# Check VPC peering status / Kiểm tra trạng thái VPC Peering
gcloud compute networks peerings list
```

#### 4. GKE Cluster Unreachable / Cluster GKE không thể truy cập được

```bash
# Get cluster credentials / Lấy thông tin xác thực cluster
gcloud container clusters get-credentials CLUSTER_NAME --region REGION

# Verify connectivity / Xác minh kết nối
kubectl cluster-info
```

## Outputs / Đầu Ra

After successful deployment, use these outputs in your applications:

Sau triển khai thành công, sử dụng các đầu ra này trong các ứng dụng của bạn:

```bash
# Get all outputs / Lấy tất cả đầu ra
terraform output

# Get specific output / Lấy đầu ra cụ thể
terraform output gke_cluster_endpoint
terraform output cloudsql_private_ip_address
terraform output memorystore_redis_host
```

### Key Outputs / Các Đầu Ra Chính

- `gke_cluster_name` - GKE cluster name / Tên cluster GKE
- `gke_cluster_endpoint` - Kubernetes API endpoint / Điểm cuối API Kubernetes
- `cloudsql_instance_connection_name` - Cloud SQL connection string / Chuỗi kết nối Cloud SQL
- `cloudsql_private_ip_address` - Private IP for in-VPC connections / IP riêng cho kết nối trong VPC
- `memorystore_redis_host` - Redis host for application / Redis host cho ứng dụng
- `memorystore_redis_port` - Redis port / Port Redis
- `gcs_uploads_bucket_name` - Uploads bucket name / Tên bucket uploads
- `gcs_backups_bucket_name` - Backups bucket name / Tên bucket sao lưu

## Maintenance / Bảo trì

### Regular Tasks / Các Nhiệm vụ Thường xuyên

- Monitor cluster autoscaling / Giám sát tự động co giãn cluster
- Review Cloud SQL backups / Xem xét sao lưu Cloud SQL
- Check Redis memory usage / Kiểm tra mức sử dụng bộ nhớ Redis
- Verify storage lifecycle policies are working / Xác minh chính sách vòng đời lưu trữ đang hoạt động
- Update Kubernetes versions / Cập nhật các phiên bản Kubernetes

### Cleanup / Dọn dẹp

To destroy all infrastructure (careful in production!):

Để hủy tất cả cơ sở hạ tầng (cẩn thận ở production!):

```bash
terraform destroy
```

Note: Some resources like Cloud SQL snapshots may need manual cleanup.
Lưu ý: Một số tài nguyên như snapshots Cloud SQL có thể cần dọn dẹp thủ công.

## Support & Documentation / Hỗ trợ & Tài liệu

- [GCP Documentation](https://cloud.google.com/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Memorystore Documentation](https://cloud.google.com/memorystore/docs)

## License / Giấy phép

This module is part of L-ERP project.
Mô-đun này là một phần của dự án L-ERP.
