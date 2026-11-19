import { Alert, Button, FileInput, Select, TextInput } from 'flowbite-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { uploadMedia } from '../utils/uploadMedia';

export default function UpdatePost() {
  const [file, setFile] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(null);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState(null);
  const [formData, setFormData] = useState({});
  const [publishError, setPublishError] = useState(null);
  const { postId } = useParams();

  const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    try {
      const fetchPost = async () => {
        const res = await fetch(`/api/post/getposts?postId=${postId}`);
        const data = await res.json();
        if (!res.ok) {
          console.log(data.message);
          setPublishError(data.message);
          return;
        }
        if (res.ok) {
          setPublishError(null);
          setFormData(data.posts[0]);
        }
      };

      fetchPost();
    } catch (error) {
      console.log(error.message);
    }
  }, [postId]);

  const handleUpdloadImage = async () => {
    if (!file) {
      setImageUploadError('Please select an image');
      return;
    }
    try {
      setImageUploadError(null);
      setImageUploadProgress(50);
      const { url } = await uploadMedia(file);
      setFormData((prev) => ({ ...prev, image: url }));
    } catch (error) {
      setImageUploadError(error.message);
    } finally {
      setImageUploadProgress(null);
    }
  };

  const handleUploadVideo = async () => {
    if (!videoFile) {
      setVideoUploadError('Please select a video file (.mp4, .webm)');
      return;
    }
    try {
      setVideoUploadError(null);
      setVideoUploading(true);
      const { url } = await uploadMedia(videoFile);
      setFormData((prev) => ({ ...prev, videoUrl: url }));
    } catch (error) {
      setVideoUploadError(error.message);
    } finally {
      setVideoUploading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/post/updatepost/${formData._id}/${currentUser._id}`, {
        method: 'PUT',
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
      <h1 className='text-center text-3xl my-7 font-semibold'>Update post</h1>
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
            value={formData.title}
          />
          <Select
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            value={formData.category || 'uncategorized'}
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
        <div className='flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3'>
          <FileInput
            type='file'
            accept='image/*'
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Button
            type='button'
            gradientDuoTone='purpleToBlue'
            size='sm'
            outline
            onClick={handleUpdloadImage}
            disabled={imageUploadProgress}
          >
            {imageUploadProgress ? (
              <div className='w-16 h-16'>
                <CircularProgressbar
                  value={imageUploadProgress}
                  text={`${imageUploadProgress || 0}%`}
                />
              </div>
            ) : (
              'Upload Image'
            )}
          </Button>
        </div>
        {imageUploadError && <Alert color='failure'>{imageUploadError}</Alert>}
        {formData.image && (
          <img
            src={formData.image}
            alt='upload'
            className='w-full h-72 object-cover'
          />
        )}
        <div className='flex gap-4 items-center justify-between border-4 border-purple-500 border-dotted p-3'>
          <FileInput
            type='file'
            accept='video/mp4,video/webm'
            onChange={(e) => setVideoFile(e.target.files[0])}
          />
          <Button
            type='button'
            gradientDuoTone='purpleToPink'
            size='sm'
            outline
            onClick={handleUploadVideo}
            disabled={videoUploading}
          >
            {videoUploading ? 'Uploading...' : formData.videoUrl ? 'Replace Video' : 'Upload Video'}
          </Button>
        </div>
        {videoUploadError && <Alert color='failure'>{videoUploadError}</Alert>}
        {formData.videoUrl && (
          <div className='p-2 bg-slate-900 rounded-xl'>
            <video key={formData.videoUrl} controls className='w-full max-h-60 rounded-lg'>
              <source src={formData.videoUrl} type='video/mp4' />
            </video>
            <button
              type='button'
              className='mt-2 text-xs text-red-400 hover:underline'
              onClick={() => setFormData((prev) => ({ ...prev, videoUrl: '' }))}
            >
              Remove video
            </button>
          </div>
        )}
        <ReactQuill
          theme='snow'
          value={formData.content}
          placeholder='Write something...'
          className='h-72 mb-12'
          required
          onChange={(value) => {
            setFormData({ ...formData, content: value });
          }}
        />
        <Button type='submit' gradientDuoTone='purpleToPink'>
          Update post
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
