// Export products for Meta Commerce Manager - CSV format
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        slug: true,
        name: true,
        currency: true,
        metaCatalogExportEnabled: true,
        hideProductsWithoutPhotos: true,
        showStockBadge: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (!business.metaCatalogExportEnabled) {
      return NextResponse.json(
        { message: 'Meta Catalog Export is not enabled for this business' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'all'
    const categoryIdsParam = searchParams.get('categoryIds')
    const productIdsParam = searchParams.get('productIds')

    const categoryIds = categoryIdsParam ? categoryIdsParam.split(',').filter(Boolean) : []
    const productIds = productIdsParam ? productIdsParam.split(',').filter(Boolean) : []

    const where: any = {
      businessId,
      isActive: true,
      price: { gt: 0 }
    }

    if (scope === 'categories' && categoryIds.length > 0) {
      where.categoryId = { in: categoryIds }
    } else if (scope === 'selection' && productIds.length > 0) {
      where.id = { in: productIds }
    }

    // StoreFront visible: apply same visibility rules as storefront
    if (scope === 'storefront') {
      if (business.hideProductsWithoutPhotos) {
        where.images = { isEmpty: false }
      }
      if (!business.showStockBadge) {
        where.OR = [
          { trackInventory: false },
          { trackInventory: true, stock: { gt: 0 } }
        ]
      }
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: { select: { id: true, name: true, price: true, sku: true, stock: true } }
      } as const,
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
    })

    // StoreFront: filter products with variants by variant stock (same as storefront)
    if (scope === 'storefront' && !business.showStockBadge) {
      products = products.filter((p) => {
        if (!p.trackInventory) return true
        if (p.variants && p.variants.length > 0) {
          return p.variants.some((v) => (v.stock ?? 0) > 0)
        }
        return (p.stock ?? 0) > 0
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveorder.app'
    const currency = business.currency || 'USD'

    const escapeCsv = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return ''
      const s = String(val)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const formatPrice = (price: number) => `${price.toFixed(2)} ${currency}`

    const now = new Date()
    const formatSaleDate = (start: Date | null, end: Date | null): string => {
      if (!start || !end) return ''
      const s = start.toISOString().replace(/\.\d{3}Z$/, '+00:00')
      const e = end.toISOString().replace(/\.\d{3}Z$/, '+00:00')
      return `${s}/${e}`
    }

    const rows: string[][] = []

    for (const p of products) {
      const productLink = `${baseUrl}/${business.slug}?ps=${p.id}`
      const imageLink = p.images?.[0] || ''
      const desc = (p.description || '').replace(/\s+/g, ' ').trim().slice(0, 9999)
      const title = p.name.slice(0, 200)
      const availability = p.trackInventory
        ? (p.stock > 0 ? 'in stock' : 'out of stock')
        : 'in stock'

      const isOnSale = p.originalPrice && p.saleStartDate && p.saleEndDate && now >= p.saleStartDate && now <= p.saleEndDate
      const regularPrice = p.originalPrice ?? p.price
      const salePrice = isOnSale && p.price < regularPrice ? formatPrice(p.price) : ''
      const salePriceEffectiveDate = isOnSale && p.saleStartDate && p.saleEndDate ? formatSaleDate(p.saleStartDate, p.saleEndDate) : ''

      const brand = p.brand?.name || business.name
      const categoryName = (p.category as { name?: string })?.name || ''
      const quantity = p.trackInventory ? Math.max(0, p.stock) : 999

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const variantId = v.sku || `${p.id}-${v.id}`
          const variantTitle = `${title} - ${v.name}`.slice(0, 200)
          const variantPrice = v.price
          const variantStock = p.trackInventory ? (v.stock ?? 0) : 999
          const variantAvailability = p.trackInventory ? (variantStock > 0 ? 'in stock' : 'out of stock') : 'in stock'

          rows.push([
            escapeCsv(variantId),
            escapeCsv(variantTitle),
            escapeCsv(desc),
            variantAvailability,
            'new',
            formatPrice(variantPrice),
            productLink,
            imageLink,
            escapeCsv(brand),
            escapeCsv(categoryName),
            escapeCsv(categoryName),
            String(variantStock),
            '',
            '',
            p.id,
            '',
            escapeCsv(v.name),
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            ''
          ])
        }
      } else {
        rows.push([
          escapeCsv(p.sku || p.id),
          escapeCsv(title),
          escapeCsv(desc),
          availability,
          'new',
          formatPrice(regularPrice),
          productLink,
          imageLink,
          escapeCsv(brand),
          escapeCsv(categoryName),
          escapeCsv(categoryName),
          String(quantity),
          salePrice,
          salePriceEffectiveDate,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ])
      }
    }

    const header = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'google_product_category',
      'fb_product_category',
      'quantity_to_sell_on_facebook',
      'sale_price',
      'sale_price_effective_date',
      'item_group_id',
      'gender',
      'color',
      'size',
      'age_group',
      'material',
      'pattern',
      'shipping',
      'shipping_weight',
      'video[0].url',
      'video[0].tag[0]',
      'gtin',
      'product_tags[0]',
      'product_tags[1]',
      'style[0]'
    ]

    const csvLines = [header.join(','), ...rows.map((r) => r.join(','))]
    const csv = csvLines.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="catalog_products_${business.slug}.csv"`
      }
    })
  } catch (error) {
    console.error('Meta catalog export error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
