// src/components/admin/help/FAQSection.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react'

interface FAQSectionProps {
  sectionId: string
  searchQuery: string
  businessType?: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  links?: { text: string; href: string }[]
}

const faqData: Record<string, FAQ[]> = {
  'getting-started': [
    {
      id: 'what-is-waveorder',
      question: 'What is WaveOrder and how does it work?',
      answer: 'WaveOrder is a WhatsApp-based ordering system that allows your customers to browse your menu and place orders directly through WhatsApp. Customers can view your catalog, add items to cart, and complete their order without leaving WhatsApp.',
      links: [
        { text: 'View Demo', href: '/demo' },
        { text: 'Setup Guide', href: '/setup' }
      ]
    },
    {
      id: 'first-steps',
      question: 'What are the first steps after creating my account?',
      answer: '1. Complete your business profile with name, description, and contact information\n2. Add your WhatsApp number for order management\n3. Create product categories to organize your menu\n4. Add your first products with descriptions and prices\n5. Customize your store appearance and branding\n6. Test your ordering system and go live!',
      links: [
        { text: 'Business Setup', href: '/admin/stores/[businessId]/settings/business' }
      ]
    },
    {
      id: 'whatsapp-setup',
      question: 'How do I set up WhatsApp for receiving orders?',
      answer: '1. Go to Settings > Business and add your WhatsApp number\n2. Share your store link with customers\n3. When customers visit your link, they can browse and place orders\n4. Order details will be sent to your WhatsApp automatically\n5. Orders will also appear in your dashboard for easy management',
      links: [
        { text: 'Business Settings', href: '/admin/stores/[businessId]/settings/business' }
      ]
    },
    {
      id: 'store-link',
      question: 'How do customers access my store?',
      answer: 'Your store has a unique link that you can share with customers. For Starter plans, your link will be: waveorder.app/your-store-name. For PRO plans, you can set up a custom domain. You can find this link in your dashboard and share it via social media, business cards, or any other marketing channels.',
      links: [
        { text: 'Share Store Link', href: '/admin/stores/[businessId]/marketing' }
      ]
    }
  ],
  'product-management': [
    {
      id: 'add-products',
      question: 'How do I add products to my store?',
      answer: '1. Go to Products > Add Product\n2. Enter product name, description, and price\n3. Upload product images (optional but recommended)\n4. Set product as active/inactive\n5. Add to appropriate category\n6. Save and your product will appear in your store',
      links: [
        { text: 'Add Product', href: '/admin/stores/[businessId]/products' }
      ]
    },
    {
      id: 'product-categories',
      question: 'How do I organize products into categories?',
      answer: 'Categories help organize your menu and make it easier for customers to find items. Create categories like "Appetizers", "Main Courses", "Desserts", etc. You can drag and drop to reorder categories and products within them.',
      links: [
        { text: 'Manage Categories', href: '/admin/stores/[businessId]/product-categories' }
      ]
    },
    {
      id: 'product-images',
      question: 'What are the best practices for product images?',
      answer: 'Use high-quality, well-lit images that show your products clearly. Recommended size is 800x600 pixels. Images help customers make decisions and increase order value. You can upload multiple images per product.',
      links: [
        { text: 'Add Product', href: '/admin/stores/[businessId]/products' }
      ]
    },
    {
      id: 'product-variants',
      question: 'Can I add different sizes or options to products?',
      answer: 'Yes! You can create product variants for different sizes, flavors, or options. For example, a pizza with different sizes (Small, Medium, Large) or a coffee with different types (Americano, Latte, Cappuccino). Add variants when creating or editing a product.',
      links: [
        { text: 'Products', href: '/admin/stores/[businessId]/products' }
      ]
    }
  ],
  'order-management': [
    {
      id: 'view-orders',
      question: 'How do I view and manage incoming orders?',
      answer: 'All orders appear in your Orders dashboard. You can see order details, customer information, items ordered, and total amount. Orders are automatically organized by status: Pending, Confirmed, Preparing, Ready, Delivered.',
      links: [
        { text: 'Orders Dashboard', href: '/admin/stores/[businessId]/orders' }
      ]
    },
    {
      id: 'order-status',
      question: 'How do I update order status?',
      answer: 'Click on any order to view details, then use the status buttons to update: Confirm → Preparing → Ready → Delivered. Customers can track their order status through your store.',
      links: [
        { text: 'Orders Dashboard', href: '/admin/stores/[businessId]/orders' }
      ]
    },
    {
      id: 'order-notifications',
      question: 'How do I get notified of new orders?',
      answer: 'You can enable email notifications for new orders in Settings > Notifications. You\'ll receive an email whenever a new order is placed, and you can also set up WhatsApp notifications.',
      links: [
        { text: 'Notification Settings', href: '/admin/stores/[businessId]/settings/notifications' }
      ]
    },
    {
      id: 'order-history',
      question: 'Can I view past orders and customer history?',
      answer: 'Yes! You can view all past orders, filter by date range, and see individual customer order history. This helps you understand customer preferences and track business performance.',
      links: [
        { text: 'Order Analytics', href: '/admin/stores/[businessId]/analytics' }
      ]
    }
  ],
  'customer-management': [
    {
      id: 'customer-info',
      question: 'What customer information do I have access to?',
      answer: 'For each customer, you can see their name, phone number, order history, total spent, and delivery address. This information helps you provide better service and build customer relationships.',
      links: [
        { text: 'Customer List', href: '/admin/stores/[businessId]/customers' }
      ]
    },
    {
      id: 'customer-communication',
      question: 'How do I communicate with customers?',
      answer: 'You can respond to customers directly through WhatsApp. View customer details and order history in your Customers section to provide personalized service.',
      links: [
        { text: 'Customers', href: '/admin/stores/[businessId]/customers' }
      ]
    },
    {
      id: 'customer-tiers',
      question: 'Can I create customer loyalty programs?',
      answer: 'Yes! You can categorize customers into tiers (Regular, VIP, Wholesale) and offer different pricing or services. This helps you reward loyal customers and increase retention.',
      links: [
        { text: 'Customer Tiers', href: '/admin/stores/[businessId]/customers' }
      ]
    }
  ],
  'whatsapp-integration': [
    {
      id: 'whatsapp-business',
      question: 'Do I need WhatsApp Business API?',
      answer: 'No! WaveOrder works with regular WhatsApp. You just need a WhatsApp number to receive orders. Customers will be able to message you directly through WhatsApp when they place orders.',
      links: [
        { text: 'Business Settings', href: '/admin/stores/[businessId]/settings/business' }
      ]
    },
    {
      id: 'how-orders-work',
      question: 'How do customers place orders via WhatsApp?',
      answer: 'Customers browse your online store, add items to their cart, and checkout. The order details are then sent to your WhatsApp number automatically. You can confirm and manage orders from your dashboard.',
      links: [
        { text: 'Orders Dashboard', href: '/admin/stores/[businessId]/orders' }
      ]
    },
    {
      id: 'whatsapp-notifications',
      question: 'Will I receive WhatsApp notifications for new orders?',
      answer: 'Yes! When a customer places an order, you\'ll receive a WhatsApp message with the order details. You can also enable email notifications in your notification settings for backup alerts.',
      links: [
        { text: 'Notification Settings', href: '/admin/stores/[businessId]/settings/notifications' }
      ]
    }
  ],
  'billing-subscriptions': [
    {
      id: 'subscription-plans',
      question: 'What subscription plans are available?',
      answer: 'WaveOrder offers three plans:\n\n• Starter: Basic features with up to 30 products\n• PRO: Unlimited products, inventory management, team collaboration, and discounts\n• Business: Everything in PRO plus custom domains and API access for integrations',
      links: [
        { text: 'View Plans', href: '/pricing' },
        { text: 'Manage Subscription', href: '/admin/stores/[businessId]/settings/billing' }
      ]
    },
    {
      id: 'billing-payment',
      question: 'How do I manage billing and payments?',
      answer: 'You can view your subscription details, billing history, and payment methods in Settings > Billing. We accept all major credit cards and offer monthly and annual billing options.',
      links: [
        { text: 'Billing Settings', href: '/admin/stores/[businessId]/settings/billing' }
      ]
    },
    {
      id: 'upgrade-downgrade',
      question: 'Can I change my subscription plan?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.',
      links: [
        { text: 'Change Plan', href: '/admin/stores/[businessId]/settings/billing' }
      ]
    }
  ],
  'team-management': [
    {
      id: 'invite-team',
      question: 'How do I invite team members?',
      answer: 'Go to Team Management and click "Invite Member". Enter their email and select their role (Owner, Manager, or Staff). They\'ll receive an invitation email with setup instructions.',
      links: [
        { text: 'Team Management', href: '/admin/stores/[businessId]/team' }
      ]
    },
    {
      id: 'team-roles',
      question: 'What are the different team roles?',
      answer: 'Owner: Full access to all features and billing. Manager: Can manage products, orders, and invite staff. Staff: Can view and manage orders and products. Each role has specific permissions.',
      links: [
        { text: 'Team Management', href: '/admin/stores/[businessId]/team' }
      ]
    },
    {
      id: 'team-collaboration',
      question: 'How do team members collaborate?',
      answer: 'Team members can work together on orders, products, and customer management. All actions are tracked with timestamps and user information. You can see who made what changes.',
      links: [
        { text: 'Team Management', href: '/admin/stores/[businessId]/team' }
      ]
    }
  ],
  'advanced-features': [
    {
      id: 'inventory-management',
      question: 'How does inventory management work?',
      answer: 'Track stock levels, set low stock alerts, and manage inventory across products and variants. Get notified when items are running low and automatically update stock when orders are placed.',
      links: [
        { text: 'Inventory Dashboard', href: '/admin/stores/[businessId]/inventory' }
      ]
    },
    {
      id: 'analytics-reports',
      question: 'What analytics and reports are available?',
      answer: 'View sales reports, popular products, customer analytics, order trends, and revenue tracking. Export data for accounting and business analysis.',
      links: [
        { text: 'Analytics Dashboard', href: '/admin/stores/[businessId]/analytics' }
      ]
    },
    {
      id: 'custom-domains',
      question: 'Can I use my own domain name?',
      answer: 'Yes! Business plan users can connect their own domain (like yourstore.com) instead of using the default waveorder.app subdomain. This gives your store a more professional appearance and better branding.',
      links: [
        { text: 'Domain Setup', href: '/admin/stores/[businessId]/domains' }
      ]
    },
    {
      id: 'api-access',
      question: 'Can I integrate WaveOrder with other systems?',
      answer: 'Yes! Business plan users get API access to integrate with POS systems, mobile apps, and other third-party services. Generate API keys from your dashboard and use our REST API.',
      links: [
        { text: 'API Access', href: '/admin/stores/[businessId]/api' },
        { text: 'API Documentation', href: '/developers' }
      ]
    },
    {
      id: 'discounts-coupons',
      question: 'Can I offer discounts and coupons?',
      answer: 'Yes! Create percentage or fixed amount discounts, set expiration dates, and track usage. Offer discounts to specific customers or make them available to all.',
      links: [
        { text: 'Discount Management', href: '/admin/stores/[businessId]/discounts' }
      ]
    }
  ],
  'troubleshooting': [
    {
      id: 'orders-not-appearing',
      question: 'Why aren\'t orders appearing in my dashboard?',
      answer: 'Check that your WhatsApp number is correctly set in Settings > Business. Ensure your store is active and not temporarily closed. Verify that customers are using the correct store link.',
      links: [
        { text: 'Business Settings', href: '/admin/stores/[businessId]/settings/business' }
      ]
    },
    {
      id: 'whatsapp-not-working',
      question: 'WhatsApp integration is not working properly',
      answer: 'Ensure your WhatsApp number is correctly entered in Settings > Business with the proper country code. Make sure your store is active and not temporarily closed. Contact support if the issue persists.',
      links: [
        { text: 'Business Settings', href: '/admin/stores/[businessId]/settings/business' },
        { text: 'Contact Support', href: '/admin/stores/[businessId]/support/tickets' }
      ]
    },
    {
      id: 'payment-issues',
      question: 'Having trouble with payments or billing?',
      answer: 'Check your payment method in Settings > Billing. Ensure your card is not expired and has sufficient funds. Contact your bank if payments are being declined.',
      links: [
        { text: 'Billing Support', href: '/admin/stores/[businessId]/settings/billing' }
      ]
    },
    {
      id: 'technical-support',
      question: 'Need technical support?',
      answer: 'If you\'re experiencing technical issues, create a support ticket with detailed information about the problem. Include screenshots and steps to reproduce the issue.',
      links: [
        { text: 'Create Support Ticket', href: '/admin/stores/[businessId]/support/tickets' }
      ]
    }
  ]
}

