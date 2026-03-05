import { Link } from 'react-router-dom';
import { NewsletterForm } from '@/components/newsletter/NewsletterForm';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-double border-foreground mt-16">
      <div className="container mx-auto px-4 py-12">

        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand & Newsletter */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-4">L3arbiFit</h2>
              <p className="text-muted-foreground max-w-md">
                Thoughtful journalism for curious minds. We believe in the power of 
                well-crafted stories to inform, inspire, and challenge.
              </p>
            </div>
            
            {/* Newsletter Subscription */}
            <div className="max-w-sm">
              <h3 className="caption mb-3">Subscribe to Newsletter</h3>
              <NewsletterForm variant="footer" />
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="caption mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/category/news" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  News
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/opinion" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Opinion
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/features" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/culture" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Culture
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/technology" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Technology
                </Link>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="caption mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/about" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} L3arbiFit. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Crafted with care for readers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}