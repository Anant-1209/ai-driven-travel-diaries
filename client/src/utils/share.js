export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const tripShareText = (trip, url) =>
  `🧳 ${trip.title}\n${trip.days} days · ${trip.budget} budget · ${trip.destination}\n\nSee the full day-by-day plan: ${url}`;

// Only same-site paths are allowed so ?redirect= can't send users to another website.
export const safeRedirect = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/';
