/**
 * Formats an ISO date string into a human-friendly relative timestamp.
 * Returns "Just now", "Xm ago", HH:MM, or "Mon DD" depending on elapsed time.
 */
export const formatTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMin = Math.floor(diffInMs / 60000);

  if (diffInMin < 1) return "Just now";
  if (diffInMin < 60) return `${diffInMin}m ago`;

  const diffInHrs = Math.floor(diffInMin / 60);
  if (diffInHrs < 24) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const diffInDays = Math.floor(diffInHrs / 24);
  if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" }); // e.g., "Mon"
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" }); // e.g., "Aug 5"
};

/**
 * Returns a full date-time string for message detail views.
 */
export const formatFullTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
