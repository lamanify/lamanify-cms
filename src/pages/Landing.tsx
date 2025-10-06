import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Calendar, 
  Star, 
  Users, 
  TrendingUp, 
  Shield, 
  Smartphone,
  BarChart3,
  MessageCircle,
  Award,
  Clock,
  Target,
  Zap,
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const Landing = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    websiteUrl: '',
    requirements: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const features = [
    { icon: <Calendar className="h-6 w-6" />, text: "21 Days Completion" },
    { icon: <Shield className="h-6 w-6" />, text: "KKLIU Compliance" },
    { icon: <TrendingUp className="h-6 w-6" />, text: "Search Engine Optimization (SEO)" }
  ];

  const services = [
    {
      icon: <Globe className="h-12 w-12 text-blue-600" />,
      title: "SEO-First Websites",
      description: "Professional healthcare websites built to rank on Google from day one, ensuring your clinic gets found by patients searching online."
    },
    {
      icon: <Target className="h-12 w-12 text-green-600" />,
      title: "Google Ads Management", 
      description: "Targeted advertising campaigns that bring qualified patients to your clinic, with full compliance to Malaysian healthcare regulations."
    },
    {
      icon: <Zap className="h-12 w-12 text-purple-600" />,
      title: "Marketing Automation",
      description: "Smart systems that nurture leads, send appointment reminders, and keep patients engaged - all while you focus on providing care."
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-orange-600" />,
      title: "Performance Analytics",
      description: "Data-driven insights that show exactly how your marketing efforts translate to new patients and clinic growth."
    }
  ];

  const portfolio = [
    {
      name: "Dr. Ahmad Family Clinic",
      type: "General Practice",
      result: "300% increase in online appointments",
      location: "Kuala Lumpur"
    },
    {
      name: "Smile Dental Centre",
      type: "Dental Clinic",
      result: "250% growth in new patients",
      location: "Penang"
    },
    {
      name: "Wellness Specialist Clinic",
      type: "Specialist Clinic", 
      result: "400% increase in online visibility",
      location: "Johor Bahru"
    }
  ];

  const testimonials = [
    {
      quote: "Lamanify transformed our online presence completely. We went from 5 online appointments per week to over 30. Their SEO strategy really works!",
      author: "Dr. Sarah Lim",
      clinic: "Family Health Clinic, KL",
      rating: 5
    },
    {
      quote: "The Google Ads campaign brought us qualified leads from day one. Professional service with real results that we can see in our appointment book.",
      author: "Dr. Raj Patel",
      clinic: "Dental Care Centre, Penang", 
      rating: 5
    },
    {
      quote: "Finally, a marketing agency that understands healthcare compliance. They delivered everything on time and our patient inquiries tripled!",
      author: "Dr. Wong Wei Ming",
      clinic: "Specialist Medical Centre, JB",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-2xl font-bold text-gray-900">Lamanify</span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium">Home</a>
              <a href="#portfolio" className="text-gray-700 hover:text-blue-600 font-medium">Portfolio</a>
              <a href="#services" className="text-gray-700 hover:text-blue-600 font-medium">Services</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link 
                to="/product" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Try LamaniHub CRM
              </Link>
              <a 
                href="#contact" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                View Package
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  HEALTHCARE DIGITAL MARKETING AGENCY MALAYSIA
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                We Grow Clinic's Brand{' '}
                <span className="text-blue-600">Online.</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Drive measurable patient growth with SEO-first websites, Google Ads, and automations 
                built for results—so your clinic fills more appointments, not just inboxes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a 
                  href="#portfolio" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center"
                >
                  View Portfolio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <a 
                  href="#contact" 
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center"
                >
                  View Package
                </a>
              </div>
              
              <div className="flex flex-wrap gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <div className="text-green-600 mr-2">
                      {feature.icon}
                    </div>
                    <span className="font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Request Quote</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="+60 12-345 6789"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Your clinic name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="https://yourclinic.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What are your requirements?
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    rows={4}
                    maxLength={180}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                    placeholder="Tell us about your marketing goals..."
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.requirements.length} / 180
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg"
                >
                  Request Quote
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Healthcare Marketing Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive digital marketing solutions designed specifically for Malaysian healthcare providers
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-6">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Real results from Malaysian healthcare providers we've helped grow
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {portfolio.map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border hover:shadow-xl transition-shadow">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                    <Heart className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                  <p className="text-blue-600 font-medium">{item.type}</p>
                  <p className="text-sm text-gray-600">{item.location}</p>
                </div>
                <div className="border-t pt-6">
                  <p className="text-2xl font-bold text-green-600">{item.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600">
              Hear from healthcare providers across Malaysia
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.author}</div>
                  <div className="text-blue-600">{testimonial.clinic}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Grow Your Clinic's Online Presence?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of Malaysian healthcare providers who trust Lamanify to grow their practice online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#contact" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg"
            >
              Get Your Free Consultation
            </a>
            <Link 
              to="/product" 
              className="border border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg"
            >
              Try LamaniHub CRM Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold">Lamanify</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Lamanify is a healthcare performance marketing agency focused on driving 
                growth for healthcare providers in Malaysia.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-gray-400">
                  <MapPin className="h-5 w-5 mr-3 text-blue-400" />
                  <span>Level 23-1, Premier Suite, One Mont Kiara, Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Mail className="h-5 w-5 mr-3 text-blue-400" />
                  <a href="mailto:admin@lamanify.com" className="hover:text-white">admin@lamanify.com</a>
                </div>
                <div className="flex items-center text-gray-400">
                  <Phone className="h-5 w-5 mr-3 text-blue-400" />
                  <a href="tel:+60115706510" className="hover:text-white">+6011-5670 6510</a>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-6">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#home" className="hover:text-white">Home</a></li>
                <li><a href="#portfolio" className="hover:text-white">Portfolio</a></li>
                <li><a href="#services" className="hover:text-white">Services</a></li>
                <li><Link to="/product" className="hover:text-white">LamaniHub CRM</Link></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-6">Links</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                Copyrights © 2025 Lamanify Sdn. Bhd. (1605252-U) All Rights Reserved.
              </p>
              <div className="mt-4 md:mt-0">
                <a 
                  href="https://wa.me/60115706510" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;