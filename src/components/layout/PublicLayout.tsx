import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white">
      {/* Public Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/product" className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LamaniHub</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/product"
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/product'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Product
              </Link>
              <Link
                to="/product#pricing"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <a
                href="#features"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </a>
              {user && (
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </nav>

            {/* CTA */}
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                    <Link to="/pricing">Start Free Trial</Link>
                  </Button>
                </>
              ) : (
                <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm">
                Menu
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Activity className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-lg font-bold">LamaniHub</span>
              </div>
              <p className="text-gray-400 text-sm">
                Healthcare CRM designed specifically for Malaysian clinics.
                PDPA compliant and locally supported.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/product" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/product#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="text-gray-400 hover:text-white transition-colors">Live Demo</Link></li>
                <li><Link to="/security" className="text-gray-400 hover:text-white transition-colors">Security & PDPA</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="mailto:support@lamanify.com" className="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="/training" className="text-gray-400 hover:text-white transition-colors">Training Resources</a></li>
                <li><a href="/api-docs" className="text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://lamanify.com/about" className="text-gray-400 hover:text-white transition-colors">About Lamanify</a></li>
                <li><a href="https://lamanify.com/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="https://lamanify.com/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="https://lamanify.com/careers" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Lamanify Sdn Bhd. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="mailto:support@lamanify.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                  📧 support@lamanify.com
                </a>
                <a href="tel:+60123456789" className="text-gray-400 hover:text-white text-sm transition-colors">
                  📞 +60 12-345 6789
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}