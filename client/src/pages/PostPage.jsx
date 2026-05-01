import { Button, Spinner, Alert } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CallToAction from '../components/CallToAction';
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import { useSocket } from '../context/SocketContext';
import { Helmet } from 'react-helmet-async';
import { HiBookmark, HiOutlineBookmark } from 'react-icons/hi';
import { useSelector } from 'react-redux';

export default function PostPage() {
  const { postSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [activeReaders, setActiveReaders] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const socket = useSocket();

  // Scroll Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(scroll);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/post/getposts?slug=${postSlug}`);
        const data = await res.json();
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        if (res.ok) {
          setPost(data.posts[0]);
          if (currentUser && data.posts[0]) {
            setIsSaved(currentUser.savedPosts?.includes(data.posts[0]._id));
          }
          setLoading(false);
          setError(false);
        }
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };
    fetchPost();
  }, [postSlug]);

  useEffect(() => {
    if (socket && post) {
      socket.emit('joinPost', post._id);
      
      socket.on('activeReadersUpdate', (count) => {
        setActiveReaders(count);
      });

      return () => {
        socket.emit('leavePost', post._id);
        socket.off('activeReadersUpdate');
      };
    }
  }, [socket, post]);

  useEffect(() => {
    try {
      const fetchRelatedPosts = async () => {
        if (!post) return;
        const res = await fetch(`/api/post/getposts?category=${post.category}&limit=3`);
        const data = await res.json();
        if (res.ok) {
          // Filter out the current post from recommendations
          setRecentPosts(data.posts.filter((p) => p._id !== post._id));
        }
      };
      fetchRelatedPosts();
    } catch (error) {
      console.log(error.message);
    }
  }, [post]);

  const handleSavePost = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/user/savePost/${post._id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  if (loading)
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );
  return (
    <>
      {post && (
        <Helmet>
          <title>{post.title} | Travel Diaries</title>
          <meta name="description" content={post.content.replace(/<[^>]+>/g, '').substring(0, 160)} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.content.replace(/<[^>]+>/g, '').substring(0, 160)} />
          <meta property="og:image" content={post.image} />
          <meta property="og:url" content={window.location.href} />
        </Helmet>
      )}
      {/* Reading Progress Bar */}
      <div 
        className='fixed top-0 left-0 h-1 bg-gradient-to-r from-teal-400 to-blue-500 z-50 transition-all duration-150' 
        style={{ width: `${scrollProgress * 100}%` }}
      />
      <main className='p-3 flex flex-col max-w-6xl mx-auto min-h-screen relative mt-4'>
        {post && (
          <>
            <div className='flex justify-center items-center mt-5 space-x-2 text-teal-500 font-semibold animate-pulse'>
              <span className='h-3 w-3 bg-teal-500 rounded-full inline-block'></span>
              <span>{activeReaders} people are reading this right now</span>
            </div>
            <h1 className='text-3xl mt-5 p-3 text-center font-serif max-w-2xl mx-auto lg:text-4xl'>
              {post.title}
            </h1>
            <div className='flex justify-between items-center w-full max-w-2xl mx-auto'>
              <Link
                to={`/search?category=${post.category}`}
                className='self-center mt-5'
              >
                <Button color='gray' pill size='xs'>
                  {post.category}
                </Button>
              </Link>
              {currentUser && (
                <div className='mt-5 flex gap-4'>
                  <button 
                    onClick={handleSavePost}
                    className='flex items-center gap-2 text-slate-500 hover:text-teal-500 transition-colors'
                  >
                    {isSaved ? <HiBookmark className='w-6 h-6 text-teal-500' /> : <HiOutlineBookmark className='w-6 h-6' />}
                    <span className='text-sm font-medium'>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                  {post.userId && (
                    <Link to={`/chat?userId=${post.userId}`}>
                      <Button size='xs' outline gradientDuoTone='purpleToBlue'>
                        Message Author
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
            <img
              src={post.image}
              alt={post.title}
              loading='lazy'
              className='mt-10 p-3 max-h-[600px] w-full object-cover'
            />
            <div className='flex justify-between p-3 border-b border-slate-500 mx-auto w-full max-w-2xl text-xs'>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span className='italic'>
                {(post.content.length / 1000).toFixed(0)} mins read
              </span>
            </div>

            <div className='max-w-2xl mx-auto w-full p-3 mt-4'>
              <Button 
                gradientDuoTone='purpleToPink' 
                outline 
                onClick={async () => {
                  try {
                    setSummarizing(true);
                    const res = await fetch('/api/ai/summarize', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ content: post.content.replace(/<[^>]+>/g, '') })
                    });
                    const data = await res.json();
                    if (res.ok) setAiSummary(data.summary);
                  } catch (err) {
                    console.log(err);
                  } finally {
                    setSummarizing(false);
                  }
                }}
                disabled={summarizing}
              >
                {summarizing ? <><Spinner size='sm' /> Generating TL;DR...</> : '✨ AI Summarize (TL;DR)'}
              </Button>
              {aiSummary && (
                <div className='mt-4 p-4 border border-teal-500 rounded-lg bg-teal-50 dark:bg-slate-800'>
                  <h3 className='font-bold text-teal-600 mb-2'>✨ AI Summary:</h3>
                  <p className='text-sm italic'>{aiSummary}</p>
                </div>
              )}
            </div>
            <div
              className='p-3 max-w-2xl mx-auto w-full post-content'
              dangerouslySetInnerHTML={{ __html: post.content }}
            ></div>

            {/* Share Section */}
            <div className='max-w-2xl mx-auto w-full p-3 border-t border-slate-500 flex items-center justify-between mt-5'>
              <span className='font-semibold text-gray-500'>Share this diary:</span>
              <div className='flex gap-2'>
                <Button 
                  size='xs' 
                  gradientDuoTone='purpleToBlue' 
                  outline
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                >
                  Copy Link
                </Button>
                <Button 
                  size='xs' 
                  color='blue' 
                  outline
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this travel diary: ${post.title}&url=${window.location.href}`, '_blank')}
                >
                  Twitter
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      <div className='max-w-4xl mx-auto w-full'>
        {/* <CallToAction /> */}
      </div>
      {post && (
        <>
          <CommentSection postId={post._id} />

          <div className='flex flex-col justify-center items-center mb-5'>
            <h1 className='text-xl mt-5 font-semibold text-teal-500'>Related Articles in {post.category}</h1>
            <div className='flex flex-wrap gap-5 mt-5 justify-center'>
              {recentPosts && recentPosts.length > 0 ? (
                recentPosts.map((post) => <PostCard key={post._id} post={post} />)
              ) : (
                <p className='text-gray-500'>No other articles in this category yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
