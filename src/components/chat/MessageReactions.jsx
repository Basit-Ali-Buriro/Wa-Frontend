import { useState } from 'react';

const MessageReactions = ({ reactions, onReact }) => {
  const [showAll, setShowAll] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.user);
    return acc;
  }, {});

  const reactionEntries = Object.entries(groupedReactions);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactionEntries.slice(0, showAll ? reactionEntries.length : 3).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="bg-white border border-gray-300 rounded-full px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-100 transition-colors"
        >
          <span>{emoji}</span>
          <span className="text-gray-600">{users.length}</span>
        </button>
      ))}

      {reactionEntries.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="bg-white border border-gray-300 rounded-full px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          {showAll ? 'Less' : `+${reactionEntries.length - 3}`}
        </button>
      )}
    </div>
  );
};

export default MessageReactions;