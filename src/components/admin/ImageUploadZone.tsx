"use client";

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadZoneProps {
  onImageUploaded?: (url: string) => void;
  onImageRemoved?: () => void;
  initialImage?: string;
  className?: string;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  title?: string;
  description?: string;
}

export default function ImageUploadZone({
  onImageUploaded,
  onImageRemoved,
  initialImage,
  className = '',
  maxFileSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  title = "Upload Image",
  description = "Drag and drop or click to select"
}: ImageUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState(initialImage || '');
  const [error, setError] = useState('');

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use ${acceptedTypes.join(', ')}.`;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB.`;
    }
    
    return null;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'product-images'); // Use existing Supabase storage bucket
    
    const response = await fetch('/api/upload-product-image', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    const data = await response.json();
    return data.url;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const imageUrl = await uploadImage(file);
      setCurrentImage(imageUrl);
      onImageUploaded?.(imageUrl);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Image upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setCurrentImage('');
    setError('');
    onImageRemoved?.();
  };

  if (currentImage) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative overflow-hidden rounded-lg border border-gray-200">
          <img 
            src={currentImage} 
            alt="Uploaded" 
            className="w-full h-48 object-cover"
          />
          
          {/* Remove button - positioned at top-right */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={removeImage}
              size="sm"
              variant="destructive"
              className="flex items-center space-x-1 shadow-lg"
            >
              <X className="w-4 h-4" />
              <span>Remove</span>
            </Button>
          </div>
        </div>
        
        {/* Image URL display */}
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 truncate">
          {currentImage}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {uploading ? (
          <div className="text-center">
            <div className="text-blue-600 mb-2">⏳</div>
            <p className="text-sm text-gray-700">Uploading...</p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-4xl text-gray-400">📷</div>
            <div>
              <p className="text-lg font-medium text-gray-900">{title}</p>
              <p className="text-sm text-gray-500 mb-2">{description}</p>
              <p className="text-xs text-gray-400">
                Supports: {acceptedTypes.map(type => type.split('/')[1]).join(', ')} 
                • Max size: {maxFileSize}MB
              </p>
            </div>
            <Button type="button" variant="outline" size="sm">
              📤 Choose File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}