export function FAQSection({ sectionId, searchQuery, businessType = 'RESTAURANT' }: FAQSectionProps) {
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([])
  const isSalon = businessType === 'SALON'

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    )
  }

  // Get FAQ data with conditional rendering based on business type
  const getFAQData = () => {
    const baseFAQs = faqData[sectionId] || []
    
    if (!isSalon) {
      return baseFAQs
    }

    // For salons, transform FAQ content
    return baseFAQs.map(faq => {
      let transformedFAQ = { ...faq }
      
      // Transform answers based on section
      if (sectionId === 'getting-started') {
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/browse your menu/g, 'browse your service catalog')
          .replace(/place orders/g, 'book appointments')
          .replace(/order management/g, 'appointment management')
          .replace(/product categories/g, 'service categories')
          .replace(/products/g, 'services')
          .replace(/ordering system/g, 'booking system')
          .replace(/menu/g, 'service catalog')
      } else if (sectionId === 'product-management') {
        // For salons, this section should be service-management
        transformedFAQ.question = transformedFAQ.question.replace(/product/gi, 'service')
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/Products/g, 'Services')
          .replace(/products/g, 'services')
          .replace(/product categories/g, 'service categories')
          .replace(/product images/g, 'service images')
          .replace(/product variants/g, 'service options')
          .replace(/order value/g, 'appointment value')
          .replace(/Add Product/g, 'Add Service')
          .replace(/Manage Categories/g, 'Manage Service Categories')
        if (transformedFAQ.links) {
          transformedFAQ.links = transformedFAQ.links.map(link => ({
            ...link,
            href: link.href.replace(/products/g, 'services').replace(/product-categories/g, 'service-categories'),
            text: link.text.replace(/Product/gi, 'Service')
          }))
        }
      } else if (sectionId === 'order-management') {
        // For salons, this section should be appointment-management
        transformedFAQ.question = transformedFAQ.question.replace(/order/gi, 'appointment')
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/Orders/g, 'Appointments')
          .replace(/orders/g, 'appointments')
          .replace(/order status/g, 'appointment status')
          .replace(/order details/g, 'appointment details')
          .replace(/Pending, Confirmed, Preparing, Ready, Delivered/g, 'Requested, Confirmed, In Progress, Completed')
          .replace(/Orders Dashboard/g, 'Appointments Dashboard')
          .replace(/Order Analytics/g, 'Appointment Analytics')
        if (transformedFAQ.links) {
          transformedFAQ.links = transformedFAQ.links.map(link => ({
            ...link,
            href: link.href.replace(/orders/g, 'appointments'),
            text: link.text.replace(/Order/gi, 'Appointment')
          }))
        }
      } else if (sectionId === 'customer-management') {
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/order history/g, 'appointment history')
          .replace(/delivery address/g, 'address')
      } else if (sectionId === 'whatsapp-integration') {
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/place orders/g, 'book appointments')
          .replace(/order details/g, 'appointment details')
          .replace(/Orders dashboard/g, 'Appointments dashboard')
        if (transformedFAQ.links) {
          transformedFAQ.links = transformedFAQ.links.map(link => ({
            ...link,
            href: link.href.replace(/orders/g, 'appointments'),
            text: link.text.replace(/Order/gi, 'Appointment')
          }))
        }
      } else if (sectionId === 'team-management') {
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/manage products, orders/g, 'manage services, appointments')
          .replace(/orders and products/g, 'appointments and services')
      } else if (sectionId === 'billing-subscriptions') {
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/up to 30 products/g, 'up to 50 services')
          .replace(/Unlimited products/g, 'Unlimited services')
          .replace(/inventory management/g, 'appointment scheduling')
      } else if (sectionId === 'advanced-features') {
        // Hide inventory management for salons
        if (faq.id === 'inventory-management') {
          return null
        }
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/popular products/g, 'popular services')
          .replace(/order trends/g, 'appointment trends')
      } else if (sectionId === 'troubleshooting') {
        transformedFAQ.question = transformedFAQ.question.replace(/orders/g, 'appointments')
        transformedFAQ.answer = transformedFAQ.answer
          .replace(/orders appearing/g, 'appointments appearing')
          .replace(/Orders dashboard/g, 'Appointments dashboard')
        if (transformedFAQ.links) {
          transformedFAQ.links = transformedFAQ.links.map(link => ({
            ...link,
            href: link.href.replace(/orders/g, 'appointments')
          }))
        }
      }
      
      return transformedFAQ
    }).filter(faq => faq !== null) as FAQ[]
  }

  const faqs = getFAQData()
  
  // If no FAQs found and no search query, show a message
  if (faqs.length === 0 && searchQuery.trim() === '') {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>No FAQs available for this section yet.</p>
      </div>
    )
  }
  
  // Filter FAQs based on search query
  const filteredFAQs = faqs.filter(faq => 
    searchQuery === '' || 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filteredFAQs.length === 0 && searchQuery.trim() !== '') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
        <p className="text-gray-600 mb-4">
          No FAQs match your search criteria. Try different keywords or browse all sections.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Clear Search
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredFAQs.map((faq) => (
        <div key={faq.id} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleFAQ(faq.id)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">{faq.question}</h4>
              {expandedFAQs.includes(faq.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>
          
          {expandedFAQs.includes(faq.id) && (
            <div className="px-4 pb-3">
              <div className="text-sm text-gray-600 whitespace-pre-line mb-3">
                {faq.answer}
              </div>
              {faq.links && faq.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {faq.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="inline-flex items-center text-xs text-teal-600 hover:text-teal-700"
                    >
                      {link.text}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
