import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Calendar, MessageCircle, Shield, BarChart3, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductFormData {
  email: string;
  clinicName: string;
  subdomain: string;
}

export default function ProductPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    email: '',
    clinicName: '',
    subdomain: ''
  });

  const features = [
    {
      icon: Users,
      title: "Patient Management",
      description: "Complete patient records with medical history, contact details, and PDPA-compliant data storage."
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integration",
      description: "Instant patient communication with click-to-chat functionality and automated appointment reminders."
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Advanced appointment booking system with calendar sync and automated patient notifications."
    },
    {
      icon: Shield,
      title: "PDPA Compliant",
      description: "Secure, compliant patient data handling designed specifically for Malaysian healthcare regulations."
    },
    {
      icon: BarChart3,
      title: "Professional Reports",
      description: "Patient analytics, appointment insights, and comprehensive clinic performance metrics."
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Priority support for Malaysian clinics with local timezone coverage and healthcare expertise."
    }
  ];

  const testimonials = [
    {
      quote: "LamaniHub transformed our patient management. We save 3 hours daily on administrative tasks and our patients love the WhatsApp appointment reminders.",
      author: "Dr. Sarah Ahmad",
      clinic: "Ahmad Family Clinic, Kuala Lumpur",
      rating: 5
    },
    {
      quote: "The PDPA compliance features gave us confidence in patient data security. Setup was smooth and the system is intuitive for our clinic staff.",
      author: "Dr. Raj Patel", 
      clinic: "Dental Care Centre, Penang",
      rating: 5
    },
    {
      quote: "Best CRM investment we've made. The appointment scheduling and patient communication features have improved our clinic efficiency significantly.",
      author: "Dr. Lim Wei Ming",
      clinic: "Specialist Medical Centre, Johor Bahru", 
      rating: 5
    }
  ];

  const handleStartTrial = () => {
    navigate('/pricing');
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LH</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">LamaniHub</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={handleStartTrial} className="bg-blue-600 hover:bg-blue-700">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-blue-200 text-blue-800 mb-6">
                🚀 Trusted by 500+ Malaysian Clinics
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                The Complete CRM Built for 
                <span className="text-blue-200"> Malaysian Clinics</span>
              </h1>
              
              <p className="text-xl mb-8 text-blue-100">
                Manage patients, appointments, and communications in one PDPA-compliant platform. 
                Designed specifically for GP, dental, specialist, and wellness clinics.
              </p>
              
              <div className="bg-white text-blue-900 p-6 rounded-xl shadow-2xl mb-8">
                <div className="flex items-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-2xl font-bold">14-Day FREE Trial</h3>
                </div>
                <p className="text-lg mb-4">Full access to all features - no credit card required</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-green-600">FREE</span>
                  <span className="text-lg text-gray-600 ml-2">for 14 days, then RM49/month</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-xl px-8 py-4"
                  onClick={handleStartTrial}
                >
                  Start Free Trial Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                  onClick={() => navigate('/demo')}
                >
                  Watch Demo
                </Button>
              </div>
              
              <p className="text-sm text-blue-200 mt-4">
                ✓ No setup fees ✓ Cancel anytime ✓ PDPA compliant ✓ Malaysian support
              </p>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-xl shadow-2xl p-6 transform rotate-1">
                <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                    <p>Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything Your Clinic Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional healthcare management tools designed specifically for Malaysian clinics, 
              from small family practices to large specialist centers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Malaysian Healthcare Providers
            </h2>
            <p className="text-xl text-gray-600">
              See how clinics across Malaysia are improving patient care with LamaniHub
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-6 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t pt-4">
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.clinic}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-gray-600">Malaysian Clinics</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">50,000+</div>
                <div className="text-gray-600">Patients Managed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <div className="text-gray-600">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-gray-600">Local Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              One plan, all features. No hidden fees or setup costs.
            </p>
          </div>
          
          <Card className="max-w-md mx-auto shadow-2xl border-2 border-blue-200">
            <div className="relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2">
                🎁 14-Day FREE Trial
              </Badge>
            </div>
            
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-3xl font-bold text-gray-900">
                LamaniHub Professional
              </CardTitle>
              <CardDescription className="text-lg">
                Complete healthcare CRM for Malaysian clinics
              </CardDescription>
              
              <div className="py-6">
                <div className="text-5xl font-bold text-blue-600 mb-2">RM49</div>
                <div className="text-lg text-gray-600">/month per clinic</div>
                <div className="text-sm text-green-600 font-medium mt-2">
                  💡 Start with 14 days completely FREE
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center mb-6">
                <h4 className="font-semibold text-lg mb-4">Everything included:</h4>
                <div className="grid grid-cols-1 gap-3 text-left">
                  {[
                    'Unlimited patient records',
                    'WhatsApp integration',
                    'Appointment scheduling',
                    'Queue management',
                    'Medical records storage',
                    'Professional reports',
                    'Multi-user access',
                    'PDPA compliance',
                    'Cloud backup & security',
                    '24/7 priority support'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleStartTrial} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                disabled={loading}
              >
                {loading ? 'Setting up trial...' : 'Start Your Free 14-Day Trial'}
              </Button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  ✓ No credit card required for trial
                </p>
                <p className="text-sm text-gray-600">
                  ✓ Full access to all features
                </p>
                <p className="text-sm text-gray-600">
                  ✓ Cancel anytime during trial
                </p>
              </div>
              
              <div className="border-t pt-4 mt-6">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <span>🔒 Bank-level security</span>
                  <span>🇲🇾 Malaysian data compliance</span>
                  <span>⚡ 99.9% uptime SLA</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Clinic Management?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join 500+ Malaysian clinics using LamaniHub to improve patient care and streamline operations.
          </p>
          
          <div className="bg-white text-blue-900 p-8 rounded-xl shadow-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Start Your Free Trial Today</h3>
            <p className="text-lg mb-6">
              14 days of full access - no credit card required
            </p>
            
            <Button 
              size="lg" 
              className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-xl px-12 py-4"
              onClick={handleStartTrial}
            >
              Start Free Trial Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-sm text-gray-600 mt-4">
              Setup takes less than 5 minutes • Full support included
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LH</span>
                </div>
                <span className="ml-2 text-xl font-bold">LamaniHub</span>
              </div>
              <p className="text-gray-400">
                Healthcare CRM designed for Malaysian clinics
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/demo" className="hover:text-white">Demo</a></li>
                <li><a href="/security" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="/training" className="hover:text-white">Training</a></li>
                <li><a href="/api" className="hover:text-white">API Docs</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms</a></li>
                <li><a href="/careers" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Lamanify Sdn Bhd. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">📧 support@lamanify.com</span>
                <span className="text-gray-400 text-sm">📞 +60 12-345 6789</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}