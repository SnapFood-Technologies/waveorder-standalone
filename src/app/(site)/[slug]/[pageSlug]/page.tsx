import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

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
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
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

    return {
      business: {
        name: business.name,
        primaryColor: business.primaryColor,
        secondaryColor: business.secondaryColor,
        fontFamily: business.fontFamily,
      },
      page,
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

  const { business, page } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white shadow-sm border-b"
        style={{ 
          borderColor: `${business.primaryColor || '#10b981'}20`,
          backgroundColor: business.secondaryColor || '#ffffff'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a
              href={`/${slug}`}
              className="text-lg font-semibold hover:opacity-80 transition-opacity"
              style={{ color: business.primaryColor || '#10b981' }}
            >
              ← Back to {business.name}
            </a>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 md:p-12">
          <h1 
            className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8"
            style={{ color: business.primaryColor || '#10b981' }}
          >
            {page.title}
          </h1>
          
          <div 
            className="prose prose-sm sm:prose-base max-w-none"
            style={{ fontFamily: business.fontFamily || 'inherit' }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prose h1, .prose h2, .prose h3, .prose h4 {
          color: ${business.primaryColor || '#10b981'};
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
        }
        .prose h1 { font-size: 2em; }
        .prose h2 { font-size: 1.5em; }
        .prose h3 { font-size: 1.25em; }
        .prose p {
          margin-bottom: 1em;
          line-height: 1.7;
          color: #374151;
        }
        .prose ul, .prose ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        .prose li {
          margin-bottom: 0.5em;
          color: #374151;
        }
        .prose a {
          color: ${business.primaryColor || '#10b981'};
          text-decoration: underline;
          transition: opacity 0.2s;
        }
        .prose a:hover {
          opacity: 0.8;
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
        }
        .prose pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .prose blockquote {
          border-left: 4px solid ${business.primaryColor || '#10b981'};
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #6b7280;
        }
        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }
        .prose th, .prose td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        .prose th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      `,
        }}
      />
    </div>
  )
}
