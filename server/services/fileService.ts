import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { storage } from '../storage';
import type { InsertDocument } from '@shared/schema';

interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  version: number;
}

interface FileVersion {
  id: string;
  version: number;
  filename: string;
  createdAt: Date;
  createdBy: string;
}

class FileService {
  private uploadDir = path.join(process.cwd(), 'uploads');
  private versionsDir = path.join(this.uploadDir, 'versions');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.versionsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  private generateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private generateUniqueFilename(originalName: string): string {
    const extension = this.getFileExtension(originalName);
    const baseName = path.basename(originalName, extension);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${baseName}-${timestamp}-${random}${extension}`;
  }

  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.includes('cad') || mimeType.includes('dwg')) return 'cad';
    if (mimeType.includes('3d') || mimeType.includes('model')) return '3d';
    return 'document';
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    projectId: string,
    uploadedBy: string,
    description?: string
  ): Promise<string> {
    try {
      const filename = this.generateUniqueFilename(originalName);
      const filePath = path.join(this.uploadDir, filename);
      const checksum = this.generateChecksum(fileBuffer);
      const fileType = this.getFileType(mimeType);

      // Check for duplicate files by checksum
      const existingDoc = await this.findFileByChecksum(checksum, projectId);
      if (existingDoc) {
        // File already exists, create a new version instead
        return await this.createFileVersion(existingDoc.id, fileBuffer, originalName, uploadedBy);
      }

      // Write file to disk
      await fs.writeFile(filePath, fileBuffer);

      // Create document record
      const document = await storage.createDocument({
        filename,
        originalName,
        mimeType,
        size: fileBuffer.length,
        projectId,
        uploadedBy,
        description: description || '',
        fileType,
        filePath: `/uploads/${filename}`,
        checksum,
        version: 1,
      });

      return document.id;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  async createFileVersion(
    documentId: string,
    fileBuffer: Buffer,
    originalName: string,
    uploadedBy: string
  ): Promise<string> {
    try {
      const existingDoc = await storage.getDocument(documentId);
      if (!existingDoc) {
        throw new Error('Original document not found');
      }

      const newVersion = existingDoc.version + 1;
      const filename = this.generateUniqueFilename(`v${newVersion}-${originalName}`);
      const versionPath = path.join(this.versionsDir, filename);
      const checksum = this.generateChecksum(fileBuffer);

      // Write version file
      await fs.writeFile(versionPath, fileBuffer);

      // Create new document version record
      const versionDoc = await storage.createDocument({
        filename,
        originalName: `v${newVersion}-${originalName}`,
        mimeType: existingDoc.mimeType,
        size: fileBuffer.length,
        projectId: existingDoc.projectId,
        uploadedBy,
        description: `Version ${newVersion} of ${existingDoc.originalName}`,
        fileType: existingDoc.fileType,
        filePath: `/uploads/versions/${filename}`,
        checksum,
        version: newVersion,
        parentDocumentId: documentId,
      });

      return versionDoc.id;
    } catch (error) {
      console.error('File version creation failed:', error);
      throw new Error('Failed to create file version');
    }
  }

  async getFileVersions(documentId: string): Promise<FileVersion[]> {
    try {
      const versions = await storage.getDocumentVersions(documentId);
      return versions.map(doc => ({
        id: doc.id,
        version: doc.version,
        filename: doc.originalName,
        createdAt: new Date(doc.createdAt!),
        createdBy: doc.uploadedBy,
      }));
    } catch (error) {
      console.error('Failed to get file versions:', error);
      return [];
    }
  }

  async deleteFile(documentId: string, userId: string): Promise<boolean> {
    try {
      const document = await storage.getDocument(documentId);
      if (!document) return false;

      // Check permissions (you might want to add proper authorization)
      if (document.uploadedBy !== userId) {
        throw new Error('Unauthorized to delete this file');
      }

      // Delete physical file
      const fullPath = path.join(process.cwd(), document.filePath.substring(1)); // Remove leading '/'
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.warn('Failed to delete physical file:', error);
      }

      // Delete all versions
      const versions = await this.getFileVersions(documentId);
      for (const version of versions) {
        await storage.deleteDocument(version.id);
      }

      // Delete main document record
      await storage.deleteDocument(documentId);

      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  async getFileContent(documentId: string): Promise<Buffer | null> {
    try {
      const document = await storage.getDocument(documentId);
      if (!document) return null;

      const fullPath = path.join(process.cwd(), document.filePath.substring(1));
      return await fs.readFile(fullPath);
    } catch (error) {
      console.error('Failed to read file content:', error);
      return null;
    }
  }

  async organizeFiles(projectId: string): Promise<{ [category: string]: any[] }> {
    try {
      const documents = await storage.getDocuments(projectId);
      
      const organized = documents.reduce((acc, doc) => {
        const category = doc.fileType || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          ...doc,
          sizeFormatted: this.formatFileSize(doc.size),
          createdAtFormatted: new Date(doc.createdAt!).toLocaleDateString(),
        });
        return acc;
      }, {} as { [category: string]: any[] });

      return organized;
    } catch (error) {
      console.error('Failed to organize files:', error);
      return {};
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async findFileByChecksum(checksum: string, projectId: string): Promise<any | null> {
    try {
      return await storage.getDocumentByChecksum(checksum, projectId);
    } catch (error) {
      return null;
    }
  }

  async getStorageStats(projectId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: { [type: string]: { count: number; size: number } };
  }> {
    try {
      const documents = await storage.getDocuments(projectId);
      
      const stats = {
        totalFiles: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
        byType: {} as { [type: string]: { count: number; size: number } }
      };

      documents.forEach(doc => {
        const type = doc.fileType || 'other';
        if (!stats.byType[type]) {
          stats.byType[type] = { count: 0, size: 0 };
        }
        stats.byType[type].count++;
        stats.byType[type].size += doc.size;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalFiles: 0, totalSize: 0, byType: {} };
    }
  }

  // Cleanup old file versions (to be called periodically)
  async cleanupOldVersions(retainVersions = 10): Promise<void> {
    try {
      const documents = await storage.getAllDocuments();
      const documentGroups = new Map<string, any[]>();

      // Group documents by parent or by themselves if no parent
      documents.forEach(doc => {
        const key = doc.parentDocumentId || doc.id;
        if (!documentGroups.has(key)) {
          documentGroups.set(key, []);
        }
        documentGroups.get(key)!.push(doc);
      });

      // Clean up old versions for each document group
      for (const [, versions] of documentGroups) {
        if (versions.length > retainVersions) {
          // Sort by version descending and keep only the latest versions
          versions.sort((a, b) => b.version - a.version);
          const toDelete = versions.slice(retainVersions);

          for (const doc of toDelete) {
            await this.deleteFile(doc.id, doc.uploadedBy);
          }
        }
      }
    } catch (error) {
      console.error('Cleanup old versions failed:', error);
    }
  }
}

export const fileService = new FileService();