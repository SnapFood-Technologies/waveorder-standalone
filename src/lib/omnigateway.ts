import axios, { AxiosInstance } from 'axios';

// OmniStack Gateway configuration from environment variables (server-side only)
// Environment variables:
// - OMNI_GATEWAY_URL: Base URL for OmniStack Gateway API
// - OMNI_GATEWAY_API_KEY: Gateway API key (x-api-key header)
// - PANDACOMET_OMNI_GATEWAY_CLIENT_API_KEY: Client API key (client-x-api-key header)
const OMNISTACK_BASE_URL = process.env.OMNI_GATEWAY_URL!;
const OMNISTACK_API_KEY = process.env.OMNI_GATEWAY_API_KEY!;
const OMNISTACK_CLIENT_API_KEY = process.env.PANDACOMET_OMNI_GATEWAY_CLIENT_API_KEY!;

/**
 * Creates an OmniStack Gateway axios instance with authentication headers
 * 
 * @param clientApiKey - Optional client API key. If not provided, uses the default static client API key
 * @returns Configured axios instance ready to make requests to OmniStack Gateway
 * 
 * @example
 * ```typescript
 * const gateway = createOmniGateway();
 * const response = await gateway.put('/store-products/EXT-PROD-12345/waveorder-update', productData);
 * ```
 */
