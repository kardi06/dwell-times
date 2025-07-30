import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import { CloudUpload, Close } from '@mui/icons-material';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      setSuccess('File uploaded successfully!');
      setSelectedFile(null);
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setSuccess('');
      }, 2000);

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
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease-in-out'
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file here'}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            or click to browse files
          </Typography>
          
          <Typography variant="caption" color="textSecondary">
            Maximum file size: {maxFileSize / (1024 * 1024)}MB
          </Typography>
        </Box>
      </Paper>

      {selectedFile && (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" fontWeight="medium">
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </Typography>
            </Box>
            <IconButton onClick={clearFile} size="small">
              <Close />
            </IconButton>
          </Box>
          
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 2 }}
            fullWidth
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </Paper>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="textSecondary">
            {uploadProgress}% complete
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload; 