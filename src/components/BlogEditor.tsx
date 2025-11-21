import React, { useState, useRef, useEffect } from 'react';
import { Check, X as XIcon } from 'lucide-react';
import { 
  X, UploadCloud, Save, Plus, Loader2, Image as ImageIcon, Eye,
  Crop, Resize, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Type, Heading1, Heading2, Heading3, Code, Table, ListOrdered, 
  Undo, Redo, Strikethrough, Underline, Palette, AlignVerticalJustifyCenter,
  Link, List, Quote, Bold, Italic
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { BlogPost } from '../services/adminApi';
import { apiService } from '../services/apiService';
import { getApiBaseUrl } from '../config/api';
import { isValidYouTubeUrl, normalizeYouTubeUrl, extractYouTubeId } from '../utils/youtubeUtils';

interface BlogEditorProps {
  post: Partial<BlogPost>;
  onChange: (field: keyof BlogPost, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ post, onChange, onSave, onCancel, isEditing }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  const [imageAlignment, setImageAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [videoUrlSaved, setVideoUrlSaved] = useState<boolean>(false);

  // Initialize video URL input when post changes
  useEffect(() => {
    if (post.video_url) {
      setVideoUrlInput(post.video_url);
      setVideoUrlSaved(true);
    } else {
      setVideoUrlInput('');
      setVideoUrlSaved(false);
    }
  }, [post.video_url]);

  // Handle saving video URL
  const handleSaveVideoUrl = () => {
    const trimmed = videoUrlInput.trim();
    if (trimmed) {
      if (isValidYouTubeUrl(trimmed)) {
        const normalized = normalizeYouTubeUrl(trimmed);
        if (normalized) {
          onChange('video_url', normalized);
          setVideoUrlInput(normalized);
          setVideoUrlSaved(true);
        } else {
          setVideoUrlSaved(false);
        }
      } else {
        setVideoUrlSaved(false);
      }
    } else {
      onChange('video_url', '');
      setVideoUrlInput('');
      setVideoUrlSaved(false);
    }
  };
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Quill editor configuration - simplified for better compatibility
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

  function handleImageUpload() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
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
      formData.append('image', file);
      formData.append('type', 'blog');

      try {
        const response = await apiService.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.success && response.url) {
          // Insert image into Quill editor
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            quill.insertEmbed(range?.index || 0, 'image', response.url);
            quill.setSelection((range?.index || 0) + 1);
          }
          setImageUploadError(null);
        } else {
          setImageUploadError(response.error || 'Failed to upload image.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        setImageUploadError('An error occurred during upload.');
      } finally {
        setUploading(false);
      }
    };
  }

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
    formData.append('image', file);
    formData.append('type', 'blog');

    try {
      // Use fetch directly for FormData to avoid Content-Type header issues
      const apiBase = getApiBaseUrl();
      const uploadUrl = apiBase ? `${apiBase}/api/upload/image` : '/api/upload/image';
      
      const token = localStorage.getItem('auth_token') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   'test-token';

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        onChange('featured_image', data.url);
        setImageUploadError(null);
        setShowUploadModal(false);
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

  const handleImageUploadFeatured = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    await processFileUpload(file);
  };

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

  const insertImageInContent = (url: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      quill.insertEmbed(range?.index || 0, 'image', url);
      quill.setSelection((range?.index || 0) + 1);
    }
  };

  const getImageSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'max-w-xs h-32';
      case 'medium': return 'max-w-md h-48';
      case 'large': return 'max-w-lg h-64';
      case 'full': return 'w-full h-64';
      default: return 'max-w-md h-48';
    }
  };

  const getImageAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'float-left mr-4';
      case 'center': return 'mx-auto block';
      case 'right': return 'float-right ml-4';
      default: return 'mx-auto block';
    }
  };

  const handleContentChange = (content: string) => {
    onChange('content', content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button onClick={onCancel} className="btn-outline px-4 py-2 rounded-lg flex items-center gap-2">
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
          <button onClick={onSave} className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2">
            <Save className="h-4 w-4" />
            <span>{isEditing ? 'Update Post' : 'Create Post'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Editor */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card-glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Post Title *</label>
                <input
                  className="input w-full"
                  placeholder="Enter post title"
                  value={post.title || ''}
                  onChange={(e) => onChange('title', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Author Name *</label>
                  <input
                    className="input w-full"
                    placeholder="Enter author name"
                    value={post.author || ''}
                    onChange={(e) => onChange('author', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Category *</label>
                  <select
                    className="input w-full"
                    value={post.category || 'General'}
                    onChange={(e) => onChange('category', e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Business">Business</option>
                    <option value="Research">Research</option>
                    <option value="News">News</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={post.featured || false}
                    onChange={(e) => onChange('featured', e.target.checked)}
                    className="w-4 h-4 text-[var(--color-primary-teal)]"
                  />
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">Featured Post</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Read Time:</label>
                  <input
                    className="input w-24"
                    placeholder="5 min"
                    value={post.read_time || ''}
                    onChange={(e) => onChange('read_time', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Status:</label>
                  <select
                    className="input w-32"
                    value={post.status || 'draft'}
                    onChange={(e) => onChange('status', e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Video URL */}
          <div className="card-glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Video (YouTube)</h3>
            <div className="space-y-4">
              {post.video_url && videoUrlSaved ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                          ✓ Video URL saved
                        </p>
                        <a
                          href={normalizeYouTubeUrl(post.video_url) || post.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-700 dark:text-green-300 hover:underline break-all"
                        >
                          {normalizeYouTubeUrl(post.video_url) || post.video_url}
                        </a>
                        {extractYouTubeId(post.video_url) && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Video ID: {extractYouTubeId(post.video_url)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          onChange('video_url', '');
                          setVideoUrlInput('');
                          setVideoUrlSaved(false);
                        }}
                        className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remove video"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Edit or Replace YouTube Video URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        className={`input flex-1 ${videoUrlInput && !isValidYouTubeUrl(videoUrlInput) ? 'border-red-500 focus:border-red-500' : ''}`}
                        placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                        value={videoUrlInput}
                        onChange={(e) => {
                          setVideoUrlInput(e.target.value);
                          setVideoUrlSaved(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveVideoUrl();
                          }
                        }}
                      />
                      <button
                        onClick={handleSaveVideoUrl}
                        disabled={!videoUrlInput.trim() || (videoUrlInput.trim() === post.video_url)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          isValidYouTubeUrl(videoUrlInput) && videoUrlInput.trim() !== post.video_url
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : videoUrlInput.trim() === post.video_url
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                        }`}
                        title="Save YouTube URL"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                    {videoUrlInput && !isValidYouTubeUrl(videoUrlInput) && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        ⚠️ Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)
                      </p>
                    )}
                    {videoUrlInput && isValidYouTubeUrl(videoUrlInput) && !videoUrlSaved && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        ℹ️ Click "Save" to confirm this YouTube URL.
                      </p>
                    )}
                    {videoUrlSaved && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        ✓ YouTube URL saved. The video will be embedded on the blog post page.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    YouTube Video URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className={`input flex-1 ${videoUrlInput && !isValidYouTubeUrl(videoUrlInput) ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      value={videoUrlInput}
                      onChange={(e) => {
                        setVideoUrlInput(e.target.value);
                        setVideoUrlSaved(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveVideoUrl();
                        }
                      }}
                    />
                    <button
                      onClick={handleSaveVideoUrl}
                      disabled={!videoUrlInput.trim() || !isValidYouTubeUrl(videoUrlInput)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        videoUrlInput.trim() && isValidYouTubeUrl(videoUrlInput)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Save YouTube URL"
                    >
                      <Check className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                  {videoUrlInput && !isValidYouTubeUrl(videoUrlInput) && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      ⚠️ Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)
                    </p>
                  )}
                  {videoUrlInput && isValidYouTubeUrl(videoUrlInput) && !videoUrlSaved && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      ℹ️ Click "Save" to confirm this YouTube URL.
                    </p>
                  )}
                  {videoUrlSaved && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      ✓ YouTube URL saved. The video will be embedded on the blog post page.
                    </p>
                  )}
                  {!videoUrlInput && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                      Enter a YouTube video URL and click "Save" to confirm. The video will be embedded on the blog post page.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Featured Image */}
          <div className="card-glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Featured Image</h3>
            <div className="space-y-4">
              {post.featured_image ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                          ✓ Featured image configured
                        </p>
                        <a
                          href={post.featured_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-700 dark:text-green-300 hover:underline break-all"
                        >
                          {post.featured_image}
                        </a>
                      </div>
                      <button
                        onClick={() => onChange('featured_image', '')}
                        className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Image Preview */}
                    <div className="mt-3 rounded-lg overflow-hidden border border-green-300 dark:border-green-700">
                      <img
                        src={post.featured_image}
                        alt="Featured image preview"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          // Hide image on error instead of showing fallback
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.onerror = null; // Prevent infinite loop
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Replace Image Options */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="image-upload-replace"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUploadFeatured}
                        disabled={uploading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className={`btn-secondary px-4 py-2 rounded-lg flex items-center gap-2 ${
                          uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-opacity-90'
                        }`}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UploadCloud className="h-4 w-4" />
                        )}
                        <span>{uploading ? 'Uploading...' : 'Upload New Image'}</span>
                      </button>
                      <span className="text-sm text-[var(--color-text-secondary)]">Or enter URL:</span>
                    </div>
                    <input
                      className="input w-full"
                      placeholder="https://example.com/image.jpg"
                      value=""
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          onChange('featured_image', e.target.value.trim());
                        }
                      }}
                    />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Upload a new image or enter a URL to replace the current featured image.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Image Upload */}
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUploadFeatured}
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className={`btn-secondary px-4 py-2 rounded-lg flex items-center gap-2 ${
                        uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-opacity-90'
                      }`}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    <span className="text-sm text-[var(--color-text-secondary)]">Or enter URL:</span>
                    <input
                      className="input flex-1"
                      placeholder="https://example.com/image.jpg"
                      value={post.featured_image || ''}
                      onChange={(e) => onChange('featured_image', e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Upload an image file or enter a URL for the featured image.
                  </p>
                </div>
              )}

              {imageUploadError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm">
                  {imageUploadError}
                </div>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div className="card-glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Excerpt</h3>
            <textarea
              className="input w-full"
              placeholder="Write a brief excerpt for this post..."
              rows={3}
              value={post.excerpt || ''}
              onChange={(e) => onChange('excerpt', e.target.value)}
            />
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              This will be shown in blog listings and search results.
            </p>
          </div>
        </div>

        {/* Right Column - Content Editor */}
        <div className="space-y-6">
          {/* Content Editor */}
          <div className="card-glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Content Editor</h3>
            
            {/* Quill Editor */}
            <div className="border border-[var(--color-divider-gray)] rounded-lg overflow-hidden">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={post.content || ''}
                onChange={handleContentChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your blog post content here..."
                style={{
                  backgroundColor: 'var(--color-background-default)',
                  color: 'var(--color-text-primary)',
                  minHeight: '400px'
                }}
              />
            </div>
            
            <div className="text-sm text-[var(--color-text-secondary)] mt-4">
              <p>💡 <strong>Tips:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Use the toolbar buttons for rich text formatting</li>
                <li>Click the image button in the toolbar to upload and insert images</li>
                <li>Use the preview button to see how your content will look</li>
                <li>All formatting will be preserved when published</li>
              </ul>
            </div>
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="card-glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Live Preview</h3>
              <div
                className="prose dark:prose-invert max-w-none p-4 border border-[var(--color-divider-gray)] rounded-lg bg-[var(--color-background-default)]"
                dangerouslySetInnerHTML={{ 
                  __html: post.content || '<p class="text-[var(--color-text-secondary)]">Your content preview will appear here.</p>' 
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal with Drag and Drop */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-background-surface)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border-2 border-[var(--color-divider-gray)]">
            <div className="p-6 border-b border-[var(--color-divider-gray)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[var(--color-primary-teal)]" />
                  Upload Featured Image
                </h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setImageUploadError(null);
                    setIsDragging(false);
                  }}
                  className="p-1.5 hover:bg-[var(--color-background-default)] rounded-lg transition-colors"
                  disabled={uploading}
                >
                  <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
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
                      {uploading ? 'Uploading image...' : isDragging ? 'Drop your image here' : 'Drag and drop your image here'}
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
                onChange={handleImageUploadFeatured}
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
                  className="input w-full"
                  placeholder="https://example.com/image.jpg"
                  value={post.featured_image || ''}
                  onChange={(e) => onChange('featured_image', e.target.value)}
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="p-6 border-t border-[var(--color-divider-gray)] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setImageUploadError(null);
                  setIsDragging(false);
                }}
                className="btn-secondary px-4 py-2 rounded-lg"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogEditor;