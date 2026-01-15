import { Mail, Phone } from 'lucide-react';
import Modal from './Modal';
import Avatar from './Avatar';

const UserProfileModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Info" size="md">
      <div className="space-y-6">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center">
          <Avatar
            src={user.avatarUrl}
            name={user.name}
            size="xl"
            className="mb-4"
          />
          <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
          {user.email && (
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          )}
        </div>

        {/* Bio Section */}
        {user.bio && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
            <p className="text-gray-900">{user.bio}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Info</h3>
          
          {user.email && (
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-full">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>
          )}

          {user.phone && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-full">
                <Phone size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-gray-900">{user.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileModal;
