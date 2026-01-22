// ByBest Shop configuration from environment variables
// Environment variables:
// - NEXT_PUBLIC_BYBEST_SHOP_URL: Base URL for ByBest Shop API
// - NEXT_PUBLIC_BYBEST_SHOP_API_KEY: Shop API key (if required)
// - NEXT_PUBLIC_BYBEST_SHOP_CLIENT_API_KEY: Client API key (if required)

// TODO: Add ByBest Shop configuration
// const BYBEST_SHOP_BASE_URL = process.env.NEXT_PUBLIC_BYBEST_SHOP_URL!;
// const BYBEST_SHOP_API_KEY = process.env.NEXT_PUBLIC_BYBEST_SHOP_API_KEY!;
// const BYBEST_SHOP_CLIENT_API_KEY = process.env.NEXT_PUBLIC_BYBEST_SHOP_CLIENT_API_KEY!;

/**
 * Creates a ByBest Shop axios instance with authentication headers
 * 
 * @param clientApiKey - Optional client API key. If not provided, uses the default static client API key
 * @returns Configured axios instance ready to make requests to ByBest Shop
 * 
 * @example
 * ```typescript
 * const shop = createByBestShop();
 * const response = await shop.put('/products/EXT-PROD-12345/waveorder-update', productData);
 * ```
 */
// TODO: Implement createByBestShop function
// export const createByBestShop = (clientApiKey?: string): AxiosInstance => {
//   return axios.create({
//     baseURL: BYBEST_SHOP_BASE_URL,
//     headers: {
//       'x-api-key': BYBEST_SHOP_API_KEY,
//       'client-x-api-key': clientApiKey || BYBEST_SHOP_CLIENT_API_KEY,
//       'Content-Type': 'application/json'
//     }
//   });
// };

/**
 * Default ByBest Shop instance with environment variable credentials
 * Use this for most operations where the default client API key is sufficient
 */
// TODO: Implement default ByBest Shop instance
// export const byBestShop = createByBestShop();

/**
 * Interface for product update payload sent to ByBest Shop
 */
export interface ByBestShopProductUpdate {
  productId: string; // ByBest product ID (externalProductId from metadata)
  name?: string;
  nameAl?: string;
  description?: string;
  descriptionAl?: string;
  price?: number;
  salePrice?: number | null;
  originalPrice?: number | null;
  stockQuantity?: number;
  stockStatus?: 'instock' | 'outofstock';
  isActive?: boolean;
  images?: string[];
  categoryName?: string;
  categoryNameAl?: string;
  sku?: string;
  metadata?: {
    _id?: string; // WaveOrder internal ID
    updatedAt?: string;
  };
}

/**
 * Interface for variation update payload sent to ByBest Shop
 */
export interface ByBestShopVariation {
  sku: string;
  articleNo?: string;
  price: number;
  salePrice?: number | null;
  originalPrice?: number | null;
  stockQuantity: number;
  stockStatus: 'instock' | 'outofstock';
  name?: string;
  metadata?: {
    image?: string;
    attributes?: Record<string, string>;
  };
}

/**
 * Interface for order update payload sent to ByBest Shop
 */
export interface ByBestShopOrderUpdate {
  orderId: string; // WaveOrder order ID
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  items?: Array<{
    productId: string; // ByBest product ID
    variantId?: string; // ByBest variant ID
    quantity: number;
    price: number;
  }>;
  customer?: {
    name: string;
    phone: string;
    email?: string;
  };
  metadata?: {
    _id?: string; // WaveOrder internal ID
    updatedAt?: string;
  };
}

/**
 * Helper function to prepare WaveOrder product data for ByBest Shop sync
 * Converts WaveOrder product format to ByBest Shop format
 * 
 * Product identification priority:
 * 1. metadata.externalProductId (if product is linked)
 * 2. SKU (ByBest Shop can find products by SKU)
 * 3. WaveOrder internal ID (fallback)
 */
// TODO: Implement prepareProductForByBestShop function
// export function prepareProductForByBestShop(product: any): ByBestShopProductUpdate | null {
//   // Implementation needed:
//   // 1. Determine productId (externalProductId > SKU > WaveOrder ID)
//   // 2. Map WaveOrder fields to ByBest Shop fields
//   // 3. Handle simple vs variable products
//   // 4. Include variations if product has variants
//   // 5. Return formatted product data or null if product cannot be identified
//   return null;
// }

/**
 * Updates a product in ByBest Shop
 * 
 * @param productId - The ByBest product ID (external product ID from metadata)
 * @param updateData - Product update data in ByBest Shop format
 * @param clientApiKey - Optional client API key
 * @returns Promise resolving to update result
 */
// TODO: Implement updateProductInByBestShop function
// export async function updateProductInByBestShop(
//   productId: string,
//   updateData: ByBestShopProductUpdate,
//   clientApiKey?: string
// ): Promise<any> {
//   // Implementation needed:
//   // 1. Create axios instance with authentication
//   // 2. Make PUT/PATCH request to ByBest Shop API
//   // 3. Handle errors appropriately
//   // 4. Return response data
//   throw new Error('Not implemented');
// }

/**
 * Syncs a WaveOrder product to ByBest Shop
 * Syncs products even without externalProductId - uses SKU or WaveOrder ID for matching
 * 
 * @param product - WaveOrder product object (with category relation)
 * @param clientApiKey - Optional client API key
 * @returns Promise resolving to sync result, or null if product cannot be identified
 */
// TODO: Implement syncProductToByBestShop function
// export async function syncProductToByBestShop(
//   product: any,
//   clientApiKey?: string
// ): Promise<any | null> {
//   // Implementation needed:
//   // 1. Prepare product data using prepareProductForByBestShop
//   // 2. Call updateProductInByBestShop
//   // 3. Log success/failure
//   // 4. Return result or null
//   return null;
// }

/**
 * Updates an order status in ByBest Shop
 * 
 * @param orderId - The ByBest order ID (external order ID from metadata)
 * @param updateData - Order update data in ByBest Shop format
 * @param clientApiKey - Optional client API key
 * @returns Promise resolving to update result
 */
// TODO: Implement updateOrderInByBestShop function
// export async function updateOrderInByBestShop(
//   orderId: string,
//   updateData: ByBestShopOrderUpdate,
//   clientApiKey?: string
// ): Promise<any> {
//   // Implementation needed:
//   // 1. Create axios instance with authentication
//   // 2. Make PUT/PATCH request to ByBest Shop API for order updates
//   // 3. Handle errors appropriately
//   // 4. Return response data
//   throw new Error('Not implemented');
// }

/**
 * Syncs a WaveOrder order to ByBest Shop
 * 
 * @param order - WaveOrder order object (with items, customer, etc.)
 * @param clientApiKey - Optional client API key
 * @returns Promise resolving to sync result, or null if order cannot be identified
 */
// TODO: Implement syncOrderToByBestShop function
// export async function syncOrderToByBestShop(
//   order: any,
//   clientApiKey?: string
// ): Promise<any | null> {
//   // Implementation needed:
//   // 1. Prepare order data for ByBest Shop format
//   // 2. Call updateOrderInByBestShop
//   // 3. Log success/failure
//   // 4. Return result or null
//   return null;
// }
