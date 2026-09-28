const axios = require('axios');
const ShiprocketOrderService = require('./shiprocketOrderService');
const ShiprocketShipmentService = require('./shiprocketShipmentService');

/**
 * Shiprocket Service (Core)
 * Handles authentication, API interactions, and delegates to specific services
 */
class ShiprocketService {
  constructor() {
    // Configuration from environment variables
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.apiUrl = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external';
    this.webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

    // Token management
    this.authToken = null;
    this.tokenExpiresAt = null;

    // Feature flag
    this.enabled = this.validateConfiguration();

    if (this.enabled) {
      console.log('✅ Shiprocket service initialized successfully');
    } else {
      console.warn('⚠️  Shiprocket credentials not configured. Shipping integration disabled.');
    }

    // Initialize sub-services
    this.orders = new ShiprocketOrderService(this);
    this.shipments = new ShiprocketShipmentService(this);
  }

  /**
   * Validate that required environment variables are set
   * @returns {boolean} True if configuration is valid
   */
  validateConfiguration() {
    if (!this.email || !this.password) {
      return false;
    }
    return true;
  }

  /**
   * Authenticate with Shiprocket API and get auth token
   * @returns {Promise<string|null>} Auth token or null on failure
   */
  async authenticate() {
    if (!this.enabled) {
      console.warn('⚠️  Shiprocket authentication skipped - service disabled');
      return null;
    }

    try {
      console.log('🔐 Authenticating with Shiprocket API...');

      const response = await axios.post(
        `${this.apiUrl}/auth/login`,
        {
          email: this.email,
          password: this.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        // Shiprocket tokens typically expire after 10 days, but we'll refresh after 9 days to be safe
        this.tokenExpiresAt = Date.now() + (9 * 24 * 60 * 60 * 1000);

        console.log('✅ Shiprocket authentication successful');
        return this.authToken;
      } else {
        console.error('❌ Shiprocket authentication failed: No token in response');
        return null;
      }
    } catch (error) {
      console.error('❌ Shiprocket authentication error:', error.message);

      // Log additional details without exposing credentials
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      // Disable integration on authentication failure
      this.enabled = false;
      return null;
    }
  }

  /**
   * Get valid auth token with automatic refresh
   * @returns {Promise<string|null>} Valid auth token or null
   */
  async getAuthToken() {
    if (!this.enabled) {
      return null;
    }

    // Check if we have a valid cached token
    if (this.authToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.authToken;
    }

    // Token expired or doesn't exist, authenticate
    console.log('🔄 Token expired or missing, re-authenticating...');
    return await this.authenticate();
  }

  /**
   * Make API request with comprehensive error handling and retry logic
   * @param {string} url - API endpoint URL
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response data
   */
  async makeApiRequest(url, data, options = {}) {
    const {
      retries = 3,
      requiresAuth = true,
      orderId = 'unknown'
    } = options;

    let lastError = null;
    let attempt = 0;
    let hasReauthenticated = false;

    while (attempt < retries) {
      attempt++;

      try {
        // Get auth token if required
        let headers = {
          'Content-Type': 'application/json'
        };

        if (requiresAuth) {
          const token = await this.getAuthToken();
          if (!token) {
            throw new Error('Failed to obtain authentication token');
          }
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Make the API request
        console.log(`🔄 API ${options.method || 'POST'} request attempt ${attempt}/${retries} for order ${orderId}`);

        const reqConfig = {
          method: options.method || 'POST',
          url: url,
          headers,
          timeout: 10000 // 10 second timeout
        };

        if (reqConfig.method.toUpperCase() !== 'GET') {
          reqConfig.data = data;
        }

        const response = await axios(reqConfig);

        // Success - return response data
        console.log(`✅ API request successful for order ${orderId}`);
        return response.data;

      } catch (error) {
        lastError = error;

        // Extract error details safely
        const statusCode = error.response?.status;
        const errorMessage = error.message;
        const errorData = error.response?.data;

        // Log error with context (without exposing credentials)
        console.error(`❌ API request error (attempt ${attempt}/${retries}) for order ${orderId}:`, {
          status: statusCode,
          message: errorMessage,
          code: error.code,
          details: errorData // Added to see exactly why it's failing (422 validation errors)
        });

        // Handle authentication errors (401)
        if (statusCode === 401 && !hasReauthenticated) {
          console.warn(`⚠️  Authentication error for order ${orderId}, attempting re-authentication...`);

          // Clear cached token and re-authenticate once
          this.authToken = null;
          this.tokenExpiresAt = null;
          hasReauthenticated = true;

          const newToken = await this.authenticate();
          if (newToken) {
            console.log(`✅ Re-authentication successful for order ${orderId}, retrying request...`);
            continue; // Retry with new token
          } else {
            console.error(`❌ Re-authentication failed for order ${orderId}`);
            throw new Error('Authentication failed after retry');
          }
        }

        // Handle rate limit errors (429)
        if (statusCode === 429) {
          console.error(`❌ Rate limit exceeded for order ${orderId}:`, {
            orderId,
            status: statusCode,
            message: 'Shiprocket API rate limit reached'
          });
          throw new Error('Rate limit exceeded - order marked for retry');
        }

        // Handle validation errors (400)
        if (statusCode === 400) {
          console.error(`❌ Validation error for order ${orderId}:`, {
            orderId,
            status: statusCode,
            errorData: errorData,
            message: 'Invalid data sent to Shiprocket API'
          });
          throw new Error('Validation error - check order data');
        }

        // Handle network timeout errors
        const isTimeoutError = error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT' ||
          errorMessage.includes('timeout');

        if (isTimeoutError) {
          console.warn(`⚠️  Network timeout for order ${orderId} (attempt ${attempt}/${retries})`);

          if (attempt < retries) {
            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue; // Retry
          }
        }

        // Handle other network errors (ECONNREFUSED, ENOTFOUND, etc.)
        const isNetworkError = error.code === 'ECONNREFUSED' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'EAI_AGAIN';

        if (isNetworkError && attempt < retries) {
          console.warn(`⚠️  Network error for order ${orderId} (attempt ${attempt}/${retries}):`, error.code);

          // Exponential backoff
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue; // Retry
        }

        // If we've exhausted retries or hit a non-retryable error, break
        if (attempt >= retries || statusCode === 400 || statusCode === 429) {
          break;
        }

        // For other errors, retry with backoff
        if (attempt < retries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Waiting ${backoffMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries exhausted
    console.error(`❌ All retry attempts exhausted for order ${orderId}`);
    throw lastError;
  }

  /**
   * Map Shiprocket status to internal 5-stage model
   * @param {string} shiprocketStatus - Status from Shiprocket webhook
   * @returns {string} Internal status (ORDERED, PACKING, SHIPPING, OUT_FOR_DELIVERY, DELIVERED)
   */
  mapShiprocketStatus(shiprocketStatus) {
    if (!shiprocketStatus) {
      return 'ORDERED';
    }

    // Normalize status to uppercase for case-insensitive matching
    const status = shiprocketStatus.toUpperCase();

    // Map Shiprocket statuses to internal 5-stage model
    // PACKING stage: Order is being prepared
    if (status === 'NEW' || status === 'PENDING' || status === 'READY_TO_SHIP') {
      return 'PACKING';
    }

    // SHIPPING stage: Package is in transit
    if (status === 'SHIPPED' || status === 'IN_TRANSIT' ||
      status === 'PICKUP_SCHEDULED' || status === 'PICKUP_COMPLETE') {
      return 'SHIPPING';
    }

    // OUT_FOR_DELIVERY stage: Package is out for final delivery
    if (status === 'OUT_FOR_DELIVERY') {
      return 'OUT_FOR_DELIVERY';
    }

    // DELIVERED stage: Package has been delivered
    if (status === 'DELIVERED') {
      return 'DELIVERED';
    }

    // Default to ORDERED for unknown statuses
    console.warn(`⚠️  Unknown Shiprocket status: ${shiprocketStatus}, defaulting to ORDERED`);
    return 'ORDERED';
  }

  /**
   * Verify webhook signature using HMAC SHA256
   * @param {Object} payload - Webhook payload object
   * @param {string} signature - Signature from X-Shiprocket-Signature header
   * @returns {boolean} True if signature is valid, false otherwise
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      console.error('❌ Webhook secret not configured');
      return false;
    }

    if (!signature) {
      console.error('❌ No signature provided');
      return false;
    }

    try {
      const crypto = require('crypto');

      // Convert payload to string if it's an object
      const payloadString = typeof payload === 'string'
        ? payload
        : JSON.stringify(payload);

      // Create HMAC with SHA256
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(payloadString);
      const expectedSignature = hmac.digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');

      // Ensure buffers are same length before comparison
      if (expectedBuffer.length !== signatureBuffer.length) {
        console.error('❌ Signature length mismatch');
        return false;
      }

      // Timing-safe comparison
      const isValid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      console.error('❌ Error verifying webhook signature:', error.message);
      return false;
    }
  }

  // ==========================================
  // DELEGATED METHODS TO MAINTAIN BACKWARD COMPATIBILITY
  // ==========================================

  // --- Order Methods ---
  async createShipment(orderData) {
    return this.orders.createShipment(orderData);
  }
  
  async cancelOrder(shiprocketOrderId, internalOrderId) {
    return this.orders.cancelOrder(shiprocketOrderId, internalOrderId);
  }
  
  async createPickupAddress(sellerData) {
    return this.orders.createPickupAddress(sellerData);
  }

  // --- Shipment Methods ---
  async getShipmentTracking(shipmentId) {
    return this.shipments.getShipmentTracking(shipmentId);
  }
  
  async getAvailableCouriers(orderId) {
    return this.shipments.getAvailableCouriers(orderId);
  }
  
  selectBestCourier(couriers) {
    return this.shipments.selectBestCourier(couriers);
  }
  
  async assignCourier(shipmentId, courierId, orderId) {
    return this.shipments.assignCourier(shipmentId, courierId, orderId);
  }
  
  async verifyAWBGeneration(shipmentId, maxAttempts, delayMs) {
    return this.shipments.verifyAWBGeneration(shipmentId, maxAttempts, delayMs);
  }
  
  async autoAssignCourierAndGenerateAWB(orderId, shipmentId, internalOrderId, initialDelayMs) {
    return this.shipments.autoAssignCourierAndGenerateAWB(orderId, shipmentId, internalOrderId, initialDelayMs);
  }
  
  async getShippingLabel(shipmentIds) {
    return this.shipments.getShippingLabel(shipmentIds);
  }
}

// Export singleton instance
module.exports = new ShiprocketService();
