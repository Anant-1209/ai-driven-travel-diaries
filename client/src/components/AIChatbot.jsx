import { useState } from 'react';
import { Button, TextInput, Spinner } from 'flowbite-react';
import { HiChat } from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function AIChatbot() {
  const { currentUser } = useSelector((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hi! I am WanderBot. Where are we going today?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = message;
    setChatHistory([...chatHistory, { role: 'user', text: userMsg }]);
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory((prev) => [...prev, { role: 'ai', text: data.reply }]);
      } else {
        const errorMsg = data.message?.error?.message || data.message || 'Something went wrong. Please try again.';
        if (errorMsg.includes('high demand')) {
          setChatHistory((prev) => [...prev, { role: 'ai', text: 'Sorry, I am a bit overwhelmed right now! 🤖 Please try asking again in a few seconds.' }]);
        } else {
          setChatHistory((prev) => [...prev, { role: 'ai', text: 'I hit a snag. Could you try that again?' }]);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed bottom-5 right-5 z-50'>
      {!isOpen && (
        <Button pill gradientDuoTone='purpleToPink' size='xl' onClick={() => setIsOpen(true)}>
          <HiChat className='h-6 w-6' />
        </Button>
      )}

      {isOpen && (
        <div className='w-80 h-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl flex flex-col border border-teal-500 overflow-hidden'>
          <div className='bg-teal-500 text-white p-3 font-bold flex justify-between'>
            <span>WanderBot 🤖</span>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>
          
          <div className='flex-1 p-3 overflow-y-auto flex flex-col gap-2'>
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 self-end' : 'bg-gray-100 dark:bg-slate-700 self-start'}`}>
                <ReactMarkdown className='prose prose-sm dark:prose-invert max-w-none'>{msg.text}</ReactMarkdown>
              </div>
            ))}
            {loading && <Spinner size='sm' className='self-start' />}
          </div>

          {currentUser ? (
            <form onSubmit={handleSend} className='p-2 bg-gray-50 dark:bg-slate-900 flex gap-2'>
              <TextInput
                sizing='sm'
                className='flex-1'
                placeholder='Ask a travel question...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button size='sm' type='submit' gradientDuoTone='purpleToPink' disabled={loading}>Send</Button>
            </form>
          ) : (
            <div className='p-4 bg-gray-50 dark:bg-slate-900 text-center'>
              <p className='text-xs text-slate-500 mb-2'>Please sign in to chat with me!</p>
              <Link to='/sign-in' className='text-xs font-bold text-teal-600 hover:underline'>Sign In →</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
