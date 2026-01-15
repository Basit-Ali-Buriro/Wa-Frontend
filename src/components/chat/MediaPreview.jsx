import { X } from 'lucide-react';
import Button from '../common/Button';

const MediaPreview = ({ file, preview, onClear }) => {
  if (!file) return null;

  const isVideo = file.type.startsWith('video/');

  return (
    <div className="bg-gray-100 border-t border-gray-200 p-4">
      <div className="relative inline-block">
        {isVideo ? (
          <video src={preview} className="max-h-40 rounded-lg" controls />
        ) : (
          <img src={preview} alt="preview" className="max-h-40 rounded-lg" />
        )}

        <button
          onClick={onClear}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-2">{file.name}</p>
    </div>
  );
};

export default MediaPreview;