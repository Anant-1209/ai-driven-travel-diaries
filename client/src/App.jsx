import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateSuccess, signoutSuccess } from './redux/user/userSlice';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import OnlyAdminPrivateRoute from './components/OnlyAdminPrivateRoute';
import GlobalNotification from './components/GlobalNotification';
import ScrollToTop from './components/ScrollToTop';
import AIChatbot from './components/AIChatbot';
import { Spinner } from 'flowbite-react';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const SignIn = lazy(() => import('./pages/SignIn'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const SignUp = lazy(() => import('./pages/SignUp'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const UpdatePost = lazy(() => import('./pages/UpdatePost'));
const PostPage = lazy(() => import('./pages/PostPage'));
const Search = lazy(() => import('./pages/Search'));
const AIPlanner = lazy(() => import('./pages/AIPlanner'));
const Chat = lazy(() => import('./pages/Chat'));

export default function App() {
  const dispatch = useDispatch();
  const currentUserId = useSelector((state) => state.user.currentUser?._id);

  // The stored user can be stale (role changed, session expired); refresh it from the server.
  useEffect(() => {
    if (!currentUserId) return;
    fetch('/api/user/me')
      .then(async (res) => {
        if (res.ok) dispatch(updateSuccess(await res.json()));
        else if (res.status === 401) dispatch(signoutSuccess());
      })
      .catch(() => {});
  }, [currentUserId, dispatch]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <GlobalNotification />
      <Header />
      <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Spinner size="xl" /></div>}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/sign-in' element={<SignIn />} />
          <Route path='/sign-up' element={<SignUp />} />
          <Route path='/search' element={<Search />} />
          <Route element={<PrivateRoute />}>
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/chat' element={<Chat />} />
          </Route>
          <Route element={<OnlyAdminPrivateRoute />}>
            <Route path='/create-post' element={<CreatePost />} />
            <Route path='/update-post/:postId' element={<UpdatePost />} />
          </Route>
          <Route path='/destinations' element={<Projects />} />
          <Route path='/post/:postSlug' element={<PostPage />} />
          <Route path='/ai-planner' element={<AIPlanner />} />
        </Routes>
      </Suspense>
      <AIChatbot />
      <Footer />
    </BrowserRouter>
  );
}
