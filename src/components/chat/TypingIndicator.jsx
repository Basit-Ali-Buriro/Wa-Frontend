import Avatar from '../common/Avatar';

const TypingIndicator = ({ users }) => {
  const typingUsers = Object.values(users);

  if (typingUsers.length === 0) {
    return null;
  }

  let displayText;
  if (typingUsers.length === 1) {
    displayText = `${typingUsers[0].name} is typing...`;
  } else if (typingUsers.length === 2) {
    displayText = `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
  } else {
    displayText = `${typingUsers.length} people are typing...`;
  }

  return (
    <div className="px-4 py-2 flex items-center gap-2 text-sm text-gray-600 animate-fadeIn">
      <div className="flex gap-1 items-center">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
      </div>
      <p className="font-medium">{displayText}</p>
    </div>
  );
};

export default TypingIndicator;