import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getStorefrontTranslations } from '@/utils/storefront-translations'

interface PageProps {
  params: Promise<{ slug: string; pageSlug: string }>
}

async function getPageData(slug: string, pageSlug: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        legalPagesEnabled: true,
        storefrontLanguage: true,
        language: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        slug: true,
      },
    })

    if (!business || !business.legalPagesEnabled) {
      return null
    }

    const page = await prisma.storePage.findFirst({
      where: {
        businessId: business.id,
        slug: pageSlug,
        isEnabled: true,
      },
      select: {
        slug: true,
        title: true,
        content: true,
        pageType: true,
        noIndex: true,
      },
    })

    if (!page) {
      return null
    }

    // Get all enabled pages for footer
    const allPages = await prisma.storePage.findMany({
      where: {
        businessId: business.id,
        isEnabled: true,
        showInFooter: true,
      },
      select: {
        slug: true,
        title: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        primaryColor: business.primaryColor,
        secondaryColor: business.secondaryColor,
        fontFamily: business.fontFamily,
        storefrontLanguage: business.storefrontLanguage || business.language || 'en',
      },
      page,
      footerPages: allPages,
    }
  } catch (error) {
    console.error('Error fetching page data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, pageSlug } = await params
  const data = await getPageData(slug, pageSlug)

  if (!data) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: `${data.page.title} - ${data.business.name}`,
    description: `${data.page.title} for ${data.business.name}`,
    robots: {
      index: !data.page.noIndex,
      follow: !data.page.noIndex,
    },
  }
}

export default async function LegalPage({ params }: PageProps) {
  const { slug, pageSlug } = await params
  const data = await getPageData(slug, pageSlug)

  if (!data) {
    notFound()
  }

  const { business, page, footerPages } = data
  const primaryColor = business.primaryColor || '#10b981'
  const translations = getStorefrontTranslations(business.storefrontLanguage)

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: business.fontFamily || 'inherit' }}>
      {/* Back Button - Clean Design */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <a
            href={`/${slug}`}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <svg 
              className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="group-hover:opacity-80">{translations.backTo} {business.name}</span>
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section 
        className="pt-12 pb-16"
        style={{
          background: `linear-gradient(to bottom right, ${primaryColor}08, ${primaryColor}03, white)`
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
              style={{ color: primaryColor }}
            >
              {page.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {business.name}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="prose prose-lg max-w-none"
            style={{ fontFamily: business.fontFamily || 'inherit' }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </section>

      {/* Footer - Matching Storefront */}
      <footer className="bg-white mt-12 border-t border-gray-100">
        <div className="max-w-[75rem] mx-auto px-5 py-6">
          {/* Legal Pages Links */}
          {footerPages && footerPages.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {footerPages.map((footerPage) => (
                  <a
                    key={footerPage.slug}
                    href={`/${business.slug}/${footerPage.slug}`}
                    className="text-sm hover:underline transition-colors"
                    style={{ color: footerPage.slug === pageSlug ? primaryColor : '#6b7280' }}
                  >
                    {footerPage.title}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {translations.poweredBy}{' '}
              <a 
                href="https://waveorder.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:underline transition-colors"
                style={{ color: primaryColor }}
              >
                WaveOrder
              </a>
            </p>
          </div>
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prose {
          color: #374151;
          line-height: 1.75;
        }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: ${primaryColor};
          font-weight: 700;
          margin-top: 2em;
          margin-bottom: 1em;
          line-height: 1.2;
        }
        .prose h1 { 
          font-size: 2.5em; 
          margin-top: 0;
        }
        .prose h2 { 
          font-size: 2em; 
          border-bottom: 2px solid ${primaryColor}20;
          padding-bottom: 0.5em;
        }
        .prose h3 { 
          font-size: 1.5em; 
        }
        .prose h4 { 
          font-size: 1.25em; 
        }
        .prose p {
          margin-bottom: 1.25em;
          line-height: 1.75;
          color: #374151;
        }
        .prose ul, .prose ol {
          margin-bottom: 1.25em;
          padding-left: 1.75em;
        }
        .prose li {
          margin-bottom: 0.75em;
          color: #374151;
          line-height: 1.75;
        }
        .prose li::marker {
          color: ${primaryColor};
        }
        .prose a {
          color: ${primaryColor};
          text-decoration: underline;
          text-decoration-color: ${primaryColor}40;
          transition: all 0.2s;
        }
        .prose a:hover {
          color: ${primaryColor};
          text-decoration-color: ${primaryColor};
        }
        .prose strong {
          font-weight: 600;
          color: #111827;
        }
        .prose em {
          font-style: italic;
        }
        .prose code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #111827;
        }
        .prose pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1.25rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5em 0;
        }
        .prose pre code {
          background-color: transparent;
          color: #f9fafb;
          padding: 0;
        }
        .prose blockquote {
          border-left: 4px solid ${primaryColor};
          padding-left: 1.25rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #6b7280;
          background-color: ${primaryColor}05;
          padding-top: 0.75rem;
          padding-bottom: 0.75rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }
        .prose th, .prose td {
          border: 1px solid #e5e7eb;
          padding: 0.75rem;
          text-align: left;
        }
        .prose th {
          background-color: ${primaryColor}10;
          font-weight: 600;
          color: ${primaryColor};
        }
        .prose hr {
          border-color: ${primaryColor}20;
          margin: 2em 0;
        }
        .prose img {
          border-radius: 0.5rem;
          margin: 1.5em 0;
        }
      `,
        }}
      />
    </div>
  )
}
