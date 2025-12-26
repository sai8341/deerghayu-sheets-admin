import React, { useState } from 'react';
import { Menu, X, Leaf, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Treatments', href: '/treatments' },
    { name: 'About Doctor', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-ayur-100 p-2 rounded-full">
                <Leaf className="h-6 w-6 text-ayur-700" />
              </div>
              <span className="font-serif font-bold text-xl text-gray-900 tracking-tight">Sri Deerghayu</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-gray-600 hover:text-ayur-700 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <Link to="/contact">
                <button className="bg-ayur-700 hover:bg-ayur-800 text-white px-5 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2">
                <Phone size={16} /> Book Appointment
                </button>
            </Link>
            <Link to="/admin/login" className="text-xs text-gray-400 hover:text-ayur-600 font-medium">
              Staff Login
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-ayur-700 hover:bg-ayur-50"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
                to="/admin/login"
                className="block px-3 py-2 mt-4 text-center text-ayur-700 font-medium border border-ayur-200 rounded-md"
                onClick={() => setIsOpen(false)}
            >
                Staff Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};