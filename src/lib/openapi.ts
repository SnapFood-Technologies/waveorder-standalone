export const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'WaveOrder Platform API',
      version: '1.0.0',
      description: 'Complete API documentation for WaveOrder Platform - Multi-tenant order management system',
      contact: {
        name: 'WaveOrder Support',
        email: 'support@waveorder.app',
        url: 'https://waveorder.app'
      },
      license: {
        name: 'Proprietary',
        url: 'https://waveorder.app/terms'
      }
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://waveorder.app',
        description: 'Production server'
      }
    ],
    paths: {
      // ===== BUSINESSES =====
      '/api/admin/stores/{businessId}': {
        get: {
          summary: 'Get business details',
          description: 'Retrieve details of a specific business',
          tags: ['Businesses'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Business ID'
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Business' }
                }
              }
            },
            '404': { description: 'Business not found' }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        put: {
          summary: 'Update business',
          description: 'Update business information',
          tags: ['Businesses'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateBusiness' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Business updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Business' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      // ===== PRODUCTS =====
      '/api/admin/stores/{businessId}/products': {
        get: {
          summary: 'Get all products',
          description: 'Retrieve all products for a business',
          tags: ['Products'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 }
            },
            {
              name: 'categoryId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category'
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search products by name'
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' }
                      },
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' }
                    }
                  }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        post: {
          summary: 'Create product',
          description: 'Create a new product',
          tags: ['Products'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateProduct' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Product created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      '/api/admin/stores/{businessId}/products/{productId}': {
        get: {
          summary: 'Get product by ID',
          tags: ['Products'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'productId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        put: {
          summary: 'Update product',
          tags: ['Products'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'productId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateProduct' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Product updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        delete: {
          summary: 'Delete product',
          tags: ['Products'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'productId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '204': { description: 'Product deleted' }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      // ===== ORDERS =====
      '/api/admin/stores/{businessId}/orders': {
        get: {
          summary: 'Get all orders',
          description: 'Retrieve all orders for a business',
          tags: ['Orders'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 }
            },
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']
              }
            },
            {
              name: 'type',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['DELIVERY', 'PICKUP', 'DINE_IN']
              }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Order' }
                      },
                      total: { type: 'integer' }
                    }
                  }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        post: {
          summary: 'Create order',
          description: 'Create a new order',
          tags: ['Orders'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateOrder' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Order created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      '/api/admin/stores/{businessId}/orders/{orderId}': {
        get: {
          summary: 'Get order by ID',
          tags: ['Orders'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'orderId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        put: {
          summary: 'Update order',
          tags: ['Orders'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'orderId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateOrder' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Order updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      // ===== CUSTOMERS =====
      '/api/admin/stores/{businessId}/customers': {
        get: {
          summary: 'Get all customers',
          tags: ['Customers'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Customer' }
                      },
                      total: { type: 'integer' }
                    }
                  }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        post: {
          summary: 'Create customer',
          tags: ['Customers'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCustomer' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Customer created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Customer' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      '/api/admin/stores/{businessId}/customers/{customerId}': {
        get: {
          summary: 'Get customer by ID',
          tags: ['Customers'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'customerId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Customer' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        put: {
          summary: 'Update customer',
          tags: ['Customers'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'customerId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCustomer' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Customer updated'
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      // ===== CATEGORIES =====
      '/api/admin/stores/{businessId}/categories': {
        get: {
          summary: 'Get all categories',
          tags: ['Categories'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        },
        post: {
          summary: 'Create category',
          tags: ['Categories'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCategory' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Category created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Category' }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      // ===== INVENTORY =====
      '/api/admin/stores/{businessId}/inventory/activities': {
        get: {
          summary: 'Get inventory activities',
          tags: ['Inventory'],
          parameters: [
            {
              name: 'businessId',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            },
            {
              name: 'productId',
              in: 'query',
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InventoryActivity' }
                  }
                }
              }
            }
          },
          security: [{ ApiKeyAuth: [] }]
        }
      },
  
      // ===== STOREFRONT (Public) =====
      '/api/storefront/{slug}': {
        get: {
          summary: 'Get storefront details',
          description: 'Public endpoint to get store information',
          tags: ['Storefront'],
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Business slug/URL'
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Storefront' }
                }
              }
            }
          }
        }
      },
  
      '/api/storefront/{slug}/order': {
        post: {
          summary: 'Create storefront order',
          description: 'Public endpoint for customers to place orders',
          tags: ['Storefront'],
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StorefrontOrder' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Order created successfully'
            }
          }
        }
      }
    },
  
    components: {
      schemas: {
        // ===== BUSINESS =====
        Business: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Pizza Paradise' },
            slug: { type: 'string', example: 'pizza-paradise' },
            description: { type: 'string' },
            logo: { type: 'string', format: 'uri' },
            coverImage: { type: 'string', format: 'uri' },
            phone: { type: 'string', example: '+1234567890' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            whatsappNumber: { type: 'string', example: '+1234567890' },
            businessType: {
              type: 'string',
              enum: ['RESTAURANT', 'CAFE', 'RETAIL', 'JEWELRY', 'FLORIST', 'GROCERY', 'OTHER']
            },
            subscriptionPlan: {
              type: 'string',
              enum: ['FREE', 'BASIC', 'PREMIUM', 'PRO', 'ENTERPRISE']
            },
            currency: { type: 'string', default: 'USD' },
            deliveryFee: { type: 'number', default: 0 },
            minimumOrder: { type: 'number', default: 0 },
            isActive: { type: 'boolean' },
            isTemporarilyClosed: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
  
        UpdateBusiness: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            deliveryFee: { type: 'number' },
            minimumOrder: { type: 'number' }
          }
        },
  
        // ===== PRODUCT =====
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Margherita Pizza' },
            description: { type: 'string' },
            images: {
              type: 'array',
              items: { type: 'string', format: 'uri' }
            },
            price: { type: 'number', example: 12.99 },
            originalPrice: { type: 'number' },
            sku: { type: 'string' },
            stock: { type: 'integer', default: 0 },
            isActive: { type: 'boolean' },
            featured: { type: 'boolean' },
            trackInventory: { type: 'boolean', default: true },
            lowStockAlert: { type: 'integer' },
            categoryId: { type: 'string' },
            businessId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
  
        CreateProduct: {
          type: 'object',
          required: ['name', 'price', 'categoryId'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            originalPrice: { type: 'number' },
            sku: { type: 'string' },
            stock: { type: 'integer', default: 0 },
            categoryId: { type: 'string' },
            images: {
              type: 'array',
              items: { type: 'string' }
            },
            trackInventory: { type: 'boolean' },
            lowStockAlert: { type: 'integer' }
          }
        },
  
        UpdateProduct: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' },
            isActive: { type: 'boolean' },
            featured: { type: 'boolean' }
          }
        },
  
        // ===== ORDER =====
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string', example: 'WO-1234' },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']
            },
            type: {
              type: 'string',
              enum: ['DELIVERY', 'PICKUP', 'DINE_IN']
            },
            customerId: { type: 'string' },
            businessId: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' }
            },
            subtotal: { type: 'number' },
            deliveryFee: { type: 'number' },
            tax: { type: 'number' },
            discount: { type: 'number' },
            total: { type: 'number' },
            deliveryAddress: { type: 'string' },
            notes: { type: 'string' },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
            },
            paymentMethod: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
  
        CreateOrder: {
          type: 'object',
          required: ['customerId', 'items', 'type'],
          properties: {
            customerId: { type: 'string' },
            type: {
              type: 'string',
              enum: ['DELIVERY', 'PICKUP', 'DINE_IN']
            },
            
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  variantId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                  price: { type: 'number' }
                }
              }
            },
            deliveryAddress: { type: 'string' },
            notes: { type: 'string' },
            paymentMethod: { type: 'string' }
          }
        },
  
        UpdateOrder: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
            }
          }
        },
  
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            variantId: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number' },
            modifiers: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
  
        // ===== CUSTOMER =====
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '+1234567890' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            tier: {
              type: 'string',
              enum: ['REGULAR', 'VIP', 'WHOLESALE']
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
  
        CreateCustomer: {
          type: 'object',
          required: ['name', 'phone'],
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            tier: { type: 'string', enum: ['REGULAR', 'VIP', 'WHOLESALE'] }
          }
        },
  
        UpdateCustomer: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' }
          }
        },
  
        // ===== CATEGORY =====
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Pizzas' },
            description: { type: 'string' },
            image: { type: 'string', format: 'uri' },
            sortOrder: { type: 'integer' },
            isActive: { type: 'boolean' }
          }
        },
  
        CreateCategory: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            image: { type: 'string' }
          }
        },
  
        // ===== INVENTORY =====
        InventoryActivity: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            variantId: { type: 'string' },
            type: {
              type: 'string',
              enum: ['MANUAL_INCREASE', 'MANUAL_DECREASE', 'ORDER_SALE', 'RESTOCK', 'ADJUSTMENT', 'LOSS', 'RETURN']
            },
            quantity: { type: 'integer' },
            oldStock: { type: 'integer' },
            newStock: { type: 'integer' },
            reason: { type: 'string' },
            changedBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
  
        // ===== STOREFRONT (Public) =====
        Storefront: {
          type: 'object',
          properties: {
            business: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                logo: { type: 'string' },
                coverImage: { type: 'string' },
                phone: { type: 'string' },
                whatsappNumber: { type: 'string' },
                primaryColor: { type: 'string' },
                isTemporarilyClosed: { type: 'boolean' }
              }
            },
            categories: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' }
            },
            products: {
              type: 'array',
              items: { $ref: '#/components/schemas/Product' }
            }
          }
        },
  
        StorefrontOrder: {
          type: 'object',
          required: ['customer', 'items', 'type'],
          properties: {
            customer: {
                type: 'object',
                required: ['name', 'phone'],
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  address: { type: 'string' }
                }
              },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productId: { type: 'string' },
                    variantId: { type: 'string' },
                    quantity: { type: 'integer', minimum: 1 }
                  }
                }
              },
              type: {
                type: 'string',
                enum: ['DELIVERY', 'PICKUP', 'DINE_IN']
              },
              deliveryAddress: { type: 'string' },
              notes: { type: 'string' },
              paymentMethod: { type: 'string' }
            }
          }
        },
    
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for authentication. Contact support to get your API key.'
          }
        }
      },
    
      tags: [
        {
          name: 'Businesses',
          description: 'Business management endpoints'
        },
        {
          name: 'Products',
          description: 'Product catalog management'
        },
        {
          name: 'Orders',
          description: 'Order management and tracking'
        },
        {
          name: 'Customers',
          description: 'Customer relationship management'
        },
        {
          name: 'Categories',
          description: 'Product category management'
        },
        {
          name: 'Inventory',
          description: 'Inventory tracking and management'
        },
        {
          name: 'Storefront',
          description: 'Public storefront endpoints (no authentication required)'
        }
      ]
    }