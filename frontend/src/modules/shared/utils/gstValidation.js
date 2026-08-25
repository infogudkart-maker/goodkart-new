/**
 * GST Number Validation Utility
 * 
 * GST Format: 15 characters
 * - First 2: State code (digits)
 * - Next 5: PAN card characters (letters)
 * - Next 4: Entity number (digits)
 * - Next 1: Entity type (letter)
 * - Next 1: Default 'Z'
 * - Last 1: Check digit
 * 
 * Example: 29ABCDE1234F1Z5
 */

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Validate GST number format
 * @param {string} gstNumber - GST number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateGST = (gstNumber) => {
    if (!gstNumber || typeof gstNumber !== 'string') {
        return false;
    }
    
    // Remove spaces and convert to uppercase
    const cleanGST = gstNumber.trim().toUpperCase().replace(/\s/g, '');
    
    // Check length
    if (cleanGST.length !== 15) {
        return false;
    }
    
    // Check format with regex
    return GST_REGEX.test(cleanGST);
};

/**
 * Format GST number for display (adds spaces for readability)
 * @param {string} gstNumber - GST number to format
 * @returns {string} - Formatted GST number
 */
export const formatGST = (gstNumber) => {
    if (!gstNumber) return '';
    
    const cleanGST = gstNumber.trim().toUpperCase().replace(/\s/g, '');
    
    if (cleanGST.length !== 15) {
        return cleanGST;
    }
    
    // Format: 29 ABCDE 1234 F1Z 5
    return `${cleanGST.slice(0, 2)} ${cleanGST.slice(2, 7)} ${cleanGST.slice(7, 11)} ${cleanGST.slice(11, 14)} ${cleanGST.slice(14)}`;
};

/**
 * Clean GST number (remove spaces, convert to uppercase)
 * @param {string} gstNumber - GST number to clean
 * @returns {string} - Cleaned GST number
 */
export const cleanGST = (gstNumber) => {
    if (!gstNumber) return '';
    return gstNumber.trim().toUpperCase().replace(/\s/g, '');
};

/**
 * Get GST validation error message
 * @param {string} gstNumber - GST number to validate
 * @returns {string} - Error message or empty string if valid
 */
export const getGSTError = (gstNumber) => {
    if (!gstNumber || !gstNumber.trim()) {
        return 'GST number is required';
    }
    
    const cleanGSTNumber = cleanGST(gstNumber);
    
    if (cleanGSTNumber.length !== 15) {
        return 'GST number must be exactly 15 characters';
    }
    
    if (!validateGST(cleanGSTNumber)) {
        return 'Invalid GST number format. Example: 29ABCDE1234F1Z5';
    }
    
    return '';
};

/**
 * Extract state code from GST number
 * @param {string} gstNumber - GST number
 * @returns {string} - State code (first 2 digits)
 */
export const getStateCodeFromGST = (gstNumber) => {
    if (!gstNumber || gstNumber.length < 2) return '';
    const cleanGSTNumber = cleanGST(gstNumber);
    return cleanGSTNumber.slice(0, 2);
};

/**
 * State codes mapping (for reference)
 */
export const GST_STATE_CODES = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli and Daman and Diu',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh'
};
