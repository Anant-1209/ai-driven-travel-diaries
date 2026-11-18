import { Alert, Button, Modal, TextInput, Textarea } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Comment from './Comment';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useSocket } from '../context/SocketContext';

export default function CommentSection({ postId }) {
  const { currentUser } = useSelector((state) => state.user);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [comments, setComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [tripType, setTripType] = useState('Family Trip');
  const [isWorthIt, setIsWorthIt] = useState('Worth It!');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('newComment', (newComment) => {
        if (newComment.postId === postId) {
          setComments((prev) => {
            if (prev.find((c) => c._id === newComment._id)) return prev;
            return [newComment, ...prev];
          });
        }
      });
      socket.on('commentLiked', ({ commentId, likes, numberOfLikes }) => {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, likes, numberOfLikes } : c))
        );
      });
      socket.on('userTyping', (username) => setTypingUser(username));
      socket.on('userStoppedTyping', () => setTypingUser(null));

      return () => {
        socket.off('newComment');
        socket.off('commentLiked');
        socket.off('userTyping');
        socket.off('userStoppedTyping');
      };
    }
  }, [socket, postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.length > 200) {
      return;
    }
    try {
      const res = await fetch('/api/comment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: comment,
          postId,
          userId: currentUser._id,
          username: currentUser.username,
          rating,
          tripType,
          isWorthIt,
          photoUrl: photoUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setComment('');
        setPhotoUrl('');
        setShowPhotoInput(false);
        setCommentError(null);
        // We now rely 100% on the socket event to add the comment to the list. 
        // This prevents double comments and ensures everyone sees it at the same time.
        if (socket) socket.emit('stopTyping', { postId });
      } else {
        setCommentError(data.message);
      }
    } catch (error) {
      setCommentError(error.message);
    }
  };

  useEffect(() => {
    const getComments = async () => {
      try {
        const res = await fetch(`/api/comment/getPostComments/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (error) {
        console.log(error.message);
      }
    };
    getComments();
  }, [postId]);

  const handleLike = async (commentId) => {
    try {
      if (!currentUser) {
        navigate('/sign-in');
        return;
      }
      const res = await fetch(`/api/comment/likeComment/${commentId}`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setComments(
          comments.map((comment) =>
            comment._id === commentId
              ? {
                  ...comment,
                  likes: data.likes,
                  numberOfLikes: data.likes.length,
                }
              : comment
          )
        );
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleEdit = async (comment, editedContent) => {
    setComments(
      comments.map((c) =>
        c._id === comment._id ? { ...c, content: editedContent } : c
      )
    );
  };

  const handleDelete = async (commentId) => {
    setShowModal(false);
    try {
      if (!currentUser) {
        navigate('/sign-in');
        return;
      }
      const res = await fetch(`/api/comment/deleteComment/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setComments(comments.filter((comment) => comment._id !== commentId));
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleTyping = (e) => {
    setComment(e.target.value);
    if (socket && currentUser) {
      if (e.target.value.length > 0) {
        socket.emit('typing', { postId, username: currentUser.username });
      } else {
        socket.emit('stopTyping', { postId });
      }
    }
  };

  return (
    <div className='max-w-2xl mx-auto w-full p-3'>
      {currentUser ? (
        <div className='flex items-center gap-1 my-5 text-gray-500 text-sm'>
          <p>Signed in as:</p>
          <img
            className='h-5 w-5 object-cover rounded-full'
            src={currentUser.profilePicture}
            alt=''
          />
          <Link
            to={'/dashboard?tab=profile'}
            className='text-xs text-cyan-600 hover:underline'
          >
            @{currentUser.username}
          </Link>
        </div>
      ) : (
        <div className='text-sm text-teal-500 my-5 flex gap-1'>
          You must be signed in to comment.
          <Link className='text-blue-500 hover:underline' to={'/sign-in'}>
            Sign In
          </Link>
        </div>
      )}
      {currentUser && (
        <form
          onSubmit={handleSubmit}
          className='border border-teal-500/50 dark:border-teal-500/30 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-800 shadow-sm space-y-4'
        >
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3'>
            <div>
              <span className='text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1'>
                Rate Your Experience
              </span>
              <div className='flex items-center gap-1.5'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => setRating(star)}
                    className={`text-xl transition-transform hover:scale-125 ${
                      star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className='text-xs font-semibold text-slate-500 ml-1'>({rating}/5)</span>
              </div>
            </div>

            <div className='flex flex-wrap gap-2'>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className='text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              >
                <option value='Family Trip'>👨‍👩‍👧 Family Trip</option>
                <option value='Solo Traveler'>🎒 Solo Traveler</option>
                <option value='Couple Getaway'>💑 Couple Getaway</option>
                <option value='Friends Group'>👥 Friends Group</option>
              </select>

              <select
                value={isWorthIt}
                onChange={(e) => setIsWorthIt(e.target.value)}
                className='text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              >
                <option value='Worth It!'>🟢 Worth It!</option>
                <option value='Must Visit'>⭐️ Must Visit</option>
                <option value='Good with Precautions'>🟡 Good with Precautions</option>
                <option value='Overrated'>🔴 Overrated</option>
              </select>
            </div>
          </div>

          <Textarea
            placeholder='Share your real, honest experience, current conditions, best time to arrive, or tips for other travelers...'
            rows='3'
            maxLength='200'
            onChange={handleTyping}
            value={comment}
            onBlur={() => {
              if (socket) socket.emit('stopTyping', { postId });
            }}
            className='text-sm'
          />

          {showPhotoInput ? (
            <div className='flex items-center gap-2'>
              <TextInput
                type='url'
                placeholder='Paste a link to your real photo (e.g. imgur, google drive, unsplash)...'
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className='flex-1 text-xs'
              />
              <button
                type='button'
                onClick={() => setShowPhotoInput(false)}
                className='text-xs text-slate-400 hover:text-slate-600'
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => setShowPhotoInput(true)}
              className='text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1'
            >
              📷 Add Real On-The-Ground Photo URL
            </button>
          )}

          <div className='flex justify-between items-center pt-2'>
            <p className='text-gray-500 text-xs'>
              {200 - comment.length} characters remaining
            </p>
            <Button outline gradientDuoTone='purpleToBlue' type='submit'>
              Post Traveler Review
            </Button>
          </div>
          {commentError && (
            <Alert color='failure' className='mt-2'>
              {commentError}
            </Alert>
          )}
        </form>
      )}
      
      {typingUser && (
        <div className='text-xs text-teal-500 italic my-2 animate-pulse'>
          {typingUser} is typing...
        </div>
      )}

      {comments.length === 0 ? (
        <p className='text-sm my-5'>No comments yet!</p>
      ) : (
        <>
          <div className='text-sm my-5 flex items-center gap-1'>
            <p>Comments</p>
            <div className='border border-gray-400 py-1 px-2 rounded-sm'>
              <p>{comments.length}</p>
            </div>
          </div>
          {comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={(commentId) => {
                setShowModal(true);
                setCommentToDelete(commentId);
              }}
            />
          ))}
        </>
      )}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        popup
        size='md'
      >
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this comment?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button
                color='failure'
                onClick={() => handleDelete(commentToDelete)}
              >
                Yes, I'm sure
              </Button>
              <Button color='gray' onClick={() => setShowModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
