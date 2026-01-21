'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../ui/Button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-700">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <span className="text-xl font-bold text-neutral-900">Milano's Pizza</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          <Link href="/menu" className="text-sm font-medium text-neutral-700 hover:text-primary-700 transition-colors">
            Menu
          </Link>
          <Link href="/about" className="text-sm font-medium text-neutral-700 hover:text-primary-700 transition-colors">
            About
          </Link>
          <Link href="/catering" className="text-sm font-medium text-neutral-700 hover:text-primary-700 transition-colors">
            Catering
          </Link>
          <Link href="/faq" className="text-sm font-medium text-neutral-700 hover:text-primary-700 transition-colors">
            FAQ
          </Link>
          <Link href="/contact" className="text-sm font-medium text-neutral-700 hover:text-primary-700 transition-colors">
            Contact
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Link href="/cart" className="relative p-2 text-neutral-700 hover:text-primary-700 transition-colors">
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
              0
            </span>
          </Link>

          <Link href="/account/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>

          <Link href="/menu">
            <Button size="sm">Order Now</Button>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-neutral-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <div className="container py-4 space-y-4">
            <Link href="/menu" className="block py-2 text-sm font-medium text-neutral-700">
              Menu
            </Link>
            <Link href="/about" className="block py-2 text-sm font-medium text-neutral-700">
              About
            </Link>
            <Link href="/catering" className="block py-2 text-sm font-medium text-neutral-700">
              Catering
            </Link>
            <Link href="/faq" className="block py-2 text-sm font-medium text-neutral-700">
              FAQ
            </Link>
            <Link href="/contact" className="block py-2 text-sm font-medium text-neutral-700">
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
