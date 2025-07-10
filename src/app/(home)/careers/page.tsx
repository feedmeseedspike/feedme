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

    </div>
  );
};

export default CareerPage;