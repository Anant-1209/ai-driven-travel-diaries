import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import { useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
  const [file, setFile] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(null);
  const [videoUploadError, setVideoUploadError] = useState(null);
  const [formData, setFormData] = useState({});
  const [publishError, setPublishError] = useState(null);
  const [autoTagging, setAutoTagging] = useState(false);

  const navigate = useNavigate();

  // Self-Hosted First-Party Image Upload
  const handleUpdloadImage = async () => {
    try {
      if (!file) {
        setImageUploadError('Please select an image');
        return;
      }
      setImageUploadError(null);
      setImageUploadProgress(50);

      const uploadData = new FormData();
      uploadData.append('media', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok) {
        setImageUploadError(data.message || 'Image upload failed');
        setImageUploadProgress(null);
        return;
      }

      setImageUploadProgress(100);
      setFormData((prev) => ({ ...prev, image: data.url }));
      setTimeout(() => setImageUploadProgress(null), 1000);
    } catch (error) {
      setImageUploadError('Server upload failed. Ensure you are signed in.');
      setImageUploadProgress(null);
    }
  };

  // Self-Hosted First-Party AI Video Guide Upload
  const handleUploadVideo = async () => {
    try {
      if (!videoFile) {
        setVideoUploadError('Please select a video file (.mp4, .webm)');
        return;
      }
      setVideoUploadError(null);
      setVideoUploadProgress(50);

      const uploadData = new FormData();
      uploadData.append('media', videoFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok) {
        setVideoUploadError(data.message || 'Video upload failed');
        setVideoUploadProgress(null);
        return;
      }

      setVideoUploadProgress(100);
      setFormData((prev) => ({ ...prev, videoUrl: data.url }));
      setTimeout(() => setVideoUploadProgress(null), 1000);
    } catch (error) {
      setVideoUploadError('Server video upload failed. Ensure you are signed in.');
      setVideoUploadProgress(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/post/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message);
        return;
      }

      if (res.ok) {
        setPublishError(null);
        navigate(`/post/${data.slug}`);
      }
    } catch (error) {
      setPublishError('Something went wrong');
    }
  };
  return (
    <div className='p-3 max-w-3xl mx-auto min-h-screen'>
      <h1 className='text-center text-3xl my-7 font-semibold'>Create a post</h1>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-4 sm:flex-row justify-between'>
          <TextInput
            type='text'
            placeholder='Title'
            required
            id='title'
            className='flex-1'
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <Select
  onChange={(e) =>
    setFormData({ ...formData, category: e.target.value })
  }
>
  <option value='uncategorized'>Select a category</option>
  <option value='destinations'>Destinations</option>
  <option value='travel-tips'>Travel Tips</option>
  <option value='adventures'>Adventures</option>
  <option value='accommodation'>Accommodation</option>
  <option value='food-and-dining'>Food and Dining</option>
  <option value='budget-travel'>Budget Travel</option>
  <option value='sustainable-travel'>Sustainable Travel</option>
</Select>

        </div>
        {/* Image Upload Box */}
        <div className='flex gap-4 items-center justify-between border-2 border-teal-500 border-dashed rounded-2xl p-4 bg-teal-50/50 dark:bg-slate-900/40'>
          <div className='flex-1'>
            <label className='block text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1'>
              📸 Destination Image (Self-Hosted)
            </label>
            <FileInput
              type='file'
              accept='image/*'
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <Button
            type='button'
            gradientDuoTone='purpleToBlue'
            size='sm'
            outline
            onClick={handleUpdloadImage}
            disabled={imageUploadProgress}
          >
            {imageUploadProgress ? (
              <div className='w-14 h-14'>
                <CircularProgressbar
                  value={imageUploadProgress}
                  text={`${imageUploadProgress || 0}%`}
                />
              </div>
            ) : (
              'Upload Photo'
            )}
          </Button>
        </div>
        {imageUploadError && <Alert color='failure'>{imageUploadError}</Alert>}
        {formData.image && (
          <img
            src={formData.image}
            alt='upload'
            className='w-full h-64 object-cover rounded-xl shadow-md'
          />
        )}

        {/* AI Video Walkthrough Upload Box */}
        <div className='flex gap-4 items-center justify-between border-2 border-purple-500 border-dashed rounded-2xl p-4 bg-purple-50/50 dark:bg-slate-900/40'>
          <div className='flex-1'>
            <label className='block text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 mb-1'>
              🎬 AI Journey Video Guide (.mp4, .webm)
            </label>
            <FileInput
              type='file'
              accept='video/mp4,video/webm'
              onChange={(e) => setVideoFile(e.target.files[0])}
            />
          </div>
          <Button
            type='button'
            gradientDuoTone='purpleToPink'
            size='sm'
            outline
            onClick={handleUploadVideo}
            disabled={videoUploadProgress}
          >
            {videoUploadProgress ? (
              <div className='w-14 h-14'>
                <CircularProgressbar
                  value={videoUploadProgress}
                  text={`${videoUploadProgress || 0}%`}
                />
              </div>
            ) : (
              'Upload Video'
            )}
          </Button>
        </div>
        {videoUploadError && <Alert color='failure'>{videoUploadError}</Alert>}
        {formData.videoUrl && (
          <div className='p-2 bg-slate-900 rounded-xl'>
            <span className='text-xs text-emerald-400 font-bold block mb-1'>✓ Video attached:</span>
            <video controls className='w-full max-h-60 rounded-lg'>
              <source src={formData.videoUrl} type='video/mp4' />
            </video>
          </div>
        )}
        <ReactQuill
          theme='snow'
          placeholder='Write something...'
          className='h-72 mb-12'
          required
          onChange={(value) => {
            setFormData({ ...formData, content: value });
          }}
        />

        <Button
          type='button'
          gradientDuoTone='tealToLime'
          outline
          onClick={async () => {
            if (!formData.content || formData.content.length < 20) {
               setPublishError('Please write some content first to auto-tag!');
               return;
            }
            try {
              setAutoTagging(true);
              setPublishError(null);
              const res = await fetch('/api/ai/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: formData.content.replace(/<[^>]+>/g, '') })
              });
              const data = await res.json();
              if (res.ok && data.tags && data.tags.length > 0) {
                // For simplicity, we just set the first suggested tag or map it
                setFormData({ ...formData, category: data.tags[0].toLowerCase().replace(/\s+/g, '-') });
                alert('AI Suggested Tags: ' + data.tags.join(', '));
              }
            } catch (err) {
              setPublishError('Failed to generate tags');
            } finally {
              setAutoTagging(false);
            }
          }}
          disabled={autoTagging}
        >
          {autoTagging ? 'Analyzing...' : '✨ Auto-Tag with AI'}
        </Button>

        <Button type='submit' gradientDuoTone='purpleToPink'>
          Publish
        </Button>
        {publishError && (
          <Alert className='mt-5' color='failure'>
            {publishError}
          </Alert>
        )}
      </form>
    </div>
  );
}

