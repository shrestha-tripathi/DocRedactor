'use client';

import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import PrivacyBadge from './PrivacyBadge';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-navy-900 border-b border-navy-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-brand-400" />
            <span className="text-xl font-bold text-white">DocRedactor</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <PrivacyBadge />
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-800 border-t border-navy-700">
          <div className="px-4 py-4 space-y-3">
            <PrivacyBadge />
          </div>
        </div>
      )}
    </header>
  );
}
