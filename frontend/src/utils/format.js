/**
 * Format a date/time for display
 * @param {number} timestamp - Milliseconds timestamp
 * @returns {string} - Formatted date/time string
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'TBD';
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

/**
 * Format a date for display
 * @param {number} timestamp - Milliseconds timestamp
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'TBD';
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

/**
 * Format a score for display
 * @param {number} score1 - First score
 * @param {number} score2 - Second score
 * @returns {string} - Formatted score string
 */
export const formatScore = (score1, score2) => {
  if (score1 === 0 && score2 === 0) return 'Not Started';
  return `${score1} - ${score2}`;
};

/**
 * Format a match status for display
 * @param {string} status - Match status
 * @returns {string} - Formatted status string
 */
export const formatMatchStatus = (status) => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

/**
 * Format a team name (handling null/undefined)
 * @param {string} name - Team name
 * @returns {string} - Formatted team name
 */
export const formatTeamName = (name) => {
  return name || 'TBD';
}; 