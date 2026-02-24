// app/api/superadmin/businesses/[businessId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBillingTypeFromPriceId, stripe, isWaveOrderSubscription } from '@/lib/stripe'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                password: true,
                accounts: {
                  select: {
                    provider: true
                  }
                },
                subscription: {
                  select: {
                    priceId: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            orders: true,
            products: true,
            customers: true,
            appointments: true,
            serviceRequests: true
          }
        },
        orders: {
          select: {
            total: true,
            paymentStatus: true,
            status: true,
            type: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Calculate total revenue (only paid orders that are completed/fulfilled)
    let totalRevenue = 0
    
    if (business.businessType === 'SALON' || business.businessType === 'SERVICES') {
      // For salons: revenue from completed appointments with paid orders
      const paidCompletedAppointments = await prisma.appointment.findMany({
        where: {
          businessId: businessId,
          status: 'COMPLETED',
          order: {
            paymentStatus: 'PAID'
          }
        },
        include: {
          order: {
            select: { total: true }
          }
        }
      })
      totalRevenue = paidCompletedAppointments.reduce((sum, apt) => sum + (apt.order?.total || 0), 0)
    } else {
      // For non-salons: revenue from delivered/picked-up paid orders
      totalRevenue = (business as any).orders
        .filter((order: any) => {
          if (order.paymentStatus !== 'PAID') return false
          if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return false
          
          if (order.type === 'DELIVERY') {
            return order.status === 'DELIVERED'
          } else if (order.type === 'PICKUP') {
            return order.status === 'PICKED_UP'
          } else if (order.type === 'DINE_IN') {
            return order.status === 'PICKED_UP'
          }
          
          return false
        })
        .reduce((sum: number, order: any) => sum + order.total, 0)
    }

    // Fetch API keys for this business
    const apiKeys = await prisma.apiKey.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        keyPreview: true,
        scopes: true,
        lastUsedAt: true,
        requestCount: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get domain info (already in business object, just extract for clarity)
    const domainInfo = {
      customDomain: business.customDomain,
      domainStatus: business.domainStatus,
      domainVerificationToken: business.domainVerificationToken,
      domainProvisionedAt: business.domainProvisionedAt,
      domainLastChecked: business.domainLastChecked,
      domainError: business.domainError
    }

    const isSalon = business.businessType === 'SALON' || business.businessType === 'SERVICES'

    // Count products/services by various filter criteria
    // For salons: query services (isService: true) for relevant stats
    // For non-salons: query products as before
    const [
      productsWithoutPhotosCount,
      productsWithZeroPriceCount,
      productsOutOfStockCount,
      productsWithVariantsAllZeroStockCount,
      productsWithVariantsSomeZeroStockCount,
      productsWithVariantsAllNonZeroStockCount,
      inactiveProductsCount,
      servicesWithoutPhotosCount,
      servicesWithZeroPriceCount,
      inactiveServicesCount
    ] = await Promise.all([
      // Products without photos (skip for salons)
      isSalon ? 0 : prisma.product.count({
        where: {
          businessId: businessId,
          isActive: true,
          images: { isEmpty: true }
        }
      }),
      // Products with zero price (skip for salons)
      isSalon ? 0 : prisma.product.count({
        where: {
          businessId: businessId,
          isActive: true,
          price: { lte: 0 }
        }
      }),
      // Products out of stock (no variants, trackInventory = true, stock <= 0) (skip for salons)
      isSalon ? 0 : prisma.product.count({
        where: {
          businessId: businessId,
          isActive: true,
          trackInventory: true,
          stock: { lte: 0 },
          variants: { none: {} } // No variants
        }
      }),
      // Products with variants where ALL variants have stock = 0 (skip for salons)
      isSalon ? 0 : (async () => {
        const productsWithVariants = await prisma.product.findMany({
          where: {
            businessId: businessId,
            isActive: true,
            trackInventory: true,
            variants: { some: {} } // Has variants
          },
          select: {
            id: true,
            variants: {
              select: {
                stock: true
              }
            }
          }
        })
        
        // Count products where all variants have stock = 0
        return productsWithVariants.filter(product => 
          product.variants.length > 0 && 
          product.variants.every(v => v.stock === 0)
        ).length
      })(),
      // Products with variants where SOME variants have stock = 0 (but not all) (skip for salons)
      isSalon ? 0 : (async () => {
        const productsWithVariants = await prisma.product.findMany({
          where: {
            businessId: businessId,
            isActive: true,
            trackInventory: true,
            variants: { some: {} } // Has variants
          },
          select: {
            id: true,
            variants: {
              select: {
                stock: true
              }
            }
          }
        })
        
        // Count products where at least one variant has stock = 0, but not all
        return productsWithVariants.filter(product => {
          if (product.variants.length === 0) return false
          const hasZeroStock = product.variants.some(v => v.stock === 0)
          const allZeroStock = product.variants.every(v => v.stock === 0)
          return hasZeroStock && !allZeroStock
        }).length
      })(),
      // Products with variants where ALL variants have stock > 0 (skip for salons)
      isSalon ? 0 : (async () => {
        const productsWithVariants = await prisma.product.findMany({
          where: {
            businessId: businessId,
            isActive: true,
            trackInventory: true,
            variants: { some: {} } // Has variants
          },
          select: {
            id: true,
            variants: {
              select: {
                stock: true
              }
            }
          }
        })
        
        // Count products where all variants have stock > 0
        return productsWithVariants.filter(product => 
          product.variants.length > 0 && 
          product.variants.every(v => v.stock > 0)
        ).length
      })(),
      // Inactive products (skip for salons)
      isSalon ? 0 : prisma.product.count({
        where: {
          businessId: businessId,
          isActive: false
        }
      }),
      // Services without photos (salon only)
      isSalon ? prisma.product.count({
        where: {
          businessId: businessId,
          isService: true,
          isActive: true,
          images: { isEmpty: true }
        }
      }) : 0,
      // Services with zero price (salon only)
      isSalon ? prisma.product.count({
        where: {
          businessId: businessId,
          isService: true,
          isActive: true,
          price: { lte: 0 }
        }
      }) : 0,
      // Inactive services (salon only)
      isSalon ? prisma.product.count({
        where: {
          businessId: businessId,
          isService: true,
          isActive: false
        }
      }) : 0
    ])

    // Get owner info
    const ownerRelation = (business as any).users.find((u: any) => u.role === 'OWNER')
    const owner = ownerRelation?.user
    let authMethod: 'google' | 'email' | 'magic-link' | 'oauth' = 'email'
    if (owner?.accounts && owner.accounts.length > 0) {
      const googleAccount = owner.accounts.find((acc: any) => acc.provider === 'google')
      if (googleAccount) {
        authMethod = 'google'
      } else {
        authMethod = 'oauth'
      }
    } else if (owner?.password) {
      authMethod = 'email'
    } else {
      authMethod = 'magic-link'
    }

    // Get billing type from subscription
    const subscriptionPriceId = owner?.subscription?.priceId
    const billingType = subscriptionPriceId ? getBillingTypeFromPriceId(subscriptionPriceId) : null

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        businessType: business.businessType,
        industry: business.industry,
        subscriptionPlan: business.subscriptionPlan,
        billingType: billingType,
        subscriptionStatus: business.subscriptionStatus,
        isActive: business.isActive,
        testMode: business.testMode,
        trialEndsAt: business.trialEndsAt?.toISOString() || null,
        graceEndsAt: business.graceEndsAt?.toISOString() || null,
        deactivatedAt: business.deactivatedAt,
        deactivationReason: business.deactivationReason,
        currency: business.currency,
        whatsappNumber: business.whatsappNumber,
        whatsappDirectNotifications: business.whatsappDirectNotifications,
        happyHourEnabled: business.happyHourEnabled,
        showSearchAnalytics: business.showSearchAnalytics,
        showCostPrice: business.showCostPrice,
        showProductionPlanning: business.showProductionPlanning,
        enableManualTeamCreation: business.enableManualTeamCreation,
        enableDeliveryManagement: business.enableDeliveryManagement,
        invoiceReceiptSelectionEnabled: business.invoiceReceiptSelectionEnabled,
        packagingTrackingEnabled: business.packagingTrackingEnabled,
        enableAffiliateSystem: business.enableAffiliateSystem,
        legalPagesEnabled: business.legalPagesEnabled,
        address: business.address,
        email: business.email,
        phone: business.phone,
        website: business.website,
        logo: business.logo,
        createdAt: business.createdAt.toISOString(),
        updatedAt: business.updatedAt.toISOString(),
        onboardingCompleted: business.onboardingCompleted,
        setupWizardCompleted: business.setupWizardCompleted,
        createdByAdmin: business.createdByAdmin,
        timezone: business.timezone,
        language: business.language,
        storefrontLanguage: business.storefrontLanguage,
        deliveryEnabled: business.deliveryEnabled,
        pickupEnabled: business.pickupEnabled,
        dineInEnabled: business.dineInEnabled,
        deliveryFee: business.deliveryFee,
        minimumOrder: business.minimumOrder,
        deliveryRadius: business.deliveryRadius,
        estimatedDeliveryTime: business.estimatedDeliveryTime,
        estimatedPickupTime: business.estimatedPickupTime,
        deliveryTimeText: business.deliveryTimeText,
        freeDeliveryText: business.freeDeliveryText,
        hideProductsWithoutPhotos: (business as any).hideProductsWithoutPhotos,
        rememberCustomerEnabled: business.rememberCustomerEnabled || false,
        mobileStackedOrdersEnabled: business.mobileStackedOrdersEnabled || false,
        completedOrdersPageEnabled: business.completedOrdersPageEnabled || false,
        externalSystemName: business.externalSystemName,
        externalSystemBaseUrl: business.externalSystemBaseUrl,
        externalSystemApiKey: business.externalSystemApiKey,
        externalSystemEndpoints: business.externalSystemEndpoints,
        externalBrandIds: business.externalBrandIds,
        connectedBusinesses: business.connectedBusinesses || [],
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          createdAt: owner.createdAt.toISOString(),
          authMethod
        } : null,
        stats: {
          // For salons, count appointments only (appointments are linked to orders, so don't double-count)
          // For non-salons, count orders
          totalOrders: isSalon 
            ? (business as any)._count.appointments
            : (business as any)._count.orders,
          totalRevenue,
          totalCustomers: (business as any)._count.customers,
          // For salons, this represents services; for non-salons, products
          totalProducts: (business as any)._count.products,
          // Product-specific stats - only for non-salons
          productsWithoutPhotos: isSalon ? 0 : productsWithoutPhotosCount,
          productsWithZeroPrice: isSalon ? 0 : productsWithZeroPriceCount,
          productsOutOfStock: isSalon ? 0 : productsOutOfStockCount,
          productsWithVariantsAllZeroStock: isSalon ? 0 : productsWithVariantsAllZeroStockCount,
          productsWithVariantsSomeZeroStock: isSalon ? 0 : productsWithVariantsSomeZeroStockCount,
          productsWithVariantsAllNonZeroStock: isSalon ? 0 : productsWithVariantsAllNonZeroStockCount,
          inactiveProducts: isSalon ? 0 : inactiveProductsCount,
          // Salon-specific stats
          servicesWithoutPhotos: isSalon ? servicesWithoutPhotosCount : 0,
          servicesWithZeroPrice: isSalon ? servicesWithZeroPriceCount : 0,
          inactiveServices: isSalon ? inactiveServicesCount : 0,
          // SERVICES only: form-based service requests
          totalServiceRequests: business.businessType === 'SERVICES' ? (business as any)._count.serviceRequests : undefined
        },
        apiKeys: apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          keyPreview: key.keyPreview,
          scopes: key.scopes,
          lastUsedAt: key.lastUsedAt?.toISOString() || null,
          requestCount: key.requestCount,
          isActive: key.isActive,
          createdAt: key.createdAt.toISOString()
        })),
        apiKeyStats: {
          totalKeys: apiKeys.length,
          activeKeys: apiKeys.filter(k => k.isActive).length,
          totalRequests: apiKeys.reduce((sum, k) => sum + k.requestCount, 0)
        },
        domain: {
          customDomain: domainInfo.customDomain,
          status: domainInfo.domainStatus,
          verificationToken: domainInfo.domainVerificationToken,
          provisionedAt: domainInfo.domainProvisionedAt?.toISOString() || null,
          lastChecked: domainInfo.domainLastChecked?.toISOString() || null,
          error: domainInfo.domainError
        }
      }
    })
  } catch (error) {
    console.error('Error fetching business:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          include: { user: true }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Cancel Stripe subscriptions and archive customer before DB deletion
    for (const businessUser of business.users) {
      if (businessUser.role === 'OWNER' && businessUser.user?.stripeCustomerId) {
        const customerId = businessUser.user.stripeCustomerId
        try {
          const stripeSubs = await stripe.subscriptions.list({
            customer: customerId,
            limit: 50,
          })
          for (const sub of stripeSubs.data) {
            if (['active', 'trialing', 'paused', 'past_due'].includes(sub.status) && isWaveOrderSubscription(sub)) {
              await stripe.subscriptions.cancel(sub.id)
            }
          }
          // Archive (delete) the Stripe customer so they don't appear in Stripe lists
          await stripe.customers.del(customerId)
        } catch (err: any) {
          console.error(`Stripe cleanup failed for ${customerId}:`, err.message)
        }
      }
    }

    // Start a transaction to delete everything related to the business
    await prisma.$transaction(async (tx) => {
      // Delete in the correct order to avoid foreign key constraints
      
      // 1. Delete order items first
      await tx.orderItem.deleteMany({
        where: {
          order: {
            businessId: businessId
          }
        }
      })

      // 2. Delete order notifications
      await tx.orderNotification.deleteMany({
        where: { businessId: businessId }
      })

      // 3. Delete orders
      await tx.order.deleteMany({
        where: { businessId: businessId }
      })

      // 4. Delete product variants and modifiers
      await tx.productVariant.deleteMany({
        where: {
          product: {
            businessId: businessId
          }
        }
      })

      await tx.productModifier.deleteMany({
        where: {
          product: {
            businessId: businessId
          }
        }
      })

      // 5. Delete inventory activities
      await tx.inventoryActivity.deleteMany({
        where: { businessId: businessId }
      })

      // 6. Delete products
      await tx.product.deleteMany({
        where: { businessId: businessId }
      })

      // 7. Delete categories
      await tx.category.deleteMany({
        where: { businessId: businessId }
      })

      // 8. Delete customers
      await tx.customer.deleteMany({
        where: { businessId: businessId }
      })

      // 9. Delete delivery zones
      await tx.deliveryZone.deleteMany({
        where: { businessId: businessId }
      })

      // 10. Delete team invitations
      await tx.teamInvitation.deleteMany({
        where: { businessId: businessId }
      })

      // 11. Delete analytics
      await tx.analytics.deleteMany({
        where: { businessId: businessId }
      })

      // 12. Delete business users relationships
      await tx.businessUser.deleteMany({
        where: { businessId: businessId }
      })

      // 13. Finally delete the business itself
      await tx.business.delete({
        where: { id: businessId }
      })

      // 14. Delete the owner user if they have no other businesses
      for (const businessUser of business.users) {
        if (businessUser.role === 'OWNER') {
          const userOtherBusinesses = await tx.businessUser.findMany({
            where: { 
              userId: businessUser.userId,
              businessId: { not: businessId }
            }
          })

          // If user has no other businesses, delete the user account
          if (userOtherBusinesses.length === 0) {
            // Delete user's accounts and sessions first
            await tx.account.deleteMany({
              where: { userId: businessUser.userId }
            })

            await tx.session.deleteMany({
              where: { userId: businessUser.userId }
            })

            // Delete the user
            await tx.user.delete({
              where: { id: businessUser.userId }
            })
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: `Business "${business.name}" and all associated data have been permanently deleted.`
    })

  } catch (error) {
    console.error('Error deleting business:', error)
    
    // Check if it's a foreign key constraint error
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        { message: 'Cannot delete business due to existing dependencies. Please contact support.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
