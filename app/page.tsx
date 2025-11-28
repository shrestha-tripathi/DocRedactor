'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, FileText, Zap, Lock, Upload, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/common/Header';
import DropZone from '@/components/upload/DropZone';
import { useDocumentStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Reading PDF...');
    
    try {
      await useDocumentStore.getState().setFile(file);
      setLoadingMessage('Preparing editor...');
      router.push('/editor');
    } catch (error) {
      console.error('Error loading file:', error);
      setIsLoading(false);
    }
  }, [router]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                100% Client-Side Processing • Your PDFs Never Leave Your Device
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                <span className="text-brand-400">PDF Redaction</span> Tool
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl">Privacy-First & AI-Powered</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
                Automatically detect and permanently redact sensitive information from your PDF documents. 
                Powered by AI that runs entirely in your browser — 
                <span className="text-brand-400 font-semibold"> no uploads, no servers, complete privacy</span>.
              </p>

              {/* Upload Zone */}
              <div className="max-w-2xl mx-auto relative">
                {isLoading && (
                  <div className="absolute inset-0 z-10 bg-navy-900/90 rounded-2xl flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 text-brand-400 animate-spin" />
                    <p className="text-white font-medium">{loadingMessage}</p>
                    <p className="text-gray-400 text-sm">This may take a few seconds...</p>
                  </div>
                )}
                <DropZone onFileSelect={handleFileSelect} disabled={isLoading} />
              </div>

              {/* Supported PII Types */}
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">Names</span>
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">Emails</span>
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">Phone Numbers</span>
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">SSN</span>
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">Credit Cards</span>
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">Dates</span>
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">Addresses</span>
                <span className="px-3 py-1 rounded-full bg-navy-800 text-gray-300 text-xs font-medium">+ Custom Patterns</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-navy-900 mb-4">
                Professional PDF Redaction, Zero Server Dependencies
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Built for organizations that handle sensitive PDF documents and need to comply with GDPR, HIPAA, and other privacy regulations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Lock className="w-8 h-8" />}
                title="True Privacy"
                description="Your PDFs are processed entirely in your browser using WebAssembly. No uploads, no cloud storage, no data leaks."
                color="brand"
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8" />}
                title="Smart Detection"
                description="Automatically identifies names, locations, organizations, emails, phone numbers, SSNs, credit cards, and more."
                color="yellow"
              />
              <FeatureCard
                icon={<EyeOff className="w-8 h-8" />}
                title="Visual Redaction"
                description="Covers sensitive information with solid black boxes. The redacted PDF can be safely shared with the marked areas hidden."
                color="green"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-navy-900 mb-4">
                Redact Your PDF in 3 Simple Steps
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Fast, secure, and completely private PDF redaction process.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <StepCard
                step={1}
                title="Upload Your PDF"
                description="Drag and drop your PDF file. It's read locally in your browser and never uploaded to any server."
              />
              <StepCard
                step={2}
                title="Review & Confirm"
                description="AI automatically identifies sensitive data. Review detections, add custom redactions, or use regex patterns."
              />
              <StepCard
                step={3}
                title="Download Redacted PDF"
                description="Export your sanitized PDF with all sensitive information permanently and irreversibly removed."
              />
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 bg-navy-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <TrustItem
                icon={<CheckCircle className="w-6 h-6 text-green-400" />}
                text="GDPR Compliant"
              />
              <TrustItem
                icon={<CheckCircle className="w-6 h-6 text-green-400" />}
                text="HIPAA Ready"
              />
              <TrustItem
                icon={<CheckCircle className="w-6 h-6 text-green-400" />}
                text="SOC 2 Architecture"
              />
              <TrustItem
                icon={<CheckCircle className="w-6 h-6 text-green-400" />}
                text="Zero Data Collection"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 border-t border-navy-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-400" />
              <span className="text-white font-semibold">DocRedactor</span>
              <span className="text-gray-500 text-sm">• PDF Redaction Tool</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} DocRedactor. All PDF processing happens locally in your browser.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: 'brand' | 'yellow' | 'green';
}) {
  const colorClasses = {
    brand: 'bg-brand-100 text-brand-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="card p-8 hover:shadow-lg transition-shadow">
      <div className={`inline-flex p-3 rounded-xl ${colorClasses[color]} mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-navy-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ 
  step, 
  title, 
  description 
}: { 
  step: number; 
  title: string; 
  description: string;
}) {
  return (
    <div className="relative">
      <div className="card p-8">
        <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold mb-4">
          {step}
        </div>
        <h3 className="text-xl font-semibold text-navy-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
      {step < 3 && (
        <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300" />
      )}
    </div>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {icon}
      <span className="text-white font-medium">{text}</span>
    </div>
  );
}
