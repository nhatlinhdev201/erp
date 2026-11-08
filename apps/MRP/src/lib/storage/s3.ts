// =============================================================================
// L-ERP MRP - S3 FILE STORAGE
// Tenant-isolated file storage using AWS S3
// NOTE: Install AWS SDK before using: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
// =============================================================================

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// =============================================================================
// S3 CLIENT
// =============================================================================

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

const BUCKET = process.env.S3_BUCKET || 'lerp-files-mrp';

// =============================================================================
// PATH PATTERNS (Tenant-isolated)
// =============================================================================

export const storagePaths = {
  /**
   * Documents (e.g., uploaded files)
   */
  documents: (tenantId: string, filename: string) =>
    `tenants/${tenantId}/documents/${filename}`,

  /**
   * Generated reports
   */
  reports: (tenantId: string, reportType: string, filename: string) =>
    `tenants/${tenantId}/reports/${reportType}/${filename}`,

  /**
   * Data exports
   */
  exports: (tenantId: string, exportType: string, filename: string) =>
    `tenants/${tenantId}/exports/${exportType}/${filename}`,

  /**
   * Data imports (uploaded files for processing)
   */
  imports: (tenantId: string, filename: string) =>
    `tenants/${tenantId}/imports/${filename}`,

  /**
   * Attachments (linked to specific resources)
   */
  attachments: (
    tenantId: string,
    resourceType: string,
    resourceId: string,
    filename: string
  ) => `tenants/${tenantId}/attachments/${resourceType}/${resourceId}/${filename}`,

  /**
   * User uploads (temporary)
   */
  uploads: (tenantId: string, userId: string, filename: string) =>
    `tenants/${tenantId}/uploads/${userId}/${filename}`,

  /**
   * Backups
   */
  backups: (tenantId: string, backupType: string, filename: string) =>
    `tenants/${tenantId}/backups/${backupType}/${filename}`,

  /**
   * Logos and branding
   */
  branding: (tenantId: string, filename: string) =>
    `tenants/${tenantId}/branding/${filename}`,
};

// =============================================================================
// FILE METADATA
// =============================================================================

export interface FileMetadata {
  tenantId: string;
  uploadedBy?: string;
  originalName?: string;
  description?: string;
  resourceType?: string;
  resourceId?: string;
  [key: string]: string | undefined;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  metadata?: FileMetadata;
}

// =============================================================================
// UPLOAD OPERATIONS
// =============================================================================

/**
 * Upload file to S3
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | Readable | string,
  contentType: string,
  metadata?: FileMetadata
): Promise<string> {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata as Record<string, string>,
    })
  );

  return key;
}

/**
 * Upload file with automatic path generation
 */
export async function uploadTenantFile(
  tenantId: string,
  category: 'documents' | 'reports' | 'exports' | 'imports' | 'attachments',
  filename: string,
  body: Buffer | Uint8Array | Readable | string,
  contentType: string,
  options?: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    description?: string;
  }
): Promise<{ key: string; url: string }> {
  // Generate unique filename
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}-${filename}`;

  // Generate key based on category
  let key: string;
  switch (category) {
    case 'documents':
      key = storagePaths.documents(tenantId, uniqueFilename);
      break;
    case 'reports':
      key = storagePaths.reports(tenantId, 'general', uniqueFilename);
      break;
    case 'exports':
      key = storagePaths.exports(tenantId, 'data', uniqueFilename);
      break;
    case 'imports':
      key = storagePaths.imports(tenantId, uniqueFilename);
      break;
    case 'attachments':
      if (!options?.resourceType || !options?.resourceId) {
        throw new Error('resourceType and resourceId required for attachments');
      }
      key = storagePaths.attachments(
        tenantId,
        options.resourceType,
        options.resourceId,
        uniqueFilename
      );
      break;
    default:
      key = `tenants/${tenantId}/files/${uniqueFilename}`;
  }

  // Upload with metadata
  await uploadFile(key, body, contentType, {
    tenantId,
    uploadedBy: options?.userId,
    originalName: filename,
    description: options?.description,
    resourceType: options?.resourceType,
    resourceId: options?.resourceId,
  });

  // Generate URL
  const url = await getDownloadUrl(key);

  return { key, url };
}

/**
 * Get pre-signed URL for client-side upload
 */
export async function getUploadUrl(
  tenantId: string,
  filename: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
  const client = getS3Client();
  const timestamp = Date.now();
  const key = `tenants/${tenantId}/uploads/${timestamp}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return { uploadUrl, key };
}

