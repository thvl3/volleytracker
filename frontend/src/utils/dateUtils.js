/**
 * Format a timestamp to a readable date and time
 * @param {number} timestamp - Unix timestamp in milliseconds or seconds
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (timestamp) => {
  // Check if timestamp is in seconds (Unix epoch) and convert to milliseconds if needed
  const timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const date = new Date(timeMs);
  
  const options = { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleString('en-US', options);
};

/**
 * Format a timestamp to a readable date only
 * @param {number} timestamp - Unix timestamp in milliseconds or seconds
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  // Check if timestamp is in seconds (Unix epoch) and convert to milliseconds if needed
  const timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const date = new Date(timeMs);
  
  const options = { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format a timestamp to a readable time only
 * @param {number} timestamp - Unix timestamp in milliseconds or seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (timestamp) => {
  // Check if timestamp is in seconds (Unix epoch) and convert to milliseconds if needed
  const timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const date = new Date(timeMs);
  
  const options = { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleTimeString('en-US', options);
};

/**
 * Get a relative time string (e.g., "2 hours ago" or "in 3 days")
 * @param {number} timestamp - Unix timestamp in milliseconds or seconds
 * @returns {string} Relative time string
 */
export const getRelativeTime = (timestamp) => {
  // Check if timestamp is in seconds (Unix epoch) and convert to milliseconds if needed
  const timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const now = new Date();
  const date = new Date(timeMs);
  const diffInSeconds = Math.floor((date - now) / 1000);
  const absSeconds = Math.abs(diffInSeconds);
  
  // In the past
  if (diffInSeconds < 0) {
    if (absSeconds < 60) return `${absSeconds} seconds ago`;
    if (absSeconds < 3600) return `${Math.floor(absSeconds / 60)} minutes ago`;
    if (absSeconds < 86400) return `${Math.floor(absSeconds / 3600)} hours ago`;
    if (absSeconds < 2592000) return `${Math.floor(absSeconds / 86400)} days ago`;
    if (absSeconds < 31536000) return `${Math.floor(absSeconds / 2592000)} months ago`;
    return `${Math.floor(absSeconds / 31536000)} years ago`;
  }
  
  // In the future
  if (absSeconds < 60) return `in ${absSeconds} seconds`;
  if (absSeconds < 3600) return `in ${Math.floor(absSeconds / 60)} minutes`;
  if (absSeconds < 86400) return `in ${Math.floor(absSeconds / 3600)} hours`;
  if (absSeconds < 2592000) return `in ${Math.floor(absSeconds / 86400)} days`;
  if (absSeconds < 31536000) return `in ${Math.floor(absSeconds / 2592000)} months`;
  return `in ${Math.floor(absSeconds / 31536000)} years`;
}; 