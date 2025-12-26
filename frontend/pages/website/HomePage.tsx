import React from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { ArrowRight, Star, Calendar, Shield, Activity, Leaf, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative bg-ayur-50 py-20 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-ayur-200 opacity-20 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-ayur-100 text-ayur-800 font-semibold text-sm mb-6">
                Holistic Healing & Wellness
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight mb-6">
                Restore Balance with Ancient Ayurveda
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Sri Deerghayu Ayurvedic Hospital combines traditional wisdom with modern diagnostics to provide personalized care for chronic ailments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact">
                    <button className="bg-ayur-700 hover:bg-ayur-800 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Book Appointment <ArrowRight size={18} />
                    </button>
                </Link>
                <Link to="/treatments">
                    <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-3 rounded-lg font-medium transition-colors">
                    Explore Treatments
                    </button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://picsum.photos/600/500" 
                alt="Ayurvedic Treatment" 
                className="rounded-2xl shadow-2xl z-10 relative"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl z-20 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <span className="font-bold text-gray-900">4.9/5</span>
                </div>
                <p className="text-sm text-gray-600">"Dr. Rao cured my chronic back pain in just 3 weeks. Highly recommended!"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Why Choose Sri Deerghayu?</h2>
            <p className="text-gray-600">We don't just treat the disease; we treat the patient. Our holistic approach ensures long-term well-being.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Certified Doctors', desc: 'Expert practitioners with 15+ years of experience in Nadi Pariksha and Panchakarma.' },
              { icon: Leaf, title: 'Authentic Medicine', desc: 'We prepare our own medicines using pure herbs sourced directly from organic farms.' },
              { icon: Activity, title: 'Modern Diagnostics', desc: 'We integrate modern lab reports with Ayurvedic pulse diagnosis for accurate root-cause analysis.' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-gray-100 hover:border-ayur-200 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-ayur-50 rounded-lg flex items-center justify-center text-ayur-600 mb-6 group-hover:bg-ayur-600 group-hover:text-white transition-colors">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12 border-b border-gray-800 pb-12">
                <div>
                    <h4 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                        <Leaf className="text-ayur-400" /> Sri Deerghayu
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Dedicated to bringing the ancient wisdom of Ayurveda to the modern world with compassion and integrity.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><Link to="/about" className="hover:text-ayur-400">About Us</Link></li>
                        <li><Link to="/treatments" className="hover:text-ayur-400">Our Treatments</Link></li>
                        <li><Link to="/contact" className="hover:text-ayur-400">Book Appointment</Link></li>
                        <li><Link to="/admin/login" className="hover:text-ayur-400">Staff Portal</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4">Contact Us</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex gap-3">
                            <Phone size={18} className="text-ayur-400 shrink-0" />
                            <span>+91 98765 43210</span>
                        </li>
                        <li className="flex gap-3">
                            <Calendar size={18} className="text-ayur-400 shrink-0" />
                            <span>Mon - Sat: 9:00 AM - 7:00 PM<br/>Sunday: 9:00 AM - 1:00 PM</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Sri Deerghayu Ayurvedic Hospital. All rights reserved.
            </div>
        </div>
      </footer>
    </div>
  );
};