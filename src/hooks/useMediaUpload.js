import { useState } from 'react';
import { validateFile, getFileType } from '../utils/helpers';
import { MAX_FILE_SIZE } from '../utils/constants';

export const useMediaUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const selectFile = (file) => {
    const validation = validateFile(file, MAX_FILE_SIZE);
    
    if (!validation.valid) {
      alert(validation.error);
      return false;
    }

    setSelectedFile(file);

    // Create preview for images/videos
    const fileType = getFileType(file);
    if (fileType === 'image' || fileType === 'video') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }

    return true;
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return {
    selectedFile,
    preview,
    uploading,
    setUploading,
    selectFile,
    clearFile,
  };
};