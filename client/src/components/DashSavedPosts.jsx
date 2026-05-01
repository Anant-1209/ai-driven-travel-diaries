import { Table, Button } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function DashSavedPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user/getSavedPosts/${currentUser._id}`);
        const data = await res.json();
        if (res.ok) {
          setSavedPosts(data);
        }
        setLoading(false);
      } catch (error) {
        console.log(error.message);
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchSavedPosts();
    }
  }, [currentUser._id]);

  const handleUnsavePost = async (postId) => {
    try {
      const res = await fetch(`/api/user/savePost/${postId}`, {
        method: 'POST',
      });
      if (res.ok) {
        setSavedPosts((prev) => prev.filter((post) => post._id !== postId));
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  if (loading) return <div className='flex justify-center items-center min-h-screen'>Loading...</div>;

  return (
    <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      {savedPosts.length > 0 ? (
        <>
          <Table hoverable className='shadow-md'>
            <Table.Head>
              <Table.HeadCell>Date saved</Table.HeadCell>
              <Table.HeadCell>Post image</Table.HeadCell>
              <Table.HeadCell>Post title</Table.HeadCell>
              <Table.HeadCell>Category</Table.HeadCell>
              <Table.HeadCell>Action</Table.HeadCell>
            </Table.Head>
            {savedPosts.map((post) => (
              <Table.Body className='divide-y' key={post._id}>
                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                  <Table.Cell>
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/post/${post.slug}`}>
                      <img
                        src={post.image}
                        alt={post.title}
                        className='w-20 h-10 object-cover bg-gray-500'
                      />
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      className='font-medium text-gray-900 dark:text-white'
                      to={`/post/${post.slug}`}
                    >
                      {post.title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{post.category}</Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => handleUnsavePost(post._id)}
                      className='font-medium text-red-500 hover:underline cursor-pointer'
                    >
                      Unsave
                    </span>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            ))}
          </Table>
        </>
      ) : (
        <div className='flex flex-col items-center justify-center mt-10'>
          <p className='text-gray-500 text-xl mb-4'>You haven't saved any diaries yet.</p>
          <Link to='/search'>
            <Button gradientDuoTone='purpleToBlue' outline>
              Explore Diaries
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
