/**
 * Shiprocket Shipment Service
 * Handles tracking, courier assignment, AWBs, and shipping labels
 */
class ShiprocketShipmentService {
  /**
   * @param {Object} coreService - The main ShiprocketService instance containing makeApiRequest and properties
   */
  constructor(coreService) {
    this.core = coreService;
  }

  /**
   * Get shipment tracking details
   * @param {string} shipmentId - Shiprocket shipment ID
   * @returns {Promise<Object>} Tracking details
   */
  async getShipmentTracking(shipmentId) {
    if (!this.core.enabled) {
      return { success: false, error: 'Shiprocket service is disabled' };
    }

    try {
      console.log(`🔍 Fetching tracking for shipment ${shipmentId}...`);

      const token = await this.core.getAuthToken();
      if (!token) {
        throw new Error('Failed to obtain authentication token');
      }

      // using axios directly requires requiring it in this file or accessing via core,
      // but the original code used axios.get directly. Since makeApiRequest handles it better,
      // let's see how original did it: original used axios.get directly. Just to be safe,
      // I'll require axios here.
      const axios = require('axios');
      const response = await axios.get(
        `${this.core.apiUrl}/courier/track/shipment/${shipmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data) {
        console.log('✅ Tracking details fetched successfully');
        return { success: true, tracking: response.data };
      } else {
        return { success: false, error: 'No tracking data available' };
      }
    } catch (error) {
      console.error(`❌ Tracking fetch error:`, {
        shipmentId,
        error: error.message,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Fetch available couriers for a Shiprocket order
   * @param {string} orderId - Shiprocket Order ID
   * @returns {Promise<Object>} List of couriers
   */
  async getAvailableCouriers(orderId) {
    if (!this.core.enabled) return { success: false, error: 'Service disabled' };

    try {
      console.log(`🚚 Fetching couriers for order ${orderId}...`);
      const data = await this.core.makeApiRequest(
        `${this.core.apiUrl}/courier/serviceability/?order_id=${orderId}`,
        null,
        { retries: 3, requiresAuth: true, orderId, method: 'GET' }
      );

      if (data && data.data && data.data.available_courier_companies) {
        return {
          success: true,
          couriers: data.data.available_courier_companies
        };
      }
      return { success: false, error: 'No couriers available' };
    } catch (error) {
      console.error(`❌ Courier fetch error for order ${orderId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Select best courier from available options
   * (Priority: Recommended -> Highest Rated -> Cheapest)
   * @param {Array} couriers - List of available couriers
   * @returns {Object} Selected courier
   */
  selectBestCourier(couriers) {
    if (!couriers || couriers.length === 0) return null;

    // Filter out unserviceable ones just in case
    const valid = couriers.filter(c => c.estimated_delivery_days);
    if (valid.length === 0) return couriers[0];

    // ATTEMPT TO SORT:
    // 1. By Rating
    // 2. By lowest rate
    valid.sort((a, b) => {
      // higher rating first
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      // then lower price
      return (a.rate || 0) - (b.rate || 0);
    });

    return valid[0];
  }

  /**
   * Assign courier to generate AWB
   * @param {string} shipmentId - Shiprocket Shipment ID
   * @param {number} courierId - Courier ID to assign
   * @param {string} orderId - Order ID for logging
   * @returns {Promise<Object>} Assignment result
   */
  async assignCourier(shipmentId, courierId, orderId) {
    if (!this.core.enabled) return { success: false, error: 'Service disabled' };

    try {
      console.log(`📦 Assigning courier ${courierId} to shipment ${shipmentId}...`);

      const data = await this.core.makeApiRequest(
        `${this.core.apiUrl}/courier/assign/awb`,
        {
          shipment_id: shipmentId,
          courier_id: courierId
        },
        { retries: 3, requiresAuth: true, orderId }
      );

      if (data && data.response && data.response.data && data.response.data.awb_assign_status === 1) {
        return {
          success: true,
          awbNumber: data.response.data.awb_code,
          courierName: data.response.data.courier_name
        };
      }
      return { success: false, error: 'Failed to assign AWB', details: data };
    } catch (error) {
      console.error(`❌ Courier assignment error for shipment ${shipmentId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Poll for AWB generation verification
   * @param {string} shipmentId 
   * @param {number} maxAttempts 
   * @param {number} delayMs 
   */
  async verifyAWBGeneration(shipmentId, maxAttempts = 5, delayMs = 3000) {
    if (!this.core.enabled) return { success: false, error: 'Service disabled' };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`⏳ Verifying AWB for shipment ${shipmentId} (Attempt ${attempt}/${maxAttempts})...`);

      const tracking = await this.getShipmentTracking(shipmentId);

      if (tracking.success && tracking.tracking) {
        return { success: true, tracking: tracking.tracking };
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return { success: false, error: 'Timeout verifying AWB' };
  }

  /**
   * Main orchestrator for auto assigning and getting AWB
   */
  async autoAssignCourierAndGenerateAWB(orderId, shipmentId, internalOrderId, initialDelayMs = 3000) {
    if (!this.core.enabled) return { success: false, error: 'Service disabled' };

    try {
      console.log(`🔄 Starting Auto Courier Assignment for Order ${internalOrderId}...`);

      // Initial delay to let Shiprocket process the newly created shipment
      await new Promise(resolve => setTimeout(resolve, initialDelayMs));

      // 1. Get available couriers
      const couriersRes = await this.getAvailableCouriers(orderId);
      if (!couriersRes.success || !couriersRes.couriers || couriersRes.couriers.length === 0) {
        return { success: false, error: 'No couriers available for this order' };
      }

      // 2. Select best courier
      const bestCourier = this.selectBestCourier(couriersRes.couriers);
      if (!bestCourier) {
        return { success: false, error: 'Failed to select best courier' };
      }

      console.log(`✨ Selected best courier: ${bestCourier.courier_name} (₹${bestCourier.rate}, ${bestCourier.estimated_delivery_days} days)`);

      // 3. Assign courier to generate AWB
      const assignRes = await this.assignCourier(shipmentId, bestCourier.courier_company_id, orderId);
      if (!assignRes.success) {
        return { success: false, error: assignRes.error, details: assignRes.details };
      }

      console.log(`✅ AWB Generated successfully: ${assignRes.awbNumber}`);

      return {
        success: true,
        awbNumber: assignRes.awbNumber,
        courierName: assignRes.courierName || bestCourier.courier_name,
        courierId: bestCourier.courier_company_id,
        courierRate: bestCourier.rate,
        estimatedDeliveryDays: bestCourier.estimated_delivery_days
      };

    } catch (error) {
      console.error(`❌ Auto Assign Error for order ${internalOrderId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch shipping label from Shiprocket
   * @param {Array<string>} shipmentIds - Array of shipment IDs (e.g., [12345])
   * @returns {Promise<Object>} Label details including URL
   */
  async getShippingLabel(shipmentIds) {
    if (!this.core.enabled) return { success: false, error: 'Service disabled' };

    try {
      console.log(`📄 Fetching shipping label for shipments: ${shipmentIds.join(', ')}...`);

      const data = await this.core.makeApiRequest(
        `${this.core.apiUrl}/courier/generate/label`,
        { shipment_id: shipmentIds },
        { retries: 3, requiresAuth: true, orderId: shipmentIds[0] }
      );

      if (data && data.label_created === 1) {
        return {
          success: true,
          labelUrl: data.label_url,
          message: 'Label generated successfully'
        };
      }

      return { success: false, error: 'Failed to generate label', details: data };
    } catch (error) {
      console.error(`❌ Shipping label fetch error:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ShiprocketShipmentService;
