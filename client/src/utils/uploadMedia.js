export const uploadMedia = async (file) => {
  const body = new FormData();
  body.append('media', file);
  const res = await fetch('/api/upload', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed. Please make sure you are signed in.');
  return data;
};
