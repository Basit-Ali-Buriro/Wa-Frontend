import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../services/api';
import { Camera, Save } from 'lucide-react';
import Modal from './Modal';
import toast from 'react-hot-toast';

const ProfileSettings = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Update state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setAvatarPreview(user.avatarUrl || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (avatarFile) {
        // Upload with file
        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('avatar', avatarFile);

        console.log('📤 Uploading profile with avatar...');
        response = await userAPI.updateAvatar(formData);
      } else {
        // Update without file
        console.log('📤 Updating profile without avatar...');
        response = await userAPI.updateProfile({ name, bio, avatarUrl });
      }

      console.log('✅ Profile update response:', response.data);
      toast.success('Profile updated successfully');

      // Update user state directly with the response data
      console.log('🔄 Updating user state with new data...');
      updateUser(response.data);

      // Small delay to ensure state updates, then close
      setTimeout(() => {
        console.log('✅ Profile updated, closing modal');
        onClose();
      }, 500);
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={avatarPreview || `https://ui-avatars.com/api/?name=${name}`}
              alt={name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-100"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg transition-colors"
            >
              <Camera size={14} className="sm:w-4 sm:h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 sm:mt-3 text-center">Click camera to upload image</p>

          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="Or paste image URL"
            className="mt-2 sm:mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={150}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
            placeholder="Tell us about yourself..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {bio.length}/150 characters
          </p>
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed text-sm sm:text-base"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
          >
            {loading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileSettings;
