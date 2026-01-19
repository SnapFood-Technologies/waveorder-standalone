// src/components/site/Sitemap.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Globe, ChevronRight } from 'lucide-react'

export default function Sitemap() {
  const siteStructure = [
    {
      title: "Platform",
      description: "Core platform features and capabilities",
      links: [
        { 
          title: "Features", 
          href: "/features", 
          description: "Complete overview of WaveOrder features including WhatsApp integration, catalog management, and analytics" 
        },
        { 
          title: "Pricing", 
          href: "/pricing", 
          description: "Transparent pricing plans for businesses of all sizes with Starter and Pro options" 
        },
        { 
          title: "Demo", 
          href: "/demo", 
          description: "Interactive demos showcasing restaurant catalogs and WhatsApp ordering experience" 
        },
        { 
          title: "Get Started", 
          href: "/auth/register", 
          description: "Sign up for your WaveOrder account and create your first WhatsApp catalog. Starter plan at $6/month." 
        }
      ]
    },
    {
      title: "Company",
      description: "About WaveOrder and how to get in touch",
      links: [
        { 
          title: "About", 
          href: "/about", 
          description: "Learn about WaveOrder's mission, values, and the team behind the platform" 
        },
        { 
          title: "Contact", 
          href: "/contact", 
          description: "Get support, schedule demos, or ask questions about WhatsApp ordering" 
        },
        { 
          title: "Sitemap", 
          href: "/sitemap", 
          description: "Complete navigation structure of all WaveOrder website pages" 
        },
        { 
          title: "Resources", 
          href: "/resources", 
          description: "Help center with FAQs, guides, and best practices for WhatsApp ordering" 
        }
      ]
    },
    {
      title: "Account",
      description: "User account and authentication pages",
      links: [
        { 
          title: "Sign Up", 
          href: "/auth/register", 
          description: "Create your WaveOrder account to start building WhatsApp catalogs. Starter plan at $6/month." 
        },
        { 
          title: "Log In", 
          href: "/auth/login", 
          description: "Access your WaveOrder dashboard to manage orders and catalog" 
        },
        { 
          title: "Dashboard", 
          href: "/dashboard", 
          description: "Business dashboard for managing products, orders, and team members" 
        }
      ]
    },
    {
      title: "Legal",
      description: "Terms, policies, and legal information",
      links: [
        { 
          title: "Privacy Policy", 
          href: "/privacy", 
          description: "How WaveOrder collects, uses, and protects your business and customer data" 
        },
        { 
          title: "Terms of Service", 
          href: "/terms", 
          description: "Legal terms and conditions for using the WaveOrder platform" 
        },
        { 
          title: "Cookie Policy", 
          href: "/cookies", 
          description: "Information about cookies and tracking technologies used on our website" 
        }
      ]
    }
  ]

  const quickLinks = [
    { title: "Get Started", href: "/auth/register", type: "primary" },
    { title: "View Pricing", href: "/pricing", type: "secondary" },
    { title: "Schedule Demo", href: "/contact", type: "secondary" },
    { title: "See Features", href: "/features", type: "secondary" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Website Sitemap
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Navigate through all WaveOrder pages and find exactly what you're looking for. 
              From platform features to support resources, everything is organized here.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Quick Access
            </h2>
            <p className="text-gray-600">
              Popular pages and important actions
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                  link.type === 'primary'
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50'
                }`}
              >
                {link.title}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Site Structure */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Site Structure
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse all sections of our website organized by category
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {siteStructure.map((section, index) => (
              <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h3>
                  <p className="text-gray-600">{section.description}</p>
                </div>
                
                <div className="space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      href={link.href}
                      className="group block p-4 border border-gray-200 rounded-lg hover:border-teal-200 hover:bg-teal-50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-teal-600">
                              {link.title}
                            </h4>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-2 group-hover:text-teal-600 transition-colors" />
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Need Help Finding Something?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Can't find what you're looking for? Our support team is here to help you navigate 
            WaveOrder and find the information you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Contact Support
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/resources"
              className="inline-flex items-center px-8 py-4 border-2 border-teal-600 text-teal-600 text-lg font-semibold rounded-lg hover:bg-teal-50 transition-colors"
            >
              Browse Resources
            </Link>
          </div>
        </div>
      </section>

      {/* XML Sitemap Notice */}
      {/* <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            Looking for our XML sitemap for search engines? 
            <Link href="/sitemap.xml" className="text-teal-600 hover:text-teal-700 font-medium ml-1">
              Access XML Sitemap
            </Link>
          </p>
        </div>
      </section> */}
    </div>
  )
}