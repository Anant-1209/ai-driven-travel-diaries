import { Link } from 'react-router-dom';
import { BsInstagram, BsTwitterX, BsYoutube, BsLinkedin } from 'react-icons/bs';

export default function FooterCom() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Destinations',
      links: [
        { name: 'Rajasthan', href: '/search?category=adventure' },
        { name: 'Kerala', href: '/post/misty-tea-gardens-of-munnar' },
        { name: 'Himachal Pradesh', href: '/post/winter-wonderland-visit-to-shimla' },
        { name: 'Goa', href: '/post/sunny-days-sandy-beaches-goa' },
        { name: 'View All', href: '/destinations' },
      ],
    },
    {
      title: 'Travel Resources',
      links: [
        { name: 'AI Trip Planner', href: '/ai-planner' },
        { name: 'Latest Stories', href: '/search' },
        { name: 'Travel Tips', href: '/search?category=adventure' },
        { name: 'Budget Guides', href: '/search' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/about' },
        { name: 'Write For Us', href: '/about' },
        { name: 'Careers', href: '/about' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Cookie Policy', href: '#' },
        { name: 'Accessibility', href: '#' },
      ],
    },
  ];

  const socialLinks = [
    { icon: BsInstagram, href: '#', label: 'Instagram' },
    { icon: BsTwitterX, href: '#', label: 'Twitter' },
    { icon: BsYoutube, href: '#', label: 'YouTube' },
    { icon: BsLinkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className='bg-slate-900 text-slate-400'>
      {/* Main Footer */}
      <div className='max-w-7xl mx-auto px-4 py-16'>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-8'>
          {/* Brand Column */}
          <div className='col-span-2 md:col-span-1'>
            <Link to='/' className='inline-block mb-4'>
              <span className='text-2xl font-extrabold text-white tracking-tight'>
                Travel<span className='text-teal-500'>Diaries</span>
              </span>
            </Link>
            <p className='text-sm leading-relaxed mb-6'>
              Discover breathtaking destinations, AI-powered itineraries, and real stories from explorers across India.
            </p>
            {/* Social Icons */}
            <div className='flex gap-3'>
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className='w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-teal-500 hover:bg-teal-500/10 transition-all'
                >
                  <social.icon className='h-4 w-4' />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className='text-xs font-bold tracking-widest uppercase text-slate-300 mb-4'>
                {section.title}
              </h4>
              <ul className='space-y-2.5'>
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className='text-sm text-slate-500 hover:text-teal-400 transition-colors'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className='border-t border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='text-xs text-slate-600 text-center sm:text-left'>
            <p>
              © {currentYear} Travel Diaries™ — Beyond Horizons. All rights reserved.
            </p>
            <p className='mt-1'>
              No part of this site may be reproduced without written permission.
            </p>
          </div>
          <div className='flex items-center gap-4 text-xs text-slate-600'>
            <Link to='#' className='hover:text-slate-400 transition-colors'>Privacy</Link>
            <span>·</span>
            <Link to='#' className='hover:text-slate-400 transition-colors'>Terms</Link>
            <span>·</span>
            <Link to='#' className='hover:text-slate-400 transition-colors'>Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
