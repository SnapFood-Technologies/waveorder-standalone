import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// Increase timeout for long-running sync operations (5 minutes)
// Note: This requires Vercel Pro plan or self-hosted Node.js runtime
export const maxDuration = 300 // 5 minutes

// POST - Trigger sync from external system
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; syncId: string }> }
) {
  // Declare variables at function level for error handling
  let syncLog: any = null
  let syncStartTime: Date | null = null
  let syncId: string | null = null
  let businessId: string | null = null

  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const paramsData = await params
    businessId = paramsData.businessId
    syncId = paramsData.syncId
    syncStartTime = new Date()

    // Get pagination parameters from query params
    const { searchParams } = new URL(request.url)
    const perPageOverride = searchParams.get('per_page')
    const currentPageParam = searchParams.get('current_page')
    const syncAllPagesParam = searchParams.get('sync_all_pages')
    
    // Parse pagination parameters
    const currentPage = currentPageParam ? parseInt(currentPageParam) : 1
    // Default to false (single page) to prevent timeouts - explicitly set to 'true' to sync all pages
    const syncAllPages = syncAllPagesParam === 'true'

    // Get sync configuration
    const sync = await (prisma as any).externalSync.findFirst({
      where: {
        id: syncId,
        businessId
      }
    })

    if (!sync) {
      return NextResponse.json(
        { message: 'External sync not found' },
        { status: 404 }
      )
    }

    if (!sync.isActive) {
      return NextResponse.json(
        { message: 'Sync is not active' },
        { status: 400 }
      )
    }

    // ALWAYS mark any old "running" logs as failed when starting a new sync
    try {
      const oldRunningLogs = await (prisma as any).externalSyncLog.findMany({
        where: {
          syncId,
          status: 'running',
          completedAt: null
        }
      })
      
      console.log(`[Sync] Found ${oldRunningLogs.length} old running log(s) to mark as failed`)
      
      if (oldRunningLogs.length > 0) {
        const now = Date.now()
        const updatePromises = oldRunningLogs.map(async (log: any) => {
          try {
            const logAge = now - new Date(log.startedAt).getTime()
            const result = await (prisma as any).externalSyncLog.update({
              where: { id: log.id },
              data: {
                status: 'failed',
                error: `Sync timed out after ${Math.round(logAge / 60000)} minutes (replaced by new sync)`,
                completedAt: new Date(),
                duration: logAge
              }
            })
            console.log(`[Sync] Successfully marked log ${log.id} as failed`)
            return result
          } catch (err: any) {
            console.error(`[Sync] CRITICAL: Failed to mark old log ${log.id} as failed:`, err)
            throw err
          }
        })
        
        await Promise.all(updatePromises)
        console.log(`[Sync] Successfully marked ${oldRunningLogs.length} old running log(s) as failed before starting new sync`)
      }
    } catch (error: any) {
      console.error('[Sync] CRITICAL: Error marking old running logs as failed:', error)
      // Don't block the sync, but log the error
    }

    // SAFEGUARD: Check if sync is already running
    const STALE_LOCK_TIMEOUT = 10 * 60 * 1000 // 10 minutes
    const now = new Date()
    const existingSyncStartedAt = sync.syncStartedAt ? new Date(sync.syncStartedAt) : null
    
    if (sync.isRunning && existingSyncStartedAt) {
      const lockAge = now.getTime() - existingSyncStartedAt.getTime()
      if (lockAge < STALE_LOCK_TIMEOUT) {
        // Sync is running and lock is not stale
        return NextResponse.json(
          { 
            message: 'Sync is already running',
            syncStartedAt: existingSyncStartedAt.toISOString(),
            lockAgeMinutes: Math.round(lockAge / 60000)
          },
          { status: 409 } // Conflict status
        )
      } else {
        // Lock is stale (sync probably crashed), clear it
        console.warn(`[Sync] Stale lock detected (${Math.round(lockAge / 60000)} minutes old), clearing...`)
        
        // Find and mark ALL old running logs as failed (not just one)
        const oldRunningLogs = await (prisma as any).externalSyncLog.findMany({
          where: {
            syncId,
            status: 'running',
            completedAt: null
          },
          orderBy: {
            startedAt: 'desc'
          }
        })
        
        // Mark all old running logs as failed
        if (oldRunningLogs.length > 0) {
          const now = Date.now()
          await Promise.all(
            oldRunningLogs.map((log: any) => {
              const logAge = now - new Date(log.startedAt).getTime()
              return (prisma as any).externalSyncLog.update({
                where: { id: log.id },
                data: {
                  status: 'failed',
                  error: `Sync timed out after ${Math.round(logAge / 60000)} minutes (stale lock cleared by new sync)`,
                  completedAt: new Date(),
                  duration: logAge
                }
              }).catch((err: any) => {
                console.error(`[Sync] Failed to mark log ${log.id} as failed:`, err)
              })
            })
          )
          console.log(`[Sync] Marked ${oldRunningLogs.length} old running log(s) as failed`)
        }
        
        // Clear the running flag
        await (prisma as any).externalSync.update({
          where: { id: syncId },
          data: {
            isRunning: false,
            syncStartedAt: null
          }
        })
      }
    }

    if (!sync.externalSystemBaseUrl || !sync.externalSystemApiKey) {
      return NextResponse.json(
        { message: 'External system base URL and API key are required' },
        { status: 400 }
      )
    }

    // Get business to ensure it exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    // CORRECT LOGIC: Find businesses that have THIS business in THEIR connectedBusinesses array
    // These are the "originators" or "marketplace owners" that want to see this business's products
    const originators = await prisma.business.findMany({
      where: {
        connectedBusinesses: { has: businessId }
      },
      select: { id: true }
    })

    // Get array of originator IDs - these are who should see the synced products
    const connectedBusinessIds = originators.map(b => b.id)

    // Parse endpoints and brand IDs
    const endpoints = sync.externalSystemEndpoints as any || {}
    const productsEndpoint = endpoints['products-by-brand'] || endpoints['products'] || '/brand-products-export'
    // Use per_page from query param if provided, otherwise from config, otherwise default to 100
    const perPage = perPageOverride ? parseInt(perPageOverride) : (endpoints?.perPage || 100)
    
    // Handle brandIds - can be string (like "13" or "5") or array
    let brandIds: string[] = []
    if (sync.externalBrandIds) {
      if (typeof sync.externalBrandIds === 'string') {
        // If it's a JSON string, parse it first
        try {
          const parsed = JSON.parse(sync.externalBrandIds)
          brandIds = Array.isArray(parsed) 
            ? parsed.filter(id => id != null).map(id => id.toString())
            : [parsed.toString()]
        } catch {
          // If not JSON, treat as plain string
          brandIds = [sync.externalBrandIds]
        }
      } else if (Array.isArray(sync.externalBrandIds)) {
        brandIds = sync.externalBrandIds
          .filter((id: any) => id != null)
          .map((id: any) => id.toString())
      } else {
        // If it's a number or other type, convert to string
        brandIds = [sync.externalBrandIds.toString()]
      }
    }

    // Create sync log entry
    try {
      syncLog = await (prisma as any).externalSyncLog.create({
        data: {
          syncId,
          businessId,
          status: 'running',
          processedCount: 0,
          skippedCount: 0,
          errorCount: 0,
          currentPage: currentPage,
          perPage: perPageOverride ? parseInt(perPageOverride) : (endpoints?.perPage || 100),
          syncAllPages: syncAllPages,
          startedAt: syncStartTime
        }
      })

      // Set sync as running
      await (prisma as any).externalSync.update({
        where: { id: syncId },
        data: {
          isRunning: true,
          syncStartedAt: syncStartTime
        }
      })
    } catch (logError) {
      console.error('Error creating sync log:', logError)
      // Continue even if log creation fails
    }

    let processedCount = 0
    let skippedCount = 0
    const errors: any[] = []
    let lastError: string | null = null
    let syncStatus: 'success' | 'failed' | 'partial' = 'success'
    let paginationInfo: {
      total?: number
      perPage?: number
      currentPage?: number
      totalPages?: number
      remainingPages?: number
    } = {}

    try {
      // Fetch products from external system
      const baseUrl = sync.externalSystemBaseUrl.replace(/\/$/, '') // Remove trailing slash
      const endpoint = productsEndpoint.startsWith('/') ? productsEndpoint : `/${productsEndpoint}`
      
      // Pre-fetch all categories once to avoid repeated queries
      const allCategories = await prisma.category.findMany({
        where: { businessId }
      }) as any[]
      
      console.log(`[Sync] Pre-loaded ${allCategories.length} categories for business ${businessId}`)
      
      // For each brand ID, fetch products
      for (const brandId of brandIds.length > 0 ? brandIds : ['']) {
        let page = currentPage // Start from specified current page
        let hasMore = true
        let isFirstPage = true
        let lastProcessedPage = currentPage

        while (hasMore) {
          const url = new URL(`${baseUrl}${endpoint}`)
          if (brandId) {
            // Use brand_id (snake_case) to match your API format
            url.searchParams.set('brand_id', brandId)
          }
          url.searchParams.set('page', page.toString())
          url.searchParams.set('per_page', perPage.toString())

          console.log(`[Sync] Fetching page ${page} from ${url.toString()}`)
          const fetchStartTime = Date.now()

          // Fetch from external API with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
          
          let response: Response
          try {
            response = await fetch(url.toString(), {
              headers: {
                'X-App-Key': sync.externalSystemApiKey!,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            const fetchDuration = Date.now() - fetchStartTime
            console.log(`[Sync] External API responded in ${fetchDuration}ms`)
          } catch (error: any) {
            clearTimeout(timeoutId)
            if (error.name === 'AbortError') {
              throw new Error(`External API request timeout after 30 seconds: ${url.toString()}`)
            }
            throw error
          }

          if (!response.ok) {
            throw new Error(`External API error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()
          
          // Handle different response formats
          let products: any[] = []
          if (data.products) {
            products = data.products
          } else if (data.data && Array.isArray(data.data)) {
            products = data.data
          } else if (Array.isArray(data)) {
            products = data
          }
          
          // Check if brand_info exists at response level (applies to all products in this page)
          const responseBrandInfo = data.brand_info || null
          if (responseBrandInfo) {
            console.log(`[Sync] Response-level brand_info found: ${responseBrandInfo.name} (ID: ${responseBrandInfo.id}) - will apply to all products in this page`)
          }
          
          // Capture pagination info from external API response (only on first page)
          if (isFirstPage) {
            const total = data.total || data.pagination?.total || 0
            const totalPages = data.pagination?.totalPages || data.total_pages || (total && perPage ? Math.ceil(total / perPage) : 1)
            const currentPageFromApi = data.pagination?.currentPage || data.current_page || page
            const perPageFromApi = data.pagination?.perPage || data.per_page || perPage
            
            paginationInfo = {
              total,
              perPage: perPageFromApi,
              currentPage: currentPageFromApi,
              totalPages,
              remainingPages: syncAllPages ? 0 : Math.max(0, totalPages - currentPageFromApi)
            }
            
            if (syncAllPages && totalPages > 50) {
              console.warn(`⚠️ Warning: Syncing all ${totalPages} pages may cause timeout. Consider using sync_all_pages=false for testing.`)
            }
          }

          if (!products || products.length === 0) {
            hasMore = false
            break
          }

          // Process each product
          const processStartTime = Date.now()
          console.log(`[Sync] Processing ${products.length} products from page ${page}`)
          
          for (let i = 0; i < products.length; i++) {
            const externalProduct = products[i]
            const productStartTime = Date.now()
            
            try {
              // If product doesn't have brand_info but response has it, use response-level brand_info
              // Product-level brand_info takes precedence over response-level (if product has its own, use that)
              if (!externalProduct.brand_info && responseBrandInfo) {
                externalProduct.brand_info = responseBrandInfo
              }
              
              // Process product and get updated categories array (in case new categories were created)
              const updatedCategories = await processExternalProduct(externalProduct, businessId, sync.id, allCategories, connectedBusinessIds)
              // Update the shared allCategories array with newly created categories
              // Replace the array reference to ensure all subsequent products see the new categories
              if (updatedCategories && updatedCategories.length > allCategories.length) {
                // Clear and repopulate to ensure we have all categories
                allCategories.splice(0, allCategories.length, ...updatedCategories)
              }
              processedCount++
              
              const productDuration = Date.now() - productStartTime
              if (productDuration > 1000) {
                console.log(`[Sync] Product ${externalProduct.id} took ${productDuration}ms`)
              }
            } catch (error: any) {
              skippedCount++
              errors.push({
                productId: externalProduct.id || 'unknown',
                error: error.message
              })
              console.error(`[Sync] Error processing product ${externalProduct.id}:`, error.message)
            }
            
            // Update log in real-time every 10 products
            if ((i + 1) % 10 === 0 && syncLog?.id) {
              try {
                await (prisma as any).externalSyncLog.update({
                  where: { id: syncLog.id },
                  data: {
                    processedCount,
                    skippedCount,
                    errorCount: errors.length,
                    currentPage: page
                  }
                })
                console.log(`[Sync] Progress: ${i + 1}/${products.length} products processed, total: ${processedCount}`)
              } catch (logUpdateError) {
                // Don't block processing if log update fails
                console.error('[Sync] Error updating log during processing:', logUpdateError)
              }
            }
          }
          
          const processDuration = Date.now() - processStartTime
          console.log(`[Sync] Completed processing ${products.length} products in ${processDuration}ms (avg: ${Math.round(processDuration / products.length)}ms per product)`)

          // Update log in real-time after each page is processed
          if (syncLog?.id) {
            try {
              await (prisma as any).externalSyncLog.update({
                where: { id: syncLog.id },
                data: {
                  processedCount,
                  skippedCount,
                  errorCount: errors.length,
                  currentPage: page,
                  totalPages: paginationInfo.totalPages || null,
                  perPage: paginationInfo.perPage || perPage,
                  status: 'running' // Still running, processing more pages
                }
              })
              console.log(`[Sync] Log updated: page ${page}, processed: ${processedCount}, skipped: ${skippedCount}, errors: ${errors.length}`)
            } catch (logUpdateError) {
              console.error('[Sync] Error updating log after page:', logUpdateError)
            }
          }

          // If syncAllPages is false, only sync the current page
          if (!syncAllPages) {
            hasMore = false
            break
          }

          // Check if there are more pages (only if syncAllPages is true)
          if (data.pagination) {
            hasMore = data.pagination.hasNext || (page < data.pagination.totalPages)
            if (hasMore) {
              page++
            }
          } else if (products.length < perPage) {
            hasMore = false
          } else {
            page++
          }
          
          isFirstPage = false
        }
      }

      if (errors.length > 0 && processedCount === 0) {
        syncStatus = 'failed'
        lastError = `All products failed: ${errors[0]?.error || 'Unknown error'}`
      } else if (errors.length > 0) {
        syncStatus = 'partial'
        lastError = `${errors.length} products failed`
      }

    } catch (error: any) {
      syncStatus = 'failed'
      lastError = error.message || 'Sync failed'
      console.error('Sync error:', error)
      
      // Update log immediately on error to prevent stuck "running" status
      if (syncLog?.id && syncStartTime) {
        try {
          await (prisma as any).externalSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'failed',
              error: error.message || 'Sync failed',
              processedCount,
              skippedCount,
              errorCount: errors.length,
              completedAt: new Date(),
              duration: Date.now() - syncStartTime.getTime(),
              metadata: errors.length > 0 ? { errors: errors.slice(0, 50) } : null
            }
          })
        } catch (logUpdateError) {
          console.error('Error updating sync log on failure:', logUpdateError)
        }
      }
    }

    // Calculate remaining pages
    // If syncing all pages, remainingPages = 0 (all done)
    // If syncing single page, remainingPages = totalPages - currentPage
    const remainingPages = syncAllPages 
      ? 0 // All pages synced
      : (paginationInfo.totalPages && paginationInfo.currentPage)
        ? Math.max(0, paginationInfo.totalPages - paginationInfo.currentPage)
        : 0

    const syncEndTime = new Date()
    const duration = syncEndTime.getTime() - syncStartTime.getTime()

    // Update sync log with final status - CRITICAL: Must always update
    if (syncLog?.id) {
      try {
        await (prisma as any).externalSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: syncStatus,
            error: lastError,
            processedCount,
            skippedCount,
            errorCount: errors.length,
            currentPage: paginationInfo.currentPage || currentPage,
            totalPages: paginationInfo.totalPages,
            perPage: paginationInfo.perPage || perPage,
            syncAllPages,
            completedAt: syncEndTime,
            duration,
            metadata: errors.length > 0 ? { errors: errors.slice(0, 50) } : null
          }
        })
        console.log(`[Sync] Log updated successfully: ${syncLog.id}, status: ${syncStatus}, processed: ${processedCount}`)
      } catch (logUpdateError) {
        console.error('[Sync] CRITICAL: Failed to update sync log:', logUpdateError)
        // Retry once
        try {
          await (prisma as any).externalSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: syncStatus,
              error: lastError,
              processedCount,
              skippedCount,
              errorCount: errors.length,
              completedAt: syncEndTime,
              duration
            }
          })
          console.log(`[Sync] Log update retry succeeded: ${syncLog.id}`)
        } catch (retryError) {
          console.error('[Sync] CRITICAL: Log update retry also failed:', retryError)
        }
      }
    } else {
      console.error('[Sync] CRITICAL: syncLog.id is missing, cannot update log!', { syncLog, syncId, businessId })
    }

    // Update sync status and clear running flag
    await (prisma as any).externalSync.update({
      where: { id: syncId },
      data: {
        lastSyncAt: syncEndTime,
        lastSyncStatus: syncStatus,
        lastSyncError: lastError,
        isRunning: false,
        syncStartedAt: null
      }
    })

    return NextResponse.json({
      message: syncAllPages 
        ? 'Sync completed' 
        : `Sync completed for page ${currentPage}`,
      processedCount,
      skippedCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      status: syncStatus,
      logId: syncLog.id,
      duration,
      pagination: {
        total: paginationInfo.total,
        perPage: paginationInfo.perPage || perPage,
        currentPage: paginationInfo.currentPage || currentPage,
        totalPages: paginationInfo.totalPages,
        remainingPages,
        syncAllPages
      }
    })

  } catch (error: any) {
    console.error('Error in sync:', error)
    
    // Clear running flag on error (only if we have syncId)
    if (syncId) {
      try {
        await (prisma as any).externalSync.update({
          where: { id: syncId },
          data: {
            isRunning: false,
            syncStartedAt: null
          }
        })
        
        // Update log if it was created
        if (syncLog?.id && syncStartTime) {
          await (prisma as any).externalSyncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'failed',
              error: error.message || 'Sync failed',
              completedAt: new Date(),
              duration: syncStartTime ? Date.now() - syncStartTime.getTime() : null
            }
          })
        }
      } catch (updateError) {
        console.error('Error updating sync status on failure:', updateError)
      }
    }
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// Helper function to extract name from object or string format with fallback
function extractName(nameField: any): { en: string; sq: string } {
  if (!nameField) return { en: '', sq: '' }
  
  // Handle object format: { en: "...", sq: "..." }
  if (typeof nameField === 'object' && nameField !== null) {
    const en = nameField.en || nameField.sq || ''
    const sq = nameField.sq || nameField.en || ''
    return { en, sq }
  }
  
  // Handle string format (backward compatibility)
  if (typeof nameField === 'string') {
    return { en: nameField, sq: nameField }
  }
  
  return { en: '', sq: '' }
}

// Helper function to process external product and create/update in WaveOrder
// Returns the updated categories array (including newly created categories)
async function processExternalProduct(externalProduct: any, businessId: string, syncId: string, preloadedCategories?: any[], connectedBusinessIds?: string[]): Promise<any[]> {
  // Validate required fields
  if (!externalProduct.id) {
    throw new Error('Product missing id')
  }

  // Check if name exists (can be object or string)
  const nameCheck = externalProduct.name
  if (!nameCheck || (typeof nameCheck === 'object' && !nameCheck.en && !nameCheck.sq) || (typeof nameCheck === 'string' && !nameCheck.trim())) {
    throw new Error('Product missing name')
  }

  // Handle categories - ByBest provides array, we use first category
  // Store external category ID in metadata for matching and handle parent categories
  let categoryId: string
  let categoryNameEn = 'Uncategorized'
  let categoryNameSq = 'Uncategorized'
  let externalCategoryId: string | null = null
  let parentCategoryId: string | null = null
  let externalParentCategoryId: string | null = null
  
  // Debug: Log category information to investigate why products fall back to Uncategorized
  const hasCategoriesArray = Array.isArray(externalProduct.categories) && externalProduct.categories.length > 0
  const hasCategoryName = !!externalProduct.categoryName
  
  if (hasCategoriesArray) {
    const firstCategory = externalProduct.categories[0]
    const categoryNames = extractName(firstCategory.name)
    categoryNameEn = categoryNames.en || 'Uncategorized'
    categoryNameSq = categoryNames.sq || categoryNames.en || 'Uncategorized'
    externalCategoryId = firstCategory.id?.toString() || null
    
    // Log if category name extraction failed
    if (!categoryNames.en && !categoryNames.sq) {
      console.warn(`[Sync] Product ${externalProduct.id}: Category name extraction failed. Category object:`, JSON.stringify(firstCategory.name))
    }
    
    // Handle parent category
    if (firstCategory.parent && firstCategory.parent.id) {
      externalParentCategoryId = firstCategory.parent.id.toString()
    }
  } else if (hasCategoryName) {
    const categoryNames = extractName(externalProduct.categoryName)
    categoryNameEn = categoryNames.en || 'Uncategorized'
    categoryNameSq = categoryNames.sq || categoryNames.en || 'Uncategorized'
    
    // Log if category name extraction failed
    if (!categoryNames.en && !categoryNames.sq) {
      console.warn(`[Sync] Product ${externalProduct.id}: categoryName extraction failed. Value:`, JSON.stringify(externalProduct.categoryName))
    }
  } else {
    // Log products that don't have categories
    console.warn(`[Sync] Product ${externalProduct.id} (${externalProduct.name?.en || externalProduct.name || 'Unknown'}): No categories found. Categories array:`, externalProduct.categories, 'categoryName:', externalProduct.categoryName)
  }
  
  // Use preloaded categories if provided, otherwise fetch them
  const categories = preloadedCategories || await prisma.category.findMany({
    where: { businessId }
  }) as any[]
  
  // First, handle parent category if exists
  if (externalParentCategoryId) {
    let parentCategory = categories.find((c: any) => {
      if (c.metadata && typeof c.metadata === 'object' && 'externalCategoryId' in c.metadata) {
        const metadata = c.metadata as { externalCategoryId?: string }
        return metadata.externalCategoryId === externalParentCategoryId.toString()
      }
      return false
    })
    
    if (!parentCategory) {
      // Parent category doesn't exist, create it
      const parentNames = externalProduct.categories?.[0]?.parent?.name 
        ? extractName(externalProduct.categories[0].parent.name)
        : { en: 'Uncategorized', sq: 'Uncategorized' }
      
      parentCategory = await (prisma.category.create as any)({
        data: {
          businessId,
          name: parentNames.en || 'Uncategorized',
          nameAl: parentNames.sq || parentNames.en || null,
          sortOrder: 0,
          isActive: true,
          connectedBusinesses: connectedBusinessIds,
          metadata: {
            externalCategoryId: externalParentCategoryId.toString(),
            externalSyncId: syncId,
            externalData: externalProduct.categories?.[0]?.parent || null
          }
        }
      })
      
      // Add to categories array for future lookups
      categories.push(parentCategory)
    }
    
    parentCategoryId = parentCategory.id
  }
  
  // Find category by external ID in metadata first, then fallback to name
  let category = categories.find((c: any) => {
    if (externalCategoryId && c.metadata && typeof c.metadata === 'object' && 'externalCategoryId' in c.metadata) {
      const metadata = c.metadata as { externalCategoryId?: string }
      return metadata.externalCategoryId === externalCategoryId.toString()
    }
    return false
  })
  
  // If not found by external ID, try by name (English)
  // For "Uncategorized", also check if it has no externalCategoryId to avoid duplicates
  if (!category) {
    if (categoryNameEn === 'Uncategorized' && !externalCategoryId) {
      // Find existing "Uncategorized" category that has no externalCategoryId (or null)
      category = categories.find((c: any) => {
        if (c.name === 'Uncategorized') {
          // Prefer categories without externalCategoryId (true "Uncategorized")
          if (!c.metadata || typeof c.metadata !== 'object' || !('externalCategoryId' in c.metadata)) {
            return true
          }
          const metadata = c.metadata as { externalCategoryId?: string }
          return !metadata.externalCategoryId
        }
        return false
      })
    } else {
      category = categories.find((c: any) => c.name === categoryNameEn)
    }
  }

  if (!category) {
    // Create new category with external ID in metadata
    // For "Uncategorized" without external ID, ensure we only create one
    const categoryData: any = {
      businessId,
      name: categoryNameEn,
      nameAl: categoryNameSq || categoryNameEn || null,
      parentId: parentCategoryId,
      sortOrder: 0,
      isActive: true,
      connectedBusinesses: connectedBusinessIds
    }
    
    if (externalCategoryId) {
      categoryData.metadata = {
        externalCategoryId: externalCategoryId.toString(),
        externalSyncId: syncId,
        externalData: Array.isArray(externalProduct.categories) && externalProduct.categories.length > 0 
          ? externalProduct.categories[0] 
          : null
      }
    } else if (categoryNameEn === 'Uncategorized') {
      // For "Uncategorized" without external ID, add metadata to mark it as the default uncategorized
      categoryData.metadata = {
        externalSyncId: syncId,
        isDefaultUncategorized: true
      }
    }
    
    category = await (prisma.category.create as any)({
      data: categoryData
    })
    
    // Add newly created category to categories array so subsequent products can find it
    categories.push(category)
  } else if (externalCategoryId) {
    // Update category metadata and parent if needed
    const currentMetadata = (category.metadata as any) || {}
    const needsUpdate = currentMetadata.externalCategoryId !== externalCategoryId.toString() || 
                       category.parentId !== parentCategoryId ||
                       category.name !== categoryNameEn ||
                       category.nameAl !== categoryNameSq
    
    if (needsUpdate) {
      await (prisma.category.update as any)({
        where: { id: category.id },
        data: {
          name: categoryNameEn,
          nameAl: categoryNameSq || categoryNameEn || null,
          parentId: parentCategoryId,
          connectedBusinesses: connectedBusinessIds,
          metadata: {
            ...currentMetadata,
            externalCategoryId: externalCategoryId.toString(),
            externalSyncId: syncId,
            externalData: Array.isArray(externalProduct.categories) && externalProduct.categories.length > 0 
              ? externalProduct.categories[0] 
              : currentMetadata.externalData || null
          }
        }
      })
    }
  }

  categoryId = category.id

  // Map ByBest fields to WaveOrder format
  // Handle stock - ByBest uses stock.quantity
  const stockQuantity = externalProduct.stock?.quantity || externalProduct.stock_quantity || externalProduct.stockQuantity || externalProduct.stock || 0
  const stockValue = parseInt(stockQuantity.toString()) || 0
  
  // Handle price - ByBest uses sale_price for current price, price for regular price
  const currentPrice = externalProduct.sale_price || externalProduct.salePrice || externalProduct.price || 0
  const regularPrice = externalProduct.price || externalProduct.regular_price || currentPrice
  
  // Handle sale dates - ByBest format: "2024-01-15 00:00:00"
  let saleStartDate: Date | null = null
  let saleEndDate: Date | null = null
  
  if (externalProduct.date_sale_start) {
    try {
      saleStartDate = new Date(externalProduct.date_sale_start)
      if (isNaN(saleStartDate.getTime())) {
        saleStartDate = null
      }
    } catch {
      saleStartDate = null
    }
  }
  
  if (externalProduct.date_sale_end) {
    try {
      saleEndDate = new Date(externalProduct.date_sale_end)
      if (isNaN(saleEndDate.getTime())) {
        saleEndDate = null
      }
    } catch {
      saleEndDate = null
    }
  }
  
  // Handle images - ByBest uses featured_image + gallery_images
  const images: string[] = []
  if (externalProduct.featured_image) {
    images.push(externalProduct.featured_image)
  }
  if (Array.isArray(externalProduct.gallery_images)) {
    images.push(...externalProduct.gallery_images)
  }
  // Fallback to images array if no featured_image/gallery_images
  if (images.length === 0 && Array.isArray(externalProduct.images)) {
    images.push(...externalProduct.images)
  }

  // Prepare product metadata with all unmappable ByBest fields
  const productMetadata: any = {
    externalProductId: externalProduct.id.toString(),
    externalSyncId: syncId,
    externalData: {
      // Store all original ByBest data
      ...externalProduct,
      // Explicitly store fields we can't map directly
      collections: externalProduct.collections || [],
      warehouses: externalProduct.stock?.warehouses || [],
      sale_percentage: externalProduct.sale_percentage || null,
      date_sale_start: externalProduct.date_sale_start || null,
      date_sale_end: externalProduct.date_sale_end || null,
      product_url: externalProduct.product_url || null,
      product_type: externalProduct.product_type || null,
      code: externalProduct.code || null,
      currency: externalProduct.currency || null,
      is_visible: externalProduct.is_visible !== undefined ? externalProduct.is_visible : true,
      brand_info: externalProduct.brand_info || null,
      attributes: externalProduct.attributes || []
    }
  }

  // Extract product names with fallback logic
  const productNames = extractName(externalProduct.name)
  const productNameEn = productNames.en || productNames.sq || 'Unnamed Product'
  const productNameSq = productNames.sq || productNames.en || productNameEn
  
  // Extract product descriptions - NO fallback between languages
  const productDescription = externalProduct.description || externalProduct.short_description || null
  const productDescEn = productDescription 
    ? (typeof productDescription === 'object' ? (productDescription.en || null) : productDescription)
    : null
  const productDescSq = productDescription && typeof productDescription === 'object'
    ? (productDescription.sq || null)
    : null
  
  // Extract meta title/description with fallback
  const metaTitleObj = externalProduct.meta_title
  const metaTitleEn = metaTitleObj 
    ? (typeof metaTitleObj === 'object' ? (metaTitleObj.en || metaTitleObj.sq || null) : metaTitleObj)
    : null
  const metaTitleSq = metaTitleObj && typeof metaTitleObj === 'object'
    ? (metaTitleObj.sq || metaTitleObj.en || null)
    : null
  
  const metaDescObj = externalProduct.meta_description
  const metaDescEn = metaDescObj 
    ? (typeof metaDescObj === 'object' ? (metaDescObj.en || metaDescObj.sq || null) : metaDescObj)
    : null
  const metaDescSq = metaDescObj && typeof metaDescObj === 'object'
    ? (metaDescObj.sq || metaDescObj.en || null)
    : null

  // Handle Brand (if brand_info exists)
  let brandId: string | null = null
  if (externalProduct.brand_info && externalProduct.brand_info.id) {
    const externalBrandId = externalProduct.brand_info.id.toString()
    const brandNames = extractName(externalProduct.brand_info.name || externalProduct.brand_info.brandName || 'Unknown Brand')
    
    // Find existing brand by external ID
    // Note: MongoDB JSON queries require string_contains for nested fields
    const existingBrands = await prisma.brand.findMany({
      where: { businessId }
    })
    
    let brand = existingBrands.find((b: any) => 
      b.metadata && 
      typeof b.metadata === 'object' && 
      (b.metadata as any).externalBrandId === externalBrandId
    )
    
    if (!brand) {
      // Create new brand
      brand = await prisma.brand.create({
        data: {
          businessId,
          name: brandNames.en || 'Unknown Brand',
          nameAl: brandNames.sq || brandNames.en || null,
          sortOrder: 0,
          isActive: true,
          connectedBusinesses: connectedBusinessIds,
          metadata: {
            externalBrandId: externalBrandId,
            externalSyncId: syncId,
            externalData: externalProduct.brand_info
          }
        }
      })
    } else {
      // Update existing brand with latest data from external system
      brand = await prisma.brand.update({
        where: { id: brand.id },
        data: {
          name: brandNames.en || brand.name || 'Unknown Brand',
          nameAl: brandNames.sq || brandNames.en || brand.nameAl || null,
          connectedBusinesses: connectedBusinessIds,
          // Update metadata to include latest external data
          metadata: {
            ...(brand.metadata && typeof brand.metadata === 'object' ? brand.metadata : {}),
            externalBrandId: externalBrandId,
            externalSyncId: syncId,
            externalData: externalProduct.brand_info
          }
        }
      })
    }
    
    brandId = brand.id
  }

  // Handle Collections (if collections array exists)
  const collectionIds: string[] = []
  if (Array.isArray(externalProduct.collections) && externalProduct.collections.length > 0) {
    for (const extCollection of externalProduct.collections) {
      if (typeof extCollection === 'string') {
        // Handle string format (collection name only)
        const collectionName = extCollection
        
        let collection = await prisma.collection.findFirst({
          where: {
            businessId,
            name: collectionName
          }
        })
        
        if (!collection) {
          collection = await prisma.collection.create({
            data: {
              businessId,
              name: collectionName,
              sortOrder: 0,
              isActive: true,
              featured: false,
              connectedBusinesses: connectedBusinessIds
            }
          })
        } else {
          await prisma.collection.update({
            where: { id: collection.id },
            data: {
              connectedBusinesses: connectedBusinessIds
            }
          })
        }
        
        collectionIds.push(collection.id)
      } else if (typeof extCollection === 'object' && extCollection.name) {
        // Handle object format with id
        const externalCollectionId = extCollection.id?.toString()
        const collectionNames = extractName(extCollection.name)
        
        // Find by external ID or name
        const existingCollections = await prisma.collection.findMany({
          where: { businessId }
        })
        
        let collection = existingCollections.find((c: any) => {
          // Try to match by external ID first
          if (externalCollectionId && c.metadata && typeof c.metadata === 'object') {
            if ((c.metadata as any).externalCollectionId === externalCollectionId) {
              return true
            }
          }
          // Fallback to name matching
          return c.name === collectionNames.en
        })
        
        if (!collection) {
          collection = await prisma.collection.create({
            data: {
              businessId,
              name: collectionNames.en || 'Unnamed Collection',
              nameAl: collectionNames.sq || collectionNames.en || null,
              sortOrder: 0,
              isActive: true,
              featured: false,
              connectedBusinesses: connectedBusinessIds || [],
              ...(externalCollectionId && {
                metadata: {
                  externalCollectionId: externalCollectionId,
                  externalSyncId: syncId,
                  externalData: extCollection
                }
              })
            }
          })
        } else {
          await prisma.collection.update({
            where: { id: collection.id },
            data: {
              connectedBusinesses: connectedBusinessIds || []
            }
          })
        }
        
        collectionIds.push(collection.id)
      }
    }
  }

  // Handle Groups (if groups array exists)
  const groupIds: string[] = []
  if (Array.isArray(externalProduct.groups) && externalProduct.groups.length > 0) {
    for (const extGroup of externalProduct.groups) {
      const externalGroupId = extGroup.id?.toString()
      const groupNames = extractName(extGroup.name)
      
      // Find by external ID
      const existingGroups = await prisma.group.findMany({
        where: { businessId }
      })
      
      let group = existingGroups.find((g: any) => 
        g.metadata && 
        typeof g.metadata === 'object' && 
        (g.metadata as any).externalGroupId === externalGroupId
      )
      
      if (!group) {
        group = await prisma.group.create({
          data: {
            businessId,
            name: groupNames.en || 'Unnamed Group',
            nameAl: groupNames.sq || groupNames.en || null,
            sortOrder: 0,
            isActive: true,
            connectedBusinesses: connectedBusinessIds,
            metadata: {
              externalGroupId: externalGroupId,
              externalSyncId: syncId,
              externalData: extGroup
            }
          }
        })
      } else {
        await prisma.group.update({
          where: { id: group.id },
          data: {
            connectedBusinesses: connectedBusinessIds
          }
        })
      }
      
      groupIds.push(group.id)
    }
  }

  // Prepare product data
  const productData: any = {
    businessId,
    categoryId,
    name: productNameEn,
    nameAl: productNameSq || productNameEn || null,
    description: productDescEn || null,
    descriptionAl: productDescSq || null,
    price: parseFloat(currentPrice.toString()) || 0,
    originalPrice: regularPrice && regularPrice !== currentPrice ? parseFloat(regularPrice.toString()) : null,
    sku: externalProduct.code || externalProduct.sku || externalProduct.article_no || null,
    stock: stockValue,
    trackInventory: externalProduct.stock?.manage_stock !== false, // Default to true unless explicitly false
    isActive: externalProduct.status === 'active' && externalProduct.is_visible !== false,
    featured: externalProduct.is_featured || false,
    images,
    metaTitle: metaTitleEn,
    metaDescription: metaDescEn,
    saleStartDate,
    saleEndDate,
    connectedBusinesses: connectedBusinessIds,
    ...(brandId && { brandId }),
    ...(collectionIds.length > 0 && { collectionIds }),
    ...(groupIds.length > 0 && { groupIds }),
    metadata: productMetadata
  }

  // Find existing product by external ID in metadata
  const products = await prisma.product.findMany({
    where: { businessId },
    include: { variants: true }
  })
  
  const existingProduct = products.find((p: any) => {
    if (p.metadata && typeof p.metadata === 'object' && 'externalProductId' in p.metadata) {
      const metadata = p.metadata as { externalProductId?: string }
      return metadata.externalProductId === externalProduct.id.toString()
    }
    return false
  })

  if (existingProduct) {
    // Track stock change for inventory activity
    const oldStock = existingProduct.stock || 0
    const stockChanged = oldStock !== stockValue
    
    // Update existing product
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: productData
    })

    // Create inventory activity if stock changed
    if (stockChanged && existingProduct.trackInventory !== false) {
      const quantityChange = stockValue - oldStock
      const activityType = quantityChange > 0 ? 'RESTOCK' : 'ADJUSTMENT'
      
      await prisma.inventoryActivity.create({
        data: {
          productId: existingProduct.id,
          businessId,
          type: activityType,
          quantity: quantityChange,
          oldStock,
          newStock: stockValue,
          reason: `External sync from ByBest (Product ID: ${externalProduct.id})`,
          changedBy: 'External Sync'
        }
      })
    }

    // Handle variants - ByBest uses variants array
    if (Array.isArray(externalProduct.variants) && externalProduct.variants.length > 0) {
      await syncProductVariants(existingProduct.id, externalProduct.variants, syncId, businessId)
    }
  } else {
    // Create new product
    const newProduct = await prisma.product.create({
      data: productData,
      include: {
        variants: true
      }
    })

    // Handle variants - ByBest uses variants array
    if (Array.isArray(externalProduct.variants) && externalProduct.variants.length > 0) {
      await syncProductVariants(newProduct.id, externalProduct.variants, syncId, businessId)
    }
  }
  
  // Return updated categories array (including newly created categories)
  return categories
}

// Helper function to sync product variants
async function syncProductVariants(productId: string, variations: any[], syncId: string, businessId: string) {
  for (const variation of variations) {
    if (!variation.id) {
      continue // Skip invalid variations
    }

    // Build variant name from attributes if available
    // Use English name with Albanian fallback
    let variantName = 'Default'
    
    if (variation.name) {
      const variantNames = extractName(variation.name)
      variantName = variantNames.en || variantNames.sq || 'Default'
    } else if (Array.isArray(variation.attributes) && variation.attributes.length > 0) {
      const attributeNames = variation.attributes.map((attr: any) => {
        if (typeof attr === 'string') return attr
        
        // Handle attribute_name and option_name as objects or strings
        const attrName = typeof attr.attribute_name === 'object' 
          ? (attr.attribute_name.en || attr.attribute_name.sq || '')
          : (attr.attribute_name || '')
        const optName = typeof attr.option_name === 'object'
          ? (attr.option_name.en || attr.option_name.sq || '')
          : (attr.option_name || '')
        
        if (optName) return `${attrName}: ${optName}`.trim()
        return attrName || optName || ''
      }).filter(Boolean)
      if (attributeNames.length > 0) {
        variantName = attributeNames.join(' - ')
      }
    }

    // Handle stock - ByBest uses stock.quantity or stock_quantity
    const variantStockQuantity = variation.stock?.quantity || variation.stock_quantity || variation.stockQuantity || variation.stock || 0
    const variantStock = parseInt(variantStockQuantity.toString()) || 0

    // Handle price - ByBest uses sale_price for current, regular_price for original
    const variantCurrentPrice = variation.sale_price || variation.salePrice || variation.regular_price || variation.price || 0
    const variantRegularPrice = variation.regular_price || variation.price || variantCurrentPrice
    const variantPrice = parseFloat(variantCurrentPrice.toString()) || 0
    const variantOriginalPrice = variantRegularPrice && variantRegularPrice !== variantCurrentPrice ? parseFloat(variantRegularPrice.toString()) : null

    // Handle SKU - ByBest uses variation_sku or sku
    const variantSku = variation.variation_sku || variation.variationSku || variation.sku || null

    // Handle variant sale dates - ByBest format: "2024-01-15 00:00:00"
    let variantSaleStartDate: Date | null = null
    let variantSaleEndDate: Date | null = null
    
    if (variation.date_sale_start) {
      try {
        variantSaleStartDate = new Date(variation.date_sale_start)
        if (isNaN(variantSaleStartDate.getTime())) {
          variantSaleStartDate = null
        }
      } catch {
        variantSaleStartDate = null
      }
    }
    
    if (variation.date_sale_end) {
      try {
        variantSaleEndDate = new Date(variation.date_sale_end)
        if (isNaN(variantSaleEndDate.getTime())) {
          variantSaleEndDate = null
        }
      } catch {
        variantSaleEndDate = null
      }
    }

    // Prepare variant metadata with all unmappable ByBest fields
    const variantMetadata: any = {
      externalVariantId: variation.id.toString(),
      externalSyncId: syncId,
      externalData: {
        // Store all original ByBest variant data
        ...variation,
        // Explicitly store fields we can't map directly
        warehouses: variation.stock?.warehouses || [],
        sale_percentage: variation.sale_percentage || null,
        date_sale_start: variation.date_sale_start || null,
        date_sale_end: variation.date_sale_end || null,
        variation_sku: variation.variation_sku || null,
        regular_price: variation.regular_price || null,
        currency: variation.currency || null,
        attributes: variation.attributes || []
      }
    }

    const variantData: any = {
      productId,
      name: variantName,
      price: variantPrice,
      originalPrice: variantOriginalPrice,
      stock: variantStock,
      sku: variantSku,
      saleStartDate: variantSaleStartDate,
      saleEndDate: variantSaleEndDate,
      metadata: variantMetadata
    }

    // Find existing variant by external ID
    const variants = await prisma.productVariant.findMany({
      where: { productId }
    }) as any[]
    
    const existingVariant = variants.find((v: any) => {
      if (v.metadata && typeof v.metadata === 'object' && 'externalVariantId' in v.metadata) {
        const metadata = v.metadata as { externalVariantId?: string }
        return metadata.externalVariantId === variation.id.toString()
      }
      return false
    })

    if (existingVariant) {
      // Track stock change for inventory activity
      const oldVariantStock = existingVariant.stock || 0
      const variantStockChanged = oldVariantStock !== variantStock

      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: variantData
      })

      // Create inventory activity if variant stock changed
      if (variantStockChanged) {
        const quantityChange = variantStock - oldVariantStock
        const activityType = quantityChange > 0 ? 'RESTOCK' : 'ADJUSTMENT'
        
        await prisma.inventoryActivity.create({
          data: {
            productId,
            variantId: existingVariant.id,
            businessId,
            type: activityType,
            quantity: quantityChange,
            oldStock: oldVariantStock,
            newStock: variantStock,
            reason: `External sync from ByBest (Variant ID: ${variation.id})`,
            changedBy: 'External Sync'
          }
        })
      }
    } else {
      await prisma.productVariant.create({
        data: variantData
      })
    }
  }
}
