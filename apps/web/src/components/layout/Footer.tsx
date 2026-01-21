import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-700">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Milano's Pizza</span>
            </div>
            <p className="text-sm text-neutral-600">
              Authentic Italian pizza made with love and the finest ingredients.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-neutral-900">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-sm text-neutral-600 hover:text-primary-700">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-neutral-600 hover:text-primary-700">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/catering" className="text-sm text-neutral-600 hover:text-primary-700">
                  Catering
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-sm text-neutral-600 hover:text-primary-700">
                  Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-neutral-900">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-neutral-600 hover:text-primary-700">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-neutral-600 hover:text-primary-700">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-neutral-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-neutral-600 hover:text-primary-700">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-neutral-900">Contact</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>(555) 123-4567</li>
              <li>info@milanos.pizza</li>
              <li>123 Main Street</li>
              <li>New York, NY 10001</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-neutral-200 pt-8 text-center">
          <p className="text-sm text-neutral-600">
            © {currentYear} Milano's Pizza. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