export const createOmniGateway = (clientApiKey?: string): AxiosInstance => {
  return axios.create({
    baseURL: OMNISTACK_BASE_URL,
    headers: {
      'x-api-key': OMNISTACK_API_KEY,
      'client-x-api-key': clientApiKey || OMNISTACK_CLIENT_API_KEY,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Default OmniStack Gateway instance with environment variable credentials
 * Use this for most operations where the default client API key is sufficient
 */
export const omniGateway = createOmniGateway();

/**
 * Interface for variation update payload sent to OmniStack Gateway
 */
export interface OmniGatewayVariation {
  sku: string;
  articleNo?: string;
  price: number;
  salePrice?: number | null;
  originalPrice?: number | null;
  stockQuantity: number;
  stockStatus: 'instock' | 'outofstock';
  image?: string;
  attributes: Record<string, string>; // e.g., { "Size": "Small", "Color": "Red" }
  dateSaleStart?: string | null; // ISO date string
  dateSaleEnd?: string | null; // ISO date string
}

/**
 * Interface for product update payload sent to OmniStack Gateway
 */
export interface OmniGatewayProductUpdate {
  productId: string;
  sku?: string;
  productType?: 'simple' | 'variable';
  name?: string;
  nameAl?: string;
  description?: string;
  descriptionAl?: string;
  price?: number;
  salePrice?: number | null;
  originalPrice?: number | null;
  isActive?: boolean;
  stockQuantity?: number;
  stockStatus?: 'instock' | 'outofstock';
  featured?: boolean;
  images?: string[];
  categoryName?: string;
  categoryNameAl?: string;
  dateSaleStart?: string | null; // ISO date string for product-level sale start
  dateSaleEnd?: string | null; // ISO date string for product-level sale end
  variations?: OmniGatewayVariation[];
  metadata?: {
    _id: string;
    clientId?: string;
    updatedAt: string;
  };
}

/**
 * Updates a product in OmniStack Gateway
 * 
 * @param productId - The OmniStack StoreProduct _id (external product ID)
 * @param updateData - Product data to update
 * @param clientApiKey - Optional client API key (uses default if not provided)
 * @returns Promise resolving to the API response
 * 
 * @example
 * ```typescript
 * await updateProductInOmniGateway('EXT-PROD-12345', {
 *   stockQuantity: 59,
 *   stockStatus: 'instock',
 *   metadata: {
 *     _id: 'waveorder-product-id',
 *     updatedAt: new Date().toISOString()
 *   }
 * });
 * ```
 */
export async function updateProductInOmniGateway(
  productId: string,
  updateData: OmniGatewayProductUpdate,
  clientApiKey?: string
): Promise<any> {
  const gateway = createOmniGateway(clientApiKey);
  
  try {
    const response = await gateway.put(
      `/store-products/${productId}/waveorder-update`,
      updateData
    );
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `OmniStack Gateway API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}

/**
 * Helper function to prepare WaveOrder product data for OmniStack Gateway sync
 * Converts WaveOrder product format to OmniGateway format
 * 
 * Product identification priority:
 * 1. metadata.externalProductId (if product is linked)
 * 2. SKU (OmniStack Gateway can find products by SKU)
 * 3. WaveOrder internal ID (fallback)
 */
export function prepareProductForOmniGateway(product: any): OmniGatewayProductUpdate | null {
  const metadata = product.metadata as any;
  
  // Determine productId for OmniStack Gateway
  // Priority: externalProductId > SKU > WaveOrder ID
  // TODO: Investigate why externalProductId is not working/populated
  // - Check if externalProductId is being stored correctly when products are synced from OmniStack
  // - Verify metadata structure and how externalProductId is saved
  // - Ensure externalProductId is preserved during product updates
  let productId: string | null = null;
  
  if (metadata?.externalProductId) {
    // Product is linked - use external ID
    productId = metadata.externalProductId;
  } else if (product.sku) {
    // Use SKU as identifier (OmniStack Gateway can find by SKU)
    productId = product.sku;
  } else if (product.id) {
    // Fallback to WaveOrder internal ID
    productId = product.id;
  } else {
    // No way to identify the product (no ID, no SKU)
    return null;
  }

  // Calculate stock status
  const stockStatus: 'instock' | 'outofstock' = 
    product.trackInventory && product.stock > 0 ? 'instock' : 'outofstock';

  // Determine price logic
  let price = Math.round(product.price);
  let salePrice: number | null = null;
  let originalPrice: number | null = null;

  if (product.originalPrice && product.originalPrice !== product.price) {
    // Product is on sale
    originalPrice = Math.round(product.originalPrice);
    salePrice = Math.round(product.price);
    price = originalPrice; // Regular price
  }

  // Handle product-level sale dates
  // Read from database fields first, fallback to metadata for backward compatibility
  let dateSaleStart: string | null = null
  let dateSaleEnd: string | null = null
  
  if (product.saleStartDate) {
    dateSaleStart = new Date(product.saleStartDate).toISOString()
  } else if (metadata?.dateSaleStart) {
    // Fallback to metadata for backward compatibility
    dateSaleStart = typeof metadata.dateSaleStart === 'string' 
      ? metadata.dateSaleStart 
      : new Date(metadata.dateSaleStart).toISOString()
  }
  
  if (product.saleEndDate) {
    dateSaleEnd = new Date(product.saleEndDate).toISOString()
  } else if (metadata?.dateSaleEnd) {
    // Fallback to metadata for backward compatibility
    dateSaleEnd = typeof metadata.dateSaleEnd === 'string' 
      ? metadata.dateSaleEnd 
      : new Date(metadata.dateSaleEnd).toISOString()
  }

  // Prepare update payload
  // At this point, productId is guaranteed to be a string (not null)
  // Note: Admin has only one input for name/description, so we send the same value for both
  const updateData: OmniGatewayProductUpdate = {
    productId: productId as string,
    sku: product.sku || undefined,
    name: product.name || undefined,
    nameAl: product.name || undefined, // Same as name (admin has only one input)
    description: product.description || undefined,
    descriptionAl: product.description || undefined, // Same as description (admin has only one input)
    price: price,
    salePrice: salePrice,
    originalPrice: originalPrice,
    isActive: product.isActive,
    stockQuantity: product.stock || 0,
    stockStatus: stockStatus,
    featured: product.featured || false,
    // Send images array: empty array clears images in OmniStack, undefined keeps existing images
    // Always send the array (even if empty) to ensure image removal is synced
    images: Array.isArray(product.images) ? product.images : [],
    categoryName: product.category?.name || undefined,
    categoryNameAl: product.category?.nameAl || product.category?.name || undefined,
    dateSaleStart: dateSaleStart || undefined,
    dateSaleEnd: dateSaleEnd || undefined,
    metadata: {
      _id: product.id,
      clientId: metadata?.clientId || undefined,
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString()
    }
  };

  // Handle variations if product has variants
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    updateData.productType = 'variable';
    updateData.variations = product.variants.map((variant: any) => {
      const variantMetadata = (variant.metadata as any) || {};
      
      // Extract attributes from metadata or parse from variant name
      let attributes: Record<string, string> = {};
      if (variantMetadata.attributes && typeof variantMetadata.attributes === 'object') {
        attributes = variantMetadata.attributes;
      } else if (variant.name) {
        // Try to parse attributes from variant name (e.g., "Small - Red" or "Size: Small, Color: Red")
        // This is a fallback - ideally attributes should be stored in metadata
        const nameParts = variant.name.split(/[-–—,]/).map((s: string) => s.trim());
        if (nameParts.length >= 2) {
          // Simple heuristic: assume first part is Size, second is Color
          attributes = {
            Size: nameParts[0],
            Color: nameParts[1]
          };
        } else {
          // Single attribute value
          attributes = {
            Variant: variant.name
          };
        }
      }

      // Calculate stock status for variant
      const variantStockStatus: 'instock' | 'outofstock' = 
        variant.stock > 0 ? 'instock' : 'outofstock';

      // Determine price logic for variant
      let variantPrice = Math.round(variant.price);
      let variantSalePrice: number | null = null;
      let variantOriginalPrice: number | null = null;

      // Check database originalPrice field first, then metadata
      const variantOriginalPriceValue = variant.originalPrice || variantMetadata.originalPrice
      
      if (variantOriginalPriceValue && variantOriginalPriceValue !== variant.price) {
        // Variant is on sale
        variantOriginalPrice = Math.round(variantOriginalPriceValue);
        variantSalePrice = Math.round(variant.price);
        variantPrice = variantOriginalPrice; // Regular price
      } else if (variantMetadata.salePrice) {
        variantSalePrice = Math.round(variantMetadata.salePrice);
        variantOriginalPrice = variantPrice;
      }

      // Handle variant sale dates - read from database fields first, fallback to metadata
      let variantDateSaleStart: string | null = null
      let variantDateSaleEnd: string | null = null
      
      if (variant.saleStartDate) {
        variantDateSaleStart = new Date(variant.saleStartDate).toISOString()
      } else if (variantMetadata.dateSaleStart) {
        // Fallback to metadata for backward compatibility
        variantDateSaleStart = typeof variantMetadata.dateSaleStart === 'string' 
          ? variantMetadata.dateSaleStart 
          : new Date(variantMetadata.dateSaleStart).toISOString()
      }
      
      if (variant.saleEndDate) {
        variantDateSaleEnd = new Date(variant.saleEndDate).toISOString()
      } else if (variantMetadata.dateSaleEnd) {
        // Fallback to metadata for backward compatibility
        variantDateSaleEnd = typeof variantMetadata.dateSaleEnd === 'string' 
          ? variantMetadata.dateSaleEnd 
          : new Date(variantMetadata.dateSaleEnd).toISOString()
      }

      const variation: OmniGatewayVariation = {
        sku: variant.sku || `${product.sku || product.id}-${variant.id}`,
        articleNo: variantMetadata.articleNo || undefined,
        price: variantPrice,
        salePrice: variantSalePrice,
        originalPrice: variantOriginalPrice,
        stockQuantity: variant.stock || 0,
        stockStatus: variantStockStatus,
        image: variantMetadata.image || undefined,
        attributes: attributes,
        dateSaleStart: variantDateSaleStart,
        dateSaleEnd: variantDateSaleEnd
      };

      return variation;
    });
  } else {
    updateData.productType = 'simple';
  }

  return updateData;
}

/**
 * Syncs a WaveOrder product to OmniStack Gateway
 * Syncs products even without externalProductId - uses SKU or WaveOrder ID for matching
 * 
 * @param product - WaveOrder product object (with category relation)
 * @param clientApiKey - Optional client API key
 * @returns Promise resolving to sync result, or null if product cannot be identified
 */
export async function syncProductToOmniGateway(
  product: any,
  clientApiKey?: string
): Promise<any | null> {
  try {
    const updateData = prepareProductForOmniGateway(product);
    
    if (!updateData) {
      // Product cannot be identified (no ID, no SKU, no externalProductId)
      return null;
    }

    const result = await updateProductInOmniGateway(
      updateData.productId,
      updateData,
      clientApiKey
    );

    console.log(`[OmniGateway] Successfully synced product ${product.id} to OmniStack`);
    return result;
  } catch (error: any) {
    // Log error but don't throw - we don't want to break the main flow
    console.error(`[OmniGateway] Failed to sync product ${product.id} to OmniStack:`, error.message);
    return null;
  }
}
