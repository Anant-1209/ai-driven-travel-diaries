import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
import { HiBell, HiChevronDown, HiMenu, HiX } from 'react-icons/hi';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';
import { signoutSuccess } from '../redux/user/userSlice';
import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Avatar, Dropdown } from 'flowbite-react';

const DESTINATIONS_MENU = {
  trending: ['Rann of Kutch', 'Leh-Ladakh', 'Goa', 'Rishikesh'],
  'North India': ['Shimla', 'Leh-Ladakh', 'Rishikesh', 'Varanasi'],
  'South India': ['Munnar', 'Hampi', 'Andaman'],
  'West India': ['Goa', 'Rann of Kutch', 'Jaipur'],
};

const SLUG_MAP = {
  'Rann of Kutch': 'great-white-desert-rann-of-kutch',
  'Leh-Ladakh': 'leh-ladakh-journey-to-high-passes',
  'Goa': 'sunny-days-sandy-beaches-goa',
  'Rishikesh': 'rishikesh-yoga-adventure-spirituality',
  'Shimla': 'winter-wonderland-visit-to-shimla',
  'Varanasi': 'varanasi-spiritual-heart-india',
  'Munnar': 'misty-tea-gardens-of-munnar',
  'Hampi': 'hampi-walking-through-ancient-ruins',
  'Andaman': 'island-paradise-andaman-nicobar',
  'Jaipur': 'exploring-pink-city-jaipur',
  'Taj Mahal': 'eternal-beauty-of-taj-mahal',
  'Darjeeling': 'darjeeling-tea-toy-trains-mountain-peaks',
};

export default function Header() {
  const path = useLocation().pathname;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDestOpen, setMobileDestOpen] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('notification', (data) => {
        setNotifications((prev) => [data, ...prev]);
      });
      return () => socket.off('notification');
    }
  }, [socket]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  const handleSignout = async () => {
    try {
      const res = await fetch('/api/user/signout', { 
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) dispatch(signoutSuccess());
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchTerm', searchTerm);
    navigate(`/search?${urlParams.toString()}`);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Stories', path: '/search' },
    { name: 'AI Planner', path: '/ai-planner', icon: '✨' },
    { name: 'About', path: '/about' },
  ];

  return (
    <header className='sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>

          {/* Logo */}
          <Link to='/' className='flex items-center gap-2 shrink-0'>
            <span className='text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white'>
              Travel<span className='text-teal-600'>Diaries</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex items-center gap-1'>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  path === link.path
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.icon && <span className='mr-1'>{link.icon}</span>}
                {link.name}
              </Link>
            ))}

            {/* Destinations Mega Menu Trigger */}
            <div className='mega-menu-trigger relative'>
              <Link
                to='/projects'
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  path === '/projects'
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Destinations
                <HiChevronDown className='h-4 w-4' />
              </Link>

              {/* Mega Menu Dropdown */}
              <div className='mega-menu absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6'>
                <div className='grid grid-cols-3 gap-6'>
                  {Object.entries(DESTINATIONS_MENU).map(([region, places]) => (
                    <div key={region}>
                      <Link 
                        to={`/search?searchTerm=${region}`}
                        className='text-xs font-bold tracking-widest uppercase text-teal-600 dark:text-teal-400 mb-3 hover:underline'
                      >
                        {region}
                      </Link>
                      <ul className='space-y-2 mt-2'>
                        {places.map((place) => (
                          <li key={place}>
                            <Link
                              to={`/post/${SLUG_MAP[place] || '#'}`}
                              className='text-sm text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors block py-0.5 border-b border-slate-100 dark:border-slate-800 pb-1'
                            >
                              {place}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className='mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 text-center'>
                  <Link
                    to='/destinations'
                    className='text-xs font-semibold tracking-widest uppercase text-teal-600 hover:text-teal-700 transition-colors'
                  >
                    View All Destinations →
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Actions */}
          <div className='flex items-center gap-2'>
            {/* Desktop Search */}
            <form onSubmit={handleSubmit} className='hidden md:flex items-center'>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-40 focus:w-56 transition-all duration-300 px-4 py-2 pl-9 text-sm rounded-full bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
                />
                <AiOutlineSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
              </div>
            </form>

            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className='p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              aria-label='Toggle theme'
            >
              {theme === 'light' ? <FaSun className='h-4 w-4' /> : <FaMoon className='h-4 w-4' />}
            </button>

            {/* Notifications */}
            {currentUser && (
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className='relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'>
                    <HiBell className='h-5 w-5' />
                    {notifications.length > 0 && (
                      <span className='absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold'>
                        {notifications.length}
                      </span>
                    )}
                  </div>
                }
              >
                <Dropdown.Header>Notifications</Dropdown.Header>
                {notifications.length === 0 ? (
                  <Dropdown.Item>No new notifications</Dropdown.Item>
                ) : (
                  notifications.map((notif, idx) => (
                    <Dropdown.Item key={idx}>
                      <Link to={`/post/${notif.postId}`}>{notif.message}</Link>
                    </Dropdown.Item>
                  ))
                )}
                {notifications.length > 0 && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => setNotifications([])} className='text-center text-teal-500'>
                      Clear All
                    </Dropdown.Item>
                  </>
                )}
              </Dropdown>
            )}

            {/* User Avatar / Sign In */}
            {currentUser ? (
              <Dropdown
                arrowIcon={false}
                inline
                label={<Avatar alt='user' img={currentUser.profilePicture} rounded size='sm' />}
              >
                <Dropdown.Header>
                  <span className='block text-sm font-semibold'>@{currentUser.username}</span>
                  <span className='block text-xs text-slate-500 truncate'>{currentUser.email}</span>
                </Dropdown.Header>
                <Link to='/dashboard?tab=profile'>
                  <Dropdown.Item>Profile</Dropdown.Item>
                </Link>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleSignout}>Sign out</Dropdown.Item>
              </Dropdown>
            ) : (
              <Link
                to='/sign-in'
                className='px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-full transition-colors'
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='lg:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              aria-label='Toggle menu'
            >
              {mobileMenuOpen ? <HiX className='h-6 w-6' /> : <HiMenu className='h-6 w-6' />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className='lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-1'>
          {/* Mobile Search */}
          <form onSubmit={handleSubmit} className='mb-3'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search destinations...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-4 py-3 pl-10 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500'
              />
              <AiOutlineSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400' />
            </div>
          </form>

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                path === link.path
                  ? 'text-teal-600 bg-teal-50 dark:bg-teal-900/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {link.icon && <span className='mr-2'>{link.icon}</span>}
              {link.name}
            </Link>
          ))}

          {/* Mobile Destinations Accordion */}
          <div>
            <button
              onClick={() => setMobileDestOpen(!mobileDestOpen)}
              className='flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800'
            >
              Destinations
              <HiChevronDown className={`h-4 w-4 transition-transform ${mobileDestOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileDestOpen && (
              <div className='pl-6 space-y-1 pb-2'>
                {Object.entries(DESTINATIONS_MENU).map(([region, places]) => (
                  <div key={region} className='mb-2'>
                    <Link
                      to={`/search?searchTerm=${region}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className='text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 py-1 hover:underline'
                    >
                      {region}
                    </Link>
                    {places.map((place) => (
                      <Link
                        key={place}
                        to={`/post/${SLUG_MAP[place] || '#'}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className='block px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600'
                      >
                        {place}
                      </Link>
                    ))}
                  </div>
                ))}
                <Link
                  to='/destinations'
                  onClick={() => setMobileMenuOpen(false)}
                  className='block px-3 py-2 text-xs font-bold uppercase text-teal-600'
                >
                  View All Destinations →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