// =============================================================================
// DOWNLOAD OPERATIONS
// =============================================================================

/**
 * Get pre-signed download URL
 */
export async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600,
  downloadFilename?: string
): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: downloadFilename
      ? `attachment; filename="${downloadFilename}"`
      : undefined,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Download file content
 */
export async function downloadFile(key: string): Promise<{
  body: Readable;
  contentType?: string;
  contentLength?: number;
}> {
  const client = getS3Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  return {
    body: response.Body as Readable,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
}

/**
 * Download file as buffer
 */
export async function downloadFileAsBuffer(key: string): Promise<Buffer> {
  const { body } = await downloadFile(key);

  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
}

// =============================================================================
// FILE INFO & LISTING
// =============================================================================

/**
 * Get file info
 */
export async function getFileInfo(key: string): Promise<FileInfo | null> {
  const client = getS3Client();

  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );

    return {
      key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
      metadata: response.Metadata as FileMetadata,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'NotFound') {
      return null;
    }
    throw error;
  }
}

/**
 * List files in a path
 */
export async function listFiles(
  prefix: string,
  maxKeys: number = 1000
): Promise<FileInfo[]> {
  const client = getS3Client();

  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })
  );

  return (response.Contents || []).map((item) => ({
    key: item.Key!,
    size: item.Size || 0,
    lastModified: item.LastModified || new Date(),
  }));
}

/**
 * List tenant files
 */
export async function listTenantFiles(
  tenantId: string,
  category?: string,
  maxKeys: number = 1000
): Promise<FileInfo[]> {
  const prefix = category
    ? `tenants/${tenantId}/${category}/`
    : `tenants/${tenantId}/`;

  return listFiles(prefix, maxKeys);
}

// =============================================================================
// DELETE OPERATIONS
// =============================================================================

/**
 * Delete single file
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Delete multiple files
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const client = getS3Client();

  // S3 allows max 1000 objects per request
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);

    await client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
        },
      })
    );
  }
}

/**
 * Delete all files with prefix
 */
export async function deleteByPrefix(prefix: string): Promise<number> {
  const files = await listFiles(prefix, 10000);
  const keys = files.map((f) => f.key);

  if (keys.length > 0) {
    await deleteFiles(keys);
  }

  return keys.length;
}

/**
 * Delete all tenant files
 */
export async function deleteTenantFiles(tenantId: string): Promise<number> {
  return deleteByPrefix(`tenants/${tenantId}/`);
}

// =============================================================================
// COPY/MOVE OPERATIONS
// =============================================================================

/**
 * Copy file
 */
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const client = getS3Client();

  await client.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${sourceKey}`,
      Key: destinationKey,
    })
  );
}

/**
 * Move file (copy + delete)
 */
export async function moveFile(
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  await copyFile(sourceKey, destinationKey);
  await deleteFile(sourceKey);
}

// =============================================================================
// STORAGE USAGE
// =============================================================================

/**
 * Get storage usage for tenant
 */
export async function getTenantStorageUsage(
  tenantId: string
): Promise<{ totalSize: number; fileCount: number }> {
  const files = await listTenantFiles(tenantId, undefined, 10000);

  return {
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    fileCount: files.length,
  };
}

/**
 * Get storage breakdown by category
 */
export async function getTenantStorageBreakdown(
  tenantId: string
): Promise<Record<string, { size: number; count: number }>> {
  const categories = [
    'documents',
    'reports',
    'exports',
    'imports',
    'attachments',
    'uploads',
    'backups',
    'branding',
  ];

  const breakdown: Record<string, { size: number; count: number }> = {};

  for (const category of categories) {
    const files = await listTenantFiles(tenantId, category);
    breakdown[category] = {
      size: files.reduce((sum, f) => sum + f.size, 0),
      count: files.length,
    };
  }

  return breakdown;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  uploadFile,
  uploadTenantFile,
  getUploadUrl,
  getDownloadUrl,
  downloadFile,
  downloadFileAsBuffer,
  getFileInfo,
  listFiles,
  listTenantFiles,
  deleteFile,
  deleteFiles,
  deleteByPrefix,
  deleteTenantFiles,
  copyFile,
  moveFile,
  getTenantStorageUsage,
  getTenantStorageBreakdown,
};
