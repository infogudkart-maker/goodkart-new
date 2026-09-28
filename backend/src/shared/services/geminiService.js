'use strict';
const { GoogleGenerativeAI, SchemaType, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

/**
 * GEMINI SERVICE (DIAGNOSTIC VERSION V3)
 * 
 * Optimized for high-precision Identity Document OCR.
 * Added local file logging to debug-gemini.log for audit.
 */

const logFile = path.join(__dirname, '../../../../debug-gemini.log');

function logDebug(msg) {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logFile, formattedMsg);
    console.log(`[GEMINI_DEBUG] ${msg}`);
}

if (!process.env.GEMINI_API_KEY) {
    logDebug('CRITICAL: GEMINI_API_KEY is not defined in environment variables.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models prioritized by verified stability for this specific API key
const GEMINI_MODELS = [
    'gemini-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro'
];

// Safety settings - Crucial for ID docs which contain sensitive strings that trigger filters
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function extractAadhaarData(imageBuffer, mimeType, retries = 2) {
    logDebug(`--- START NEW EXTRACTION (MIME: ${mimeType}) ---`);

    const prompt = `Analyze this Aadhaar Card image and return ONLY a valid JSON object with these fields. NO MARKDOWN. NO CODE BLOCKS.
    {
      "fullName": "Name in English",
      "aadhaarNumber": "12-digit number (no spaces)",
      "phoneNumber": "10-digit mobile number",
      "age": "Current age (numbers only)",
      "dob": "DD/MM/YYYY",
      "gender": "MALE or FEMALE",
      "address": "Full address with PIN"
    }
    If a field is missing, use empty string "".`;

    const ocrSchema = {
        type: SchemaType.OBJECT,
        properties: {
            fullName: { type: SchemaType.STRING, description: "Full name on the card" },
            aadhaarNumber: { type: SchemaType.STRING, description: "12 digit number without spaces" },
            age: { type: SchemaType.STRING, description: "Calculated current age" },
            dob: { type: SchemaType.STRING, description: "DD/MM/YYYY" },
            gender: { type: SchemaType.STRING },
            address: { type: SchemaType.STRING },
            phoneNumber: { type: SchemaType.STRING }
        },
        required: ["fullName"]
    };

    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logDebug(`Attempt with: ${modelName} | Attempt: ${attempt}`);

                const model = genAI.getGenerativeModel({ model: modelName.trim(), safetySettings });
                const generationConfig = {
                    temperature: 0.1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 2048,
                    responseMimeType: "text/plain",
                };

                const imgPart = { inlineData: { data: imageBuffer.toString("base64"), mimeType } };

                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [imgPart, { text: prompt }] }],
                    generationConfig
                });

                const rawText = result.response.text();
                logDebug(`RAW AI RESPONSE: ${rawText.substring(0, 500)}`);

                const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiData = JSON.parse(cleanJson);

                // --- POST-PROCESSING & MAPPING ---
                const data = {
                    fullName: aiData.fullName || aiData.name || '',
                    aadhaarNumber: (aiData.aadhaarNumber || aiData.aadhaar_no || '').replace(/\D/g, ''),
                    phoneNumber: (aiData.phoneNumber || aiData.phone || '').replace(/\D/g, ''),
                    dob: (aiData.dob || '').trim(),
                    gender: aiData.gender || '',
                    address: aiData.address || '',
                    age: (aiData.age || '').toString().replace(/\D/g, '') // Strip "Age: " or "years"
                };

                // Fallback for Aadhaar number if pattern found in raw text but not in JSON
                if (!data.aadhaarNumber || data.aadhaarNumber.length < 12) {
                    const match = rawText.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}/);
                    if (match) data.aadhaarNumber = match[0].replace(/\D/g, '');
                }

                // Fallback for Phone
                if (!data.phoneNumber || data.phoneNumber.length < 10) {
                    const match = rawText.match(/[6-9]\d{9}/) || rawText.match(/[6-9]\d{4}\s?\d{5}/);
                    if (match) data.phoneNumber = match[0].replace(/\D/g, '');
                }

                // --- AGE CALCULATION ---
                if (data.dob) {
                    try {
                        const dateOnly = data.dob.replace(/[^\d/.-]/g, ''); // Keep numbers, slash, hyphen, dot
                        let birthYear = null;
                        logDebug(`Processing DOB for age: "${data.dob}" -> Cleaned: "${dateOnly}"`);

                        // Scenario 1: DD/MM/YYYY or YYYY/MM/DD (or with - or .)
                        if (dateOnly.includes('/') || dateOnly.includes('-') || dateOnly.includes('.')) {
                            const sep = dateOnly.includes('/') ? '/' : (dateOnly.includes('-') ? '-' : '.');
                            const parts = dateOnly.split(sep);

                            // Ensure there are at least 3 parts for a full date
                            if (parts.length >= 3) {
                                const p1 = parseInt(parts[0]);
                                const p2 = parseInt(parts[1]);
                                const p3 = parseInt(parts[2]);

                                // Find which part is a year (assuming year is 4 digits and within a reasonable range)
                                if (p1 > 1920 && p1 < 2026) birthYear = p1;
                                else if (p3 > 1920 && p3 < 2026) birthYear = p3;
                                else if (p2 > 1920 && p2 < 2026) birthYear = p2; // Less common, but possible for YYYY-DD-MM
                            }
                        }
                        // Scenario 2: Just a 4 digit year (e.g., "1990")
                        else if (dateOnly.length === 4 && /^\d{4}$/.test(dateOnly)) {
                            birthYear = parseInt(dateOnly);
                        }

                        if (birthYear && birthYear > 1920 && birthYear <= new Date().getFullYear()) {
                            const calcAge = new Date().getFullYear() - birthYear;
                            data.age = calcAge.toString();
                            logDebug(`SUCCESS: Calculated Age ${data.age} from year ${birthYear}`);
                        } else {
                            logDebug(`WARNING: Could not determine valid birth year from "${data.dob}" (birthYear: ${birthYear})`);
                        }
                    } catch (e) { logDebug(`Age calculation failed: ${e.message}`); }
                }

                // Final fallback for age: scan REAL raw output (not just JSON) for a year
                if (!data.age || data.age === "0") {
                    // Look for 4-digit years but avoid those that are part of 12-digit blocks
                    const rawNumbers = rawText.replace(/\s+/g, '');
                    const years = rawText.match(/\b(19|20)\d{2}\b/g) || [];

                    for (const yearStr of years) {
                        const year = parseInt(yearStr);
                        if (year > 1940 && year < 2012) {
                            // Check if this year is just part of the Aadhaar number
                            if (data.aadhaarNumber.includes(yearStr)) {
                                logDebug(`Skipping year ${yearStr} - likely part of Aadhaar number.`);
                                continue;
                            }
                            data.age = (new Date().getFullYear() - year).toString();
                            logDebug(`Fallback Age: ${data.age} from matched string: ${yearStr}`);
                            break;
                        }
                    }
                }

                // Final Clean: Ensure age is only digits and not nonsense
                if (data.age) data.age = data.age.replace(/\D/g, '');
                if (!data.age || data.age === "NaN" || data.age === "0") {
                    data.age = (aiData.age || "").toString().replace(/\D/g, '');
                }

                logDebug(`FINAL PARSED: ${JSON.stringify(data)}`);
                return data;

            } catch (err) {
                lastError = err;
                logDebug(`ERROR with ${modelName}: ${err.message}`);

                if (err.status === 404) {
                    logDebug(`Model ${modelName} not found, trying next...`);
                    continue;
                }
                if (err.status === 429) { await delay(2000); continue; }
                await delay(1000);
            }
        }
    }
    throw lastError || new Error("ID extraction failed completely.");
}

module.exports = { extractAadhaarData };
