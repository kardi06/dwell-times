import React, { useState, useCallback } from 'react';
import { Card, Alert, Button, Loading } from '../ui';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  acceptedFileTypes = ['.csv'],
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    setSuccess('');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a CSV file.');
      } else {
        setError('File upload failed. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
    }
  }, [maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': acceptedFileTypes
    },
    maxSize: maxFileSize,
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setProcessingProgress(0);
    setProcessingStatus('');
    setError('');
    setSuccess('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onFileUpload(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setProcessingStatus('Calculating dwell times...');
      
      // Simulate processing progress
      const processingInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(processingInterval);
            setProcessingStatus('Processing complete!');
            setSuccess('File uploaded and processed successfully! Dwell times calculated.');
            return 100;
          }
          return prev + 20;
        });
      }, 200);
      
      setSelectedFile(null);
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setProcessingProgress(0);
        setProcessingStatus('');
        setSuccess('');
      }, 5000);

    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Drop Zone */}
      <Card 
        variant={isDragActive ? "elevated" : "default"}
        className={`
          border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50 shadow-glow' 
            : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
          }
        `}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        
        <div className="p-8 text-center">
          <div className={`
            inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors duration-300
            ${isDragActive ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'}
          `}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
            isDragActive ? 'text-primary-600' : 'text-secondary-900'
          }`}>
            {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file here'}
          </h3>
          
          <p className="text-secondary-600 mb-2">
            or click to browse files
          </p>
          
          <p className="text-xs text-secondary-500">
            Maximum file size: {maxFileSize / (1024 * 1024)}MB • Supported: CSV files
          </p>
        </div>
      </Card>

      {/* Selected File */}
      {selectedFile && (
        <Card variant="elevated" className="animate-slide-up">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-secondary-900">
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-secondary-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpload}
              disabled={uploading}
              loading={uploading}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card variant="default" className="animate-slide-up">
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-700">Upload Progress</span>
                <span className="text-sm text-secondary-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
            
            {processingStatus && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">{processingStatus}</span>
                  <span className="text-sm text-secondary-500">{processingProgress}%</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-success-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="error" className="animate-fade-in">
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert variant="success" className="animate-fade-in">
          {success}
        </Alert>
      )}
    </div>
  );
};

export default FileUpload; 