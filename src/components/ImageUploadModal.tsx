import React, { useState, useRef } from 'react';
import { X, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  title?: string;
  uploadType?: 'blog' | 'ads' | 'announcement' | 'company' | 'investor';
  fieldName?: string; // For displaying which field this is for
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  title = 'Upload Image',
  uploadType = 'blog',
  fieldName = 'image'
}) => {
  const [uploading, setUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileUpload(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const processFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setImageUploadError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file.');
      setUploading(false);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError('Image size should be less than 10MB.');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    
    try {
      // Use fetch directly for FormData to avoid Content-Type header issues
      const apiBase = getApiBaseUrl();
      // Map upload types to the correct Node.js endpoint
      let uploadUrl;
      let fieldName;
      if (uploadType === 'blog') {
        uploadUrl = apiBase ? `${apiBase}/api/upload/image` : '/api/upload/image';
        fieldName = 'image';
        formData.append('image', file);
        formData.append('type', uploadType);
      } else {
        // For ads, announcement, company, investor - use Node.js admin upload endpoint
        uploadUrl = apiBase ? `${apiBase}/api/upload/admin` : '/api/upload/admin';
        fieldName = 'file';
        formData.append('file', file);
        formData.append('type', uploadType);
      }
      
      const token = localStorage.getItem('auth_token') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   'test-token';

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        onImageUploaded(data.url);
        setImageUploadError(null);
        onClose();
      } else {
        setImageUploadError(data.error || 'Failed to upload image.');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setImageUploadError(error.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    await processFileUpload(file);
  };

  const handleRemove = () => {
    if (onImageRemoved) {
      onImageRemoved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-background-surface)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border-2 border-[var(--color-divider-gray)]">
        <div className="p-6 border-b border-[var(--color-divider-gray)]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[var(--color-primary-teal)]" />
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--color-background-default)] rounded-lg transition-colors"
              disabled={uploading}
            >
              <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Current Image Display */}
          {currentImageUrl && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    ✓ Current {fieldName}
                  </p>
                  <a
                    href={currentImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 dark:text-green-300 hover:underline break-all"
                  >
                    {currentImageUrl}
                  </a>
                </div>
                {onImageRemoved && (
                  <button
                    onClick={handleRemove}
                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Remove image"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Image Preview */}
              <div className="mt-3 rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
                <img
                  src={currentImageUrl}
                  alt={`Current ${fieldName}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Hide image on error instead of showing fallback
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.onerror = null; // Prevent infinite loop
                  }}
                />
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging
                ? 'border-[var(--color-primary-teal)] bg-[var(--color-primary-teal)]/10'
                : 'border-[var(--color-divider-gray)] hover:border-[var(--color-primary-teal)]/50'
            } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
            onClick={handleBrowseClick}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${
                isDragging ? 'bg-[var(--color-primary-teal)]/20' : 'bg-[var(--color-background-default)]'
              }`}>
                {uploading ? (
                  <Loader2 className="h-12 w-12 text-[var(--color-primary-teal)] animate-spin" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-[var(--color-primary-teal)]" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                  {uploading ? 'Uploading image...' : isDragging ? 'Drop your image here' : currentImageUrl ? 'Replace image by dragging and dropping' : 'Drag and drop your image here'}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  or click to browse your computer
                </p>
                <button
                  type="button"
                  className="btn-primary px-6 py-2 rounded-lg"
                  disabled={uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowseClick();
                  }}
                >
                  Browse Files
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Supported formats: JPG, PNG, GIF, WebP (Max 10MB)
              </p>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={uploading}
          />

          {/* Error Message */}
          {imageUploadError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{imageUploadError}</p>
            </div>
          )}

          {/* URL Input Alternative */}
          <div className="pt-4 border-t border-[var(--color-divider-gray)]">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Or enter image URL:
            </label>
            <input
              type="url"
              className="input w-full"
              placeholder="https://example.com/image.jpg"
              value={currentImageUrl || ''}
              onChange={(e) => {
                if (e.target.value.trim()) {
                  onImageUploaded(e.target.value.trim());
                }
              }}
              disabled={uploading}
            />
          </div>
        </div>

        <div className="p-6 border-t border-[var(--color-divider-gray)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2 rounded-lg"
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;

