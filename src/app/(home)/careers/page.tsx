import React from 'react';
import { 
  FiTwitter, 
  FiInstagram, 
  FiLinkedin, 
  FiYoutube,
  FiHome,
  FiUser,
  FiDollarSign,
  FiGrid,
  FiFileText,
  FiBook,
  FiHelpCircle,
  FiBookOpen,
  FiCalendar,
  FiBell,
  FiAward,
  FiMessageSquare,
  FiShield,
  FiRss,
  FiArrowRight
} from 'react-icons/fi';
import { FaFacebookF } from 'react-icons/fa';
import { HiOutlineLightningBolt, HiOutlinePuzzle, HiOutlineSupport } from 'react-icons/hi';
import { RiTeamLine } from 'react-icons/ri';

const CareerPage = () => {
  const year = new Date().getFullYear();
  
  const positions = [
    { title: "UX Designer", featured: false },
    { title: "Motion Designer", featured: true },
    { title: "iOS Developer", featured: false },
    { title: "Product Designer", featured: false },
    { title: "UX Researcher", featured: false },
    { title: "Project Manager", featured: false }
  ];

  const values = [
    {
      icon: <RiTeamLine className="text-2xl text-indigo-600" />,
      title: "Leadership",
      description: "Build your beautiful agency website with us that converts more visitors than any other website."
    },
    {
      icon: <FiMessageSquare className="text-2xl text-indigo-600" />,
      title: "Communication",
      description: "Build your beautiful agency website with us that converts more visitors than any other website."
    },
    {
      icon: <HiOutlineLightningBolt className="text-2xl text-indigo-600" />,
      title: "Commitment",
      description: "Build your beautiful agency website with us that converts more visitors than any other website."
    }
  ];

  const footerLinks = [
    {
      title: "Pagedone",
      links: [ 
        { name: "Home", icon: <FiHome className="mr-2" /> },
        { name: "About", icon: <FiUser className="mr-2" /> },
        { name: "Pricing", icon: <FiDollarSign className="mr-2" /> },  
        { name: "Features", icon: <FiGrid className="mr-2" /> }
      ]
    },
    {
      title: "Products",
      links: [ 
        { name: "Figma UI System", icon: <FiGrid className="mr-2" /> },
        { name: "Icons Assets", icon: <FiAward className="mr-2" /> },
        { name: "Responsive Blocks", icon: <HiOutlinePuzzle className="mr-2" /> },
        { name: "Components Library", icon: <FiGrid className="mr-2" /> }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "FAQs", icon: <FiHelpCircle className="mr-2" /> },
        { name: "Quick Start", icon: <HiOutlineLightningBolt className="mr-2" /> },
        { name: "Documentation", icon: <FiBookOpen className="mr-2" /> },
        { name: "User Guide", icon: <FiBook className="mr-2" /> }
      ]
    },
    {
      title: "Blogs",
      links: [
        { name: "News", icon: <FiRss className="mr-2" /> },
        { name: "Tips & Tricks", icon: <FiAward className="mr-2" /> },
        { name: "New Updates", icon: <FiBell className="mr-2" /> },
        { name: "Events", icon: <FiCalendar className="mr-2" /> }
      ]
    }
  ];

  return (
    <div className="bg-white text-gray-900">
      {/* Navigation */}
      <nav className="py-5 px-4 md:px-14 lg:px-28 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-indigo-600">Seedspike</span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-indigo-600">Home</a>
            <a href="#" className="text-gray-700 hover:text-indigo-600">About us</a>
            
            <div className="relative group">
              <button className="flex items-center text-gray-700 hover:text-indigo-600">
                Products <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-lg p-4 w-64 mt-2">
                <h6 className="font-medium text-gray-900 mb-2">Features</h6>
                <a href="#" className="block py-2 hover:text-indigo-600">Notification</a>
                <a href="#" className="block py-2 hover:text-indigo-600">Analytics</a>
                <a href="#" className="block py-2 hover:text-indigo-600">Integrations</a>
              </div>
            </div>
            
            <div className="relative group">
              <button className="flex items-center text-gray-700 hover:text-indigo-600">
                Features <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-lg p-4 w-64 mt-2">
                <h6 className="font-medium text-gray-900 mb-2">Features</h6>
                <a href="#" className="block py-2 hover:text-indigo-600">Security</a>
                <a href="#" className="block py-2 hover:text-indigo-600">Documentation</a>
                <a href="#" className="block py-2 hover:text-indigo-600">Support</a>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-4">
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700">Login</button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800">Sign up</button>
          </div>
          
          <button className="lg:hidden text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="py-12 px-4 md:px-14 lg:px-28 text-center">
        <span className="inline-block bg-emerald-100 text-emerald-600 text-sm font-medium px-3 py-1 rounded-full mb-4">
          Careers at Seedspike
        </span>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Unlock new career opportunities at Seedspike
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Seedspike embraces a youthful and flexible spirit, enabling us to swiftly adapt to market research, conditions, and customer demands through our advanced technology.
        </p>
      </div>

      {/* Open Positions */}
      <div className="py-12 px-4 md:px-14 lg:px-28 bg-gray-50">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Open positions</h2>
        
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
          {positions.map((position, index) => (
            <div 
              key={index} 
              className={`flex justify-between items-center py-4 ${index !== positions.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <h3 className={`text-lg font-medium ${position.featured ? 'text-indigo-600' : 'text-gray-900'}`}>
                {position.title}
              </h3>
              <button className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100">
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="py-12 px-4 md:px-14 lg:px-28">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-5">
          Seedspike thrives on a spirit of agility
        </h3>
        <p className="text-lg text-gray-500 text-center max-w-3xl mx-auto mb-12">
          We want to provide a user friendly experience with the eyes capture design and develop product quickly with the ability to solve user problems.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <div 
              key={index} 
              className="p-6 hover:shadow-md hover:rounded-xl transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                {value.icon}
              </div>
              <h4 className="text-lg font-semibold mb-2">{value.title}</h4>
              <p className="text-sm text-gray-500">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 px-4 md:px-14 lg:px-28 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl mx-4 md:mx-14 lg:mx-28 my-12">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:mb-0 mb-8 text-center lg:text-left">
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              Don&apos;t see the role you&apos;re interested in?
            </h3>
            <p className="text-indigo-100">
              We&apos;re always looking for talented people to join our team. Send us your CV and we will contact you for any future roles.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-full flex items-center whitespace-nowrap">
            Send Your CV <FiArrowRight className="ml-2" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 pt-12 pb-8 px-4 md:px-14 lg:px-28">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="col-span-2 mb-8 lg:mb-0">
            <div className="text-2xl font-bold text-indigo-600 mb-4">Seedspike</div>
            <p className="text-gray-500 text-sm mb-6">
              Trusted in more than 100 countries & 5 million customers. Have any query?
            </p>
            <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-full hover:bg-indigo-700">
              Contact us
            </button>
          </div>
          
          {footerLinks.map((section, index) => (
            <div key={index} className="mb-8 md:mb-0">
              <h4 className="text-lg font-medium mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="#" className="flex items-center text-sm text-gray-600 hover:text-indigo-600">
                      {link.icon} {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              © Seedspike {year}, All rights reserved.
            </p>
            
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-indigo-600">
                <FiTwitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-indigo-600">
                <FaFacebookF className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-indigo-600">
                <FiLinkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-indigo-600">
                <FiInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-indigo-600">
                <FiYoutube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CareerPage;