// Product Variants Configuration
// Defines which variant options are available for each category

export const VARIANT_CONFIGS = {
  "Electronics": {
    icon: "📱",
    hasColors: true,
    hasVariants: true,
    colorPresets: ["Black", "White", "Silver", "Space Gray", "Gold", "Blue", "Red", "Green"],
    variantTypes: [
      {
        key: "storage",
        label: "Storage",
        presets: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]
      },
      {
        key: "memory",
        label: "RAM / Memory",
        presets: ["4GB", "6GB", "8GB", "12GB", "16GB", "32GB", "64GB"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Processor", "Display", "Battery", "Camera", "Weight", "OS", "Warranty", "Connectivity"]
  },

  "Fashion (Men)": {
    icon: "👔",
    hasSizes: true,
    hasColors: true,
    defaultSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    colorPresets: ["Black", "White", "Blue", "Grey", "Navy", "Red", "Green", "Brown", "Beige"],
    hasVariants: true,
    variantTypes: [
      {
        key: "fit",
        label: "Fit Type",
        presets: ["Slim Fit", "Regular Fit", "Loose Fit", "Athletic Fit"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Pattern", "Sleeve", "Collar", "Occasion", "Wash Care", "Country of Origin"]
  },

  "Fashion (Women)": {
    icon: "👗",
    hasSizes: true,
    hasColors: true,
    defaultSizes: ["XS", "S", "M", "L", "XL", "XXL", "Free Size"],
    colorPresets: ["Black", "White", "Red", "Pink", "Blue", "Green", "Yellow", "Purple", "Beige", "Multi-color"],
    hasVariants: true,
    variantTypes: [
      {
        key: "style",
        label: "Style",
        presets: ["Casual", "Formal", "Party Wear", "Ethnic", "Western"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Pattern", "Sleeve", "Neck", "Length", "Occasion", "Wash Care"]
  },

  "Kids & Baby": {
    icon: "👶",
    hasSizes: true,
    hasColors: true,
    defaultSizes: ["0-3M", "3-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "6-8Y", "8-10Y", "10-12Y", "12-14Y"],
    colorPresets: ["Pink", "Blue", "Yellow", "White", "Red", "Green", "Multi-color"],
    hasVariants: true,
    variantTypes: [
      {
        key: "ageGroup",
        label: "Age Group",
        presets: ["0-1 Year", "1-3 Years", "3-5 Years", "5-8 Years", "8-14 Years"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Age Group", "Safety Standards", "Wash Care", "Country of Origin"]
  },

  "Home & Living": {
    icon: "🏠",
    hasColors: true,
    hasDimensions: true,
    colorPresets: ["White", "Black", "Brown", "Grey", "Beige", "Blue", "Green", "Natural Wood"],
    hasVariants: true,
    variantTypes: [
      {
        key: "size",
        label: "Size / Dimensions",
        presets: ["Small", "Medium", "Large", "Extra Large", "Custom"]
      },
      {
        key: "material",
        label: "Material",
        presets: ["Wood", "Metal", "Plastic", "Glass", "Fabric", "Ceramic"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Dimensions", "Weight", "Assembly Required", "Warranty", "Care Instructions"]
  },

  "Handicrafts": {
    icon: "🎨",
    hasColors: true,
    hasCustomAttributes: true,
    colorPresets: ["Natural", "Brown", "Red", "Blue", "Gold", "Multi-color", "Hand-painted"],
    hasSpecifications: true,
    specPresets: ["Material", "Origin", "Technique", "Weight", "Dimensions", "Care", "Artisan Info"]
  },

  "Artworks": {
    icon: "🖼️",
    hasColors: true,
    hasCustomAttributes: true,
    colorPresets: ["Black & White", "Colored", "Sepia", "Multi-color"],
    hasVariants: true,
    variantTypes: [
      {
        key: "size",
        label: "Canvas Size",
        presets: ["A4", "A3", "12x16", "16x20", "20x24", "24x36", "Custom"]
      },
      {
        key: "frame",
        label: "Frame Type",
        presets: ["Unframed", "Wooden Frame", "Metal Frame", "Canvas Stretched"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Artist", "Medium", "Dimensions", "Year", "Style", "Signed", "Certificate"]
  },

  "Beauty & Personal Care": {
    icon: "💄",
    hasSizes: true,
    hasColors: true,
    defaultSizes: ["30ml", "50ml", "100ml", "150ml", "200ml", "250ml", "500ml"],
    colorPresets: ["Fair", "Medium", "Dark", "Universal", "Nude", "Pink", "Red", "Brown"],
    hasVariants: true,
    variantTypes: [
      {
        key: "skinType",
        label: "Skin Type",
        presets: ["Oily", "Dry", "Combination", "Sensitive", "All Skin Types"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Ingredients", "Skin Type", "Volume", "Usage", "Shelf Life", "Country of Origin", "Dermatologically Tested"]
  },

  "Sports & Fitness": {
    icon: "🏋️",
    hasSizes: true,
    hasColors: true,
    defaultSizes: ["S", "M", "L", "XL", "XXL", "Free Size"],
    colorPresets: ["Black", "White", "Red", "Blue", "Grey", "Neon Green", "Orange", "Yellow"],
    hasVariants: true,
    variantTypes: [
      {
        key: "type",
        label: "Type",
        presets: ["Indoor", "Outdoor", "Professional", "Beginner", "Intermediate"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Weight Capacity", "Dimensions", "Warranty", "Usage", "Age Group"]
  },

  "Books & Stationery": {
    icon: "📚",
    hasSpecifications: true,
    specPresets: ["Author", "Publisher", "Language", "Pages", "ISBN", "Edition", "Binding", "Publication Date"]
  },

  "Food & Beverages": {
    icon: "🍽️",
    hasVariants: true,
    variantTypes: [
      {
        key: "weight",
        label: "Pack Size / Weight",
        presets: ["100g", "250g", "500g", "1kg", "2kg", "5kg"]
      },
      {
        key: "flavor",
        label: "Flavor / Variant",
        presets: ["Original", "Spicy", "Sweet", "Salty", "Mixed"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Ingredients", "Shelf Life", "Storage", "Allergens", "Nutritional Info", "FSSAI License", "Country of Origin"]
  },

  "Gifts & Customization": {
    icon: "🎁",
    hasColors: true,
    hasCustomAttributes: true,
    colorPresets: ["Red", "Gold", "Silver", "Blue", "Pink", "Multi-color"],
    hasVariants: true,
    variantTypes: [
      {
        key: "occasion",
        label: "Occasion",
        presets: ["Birthday", "Anniversary", "Wedding", "Corporate", "Festival"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Customization", "Material", "Dimensions", "Packaging", "Delivery Time"]
  },

  "Jewelry & Accessories": {
    icon: "💍",
    hasColors: true,
    hasSizes: true,
    defaultSizes: ["One Size", "Small", "Medium", "Large", "Adjustable"],
    colorPresets: ["Gold", "Silver", "Rose Gold", "Black", "Multi-color"],
    hasVariants: true,
    variantTypes: [
      {
        key: "material",
        label: "Material",
        presets: ["Gold Plated", "Silver", "Artificial", "Brass", "Copper", "Beads"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Weight", "Dimensions", "Warranty", "Care Instructions", "Occasion"]
  },

  "Fabrics & Tailoring Materials": {
    icon: "🧵",
    hasColors: true,
    colorPresets: ["White", "Black", "Red", "Blue", "Green", "Yellow", "Multi-color", "Printed"],
    hasVariants: true,
    variantTypes: [
      {
        key: "length",
        label: "Length / Quantity",
        presets: ["1 Meter", "2 Meters", "5 Meters", "10 Meters", "Full Roll"]
      },
      {
        key: "material",
        label: "Fabric Type",
        presets: ["Cotton", "Silk", "Polyester", "Linen", "Wool", "Handloom"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Width", "GSM", "Pattern", "Wash Care", "Origin"]
  },

  "Local Sellers / Homepreneurs": {
    icon: "🏪",
    hasColors: true,
    hasCustomAttributes: true,
    colorPresets: ["Natural", "Multi-color", "Custom"],
    hasSpecifications: true,
    specPresets: ["Made By", "Location", "Material", "Handmade", "Custom Order", "Delivery Time"]
  },

  "Services": {
    icon: "🛠️",
    hasCustomAttributes: true,
    hasSpecifications: true,
    specPresets: ["Service Type", "Duration", "Availability", "Location", "Experience", "Pricing"]
  },

  "Pet Supplies": {
    icon: "🐾",
    hasSizes: true,
    hasColors: true,
    defaultSizes: ["Small", "Medium", "Large", "XL"],
    colorPresets: ["Red", "Blue", "Black", "Pink", "Green", "Multi-color"],
    hasVariants: true,
    variantTypes: [
      {
        key: "petType",
        label: "Pet Type",
        presets: ["Dog", "Cat", "Bird", "Fish", "Small Animals"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Pet Type", "Size", "Material", "Age Group", "Ingredients", "Usage"]
  },

  "Automotive & Accessories": {
    icon: "🚗",
    hasColors: true,
    colorPresets: ["Black", "Silver", "Red", "Blue", "Universal"],
    hasVariants: true,
    variantTypes: [
      {
        key: "vehicleType",
        label: "Vehicle Type",
        presets: ["Car", "Bike", "Universal"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Compatible With", "Material", "Dimensions", "Installation", "Warranty"]
  },

  "Travel & Utility": {
    icon: "🧳",
    hasSizes: true,
    hasColors: true,
    defaultSizes: ["Small", "Medium", "Large", "XL"],
    colorPresets: ["Black", "Blue", "Red", "Grey", "Multi-color"],
    hasVariants: true,
    variantTypes: [
      {
        key: "capacity",
        label: "Capacity",
        presets: ["20L", "30L", "40L", "50L", "60L+"]
      }
    ],
    hasSpecifications: true,
    specPresets: ["Material", "Capacity", "Dimensions", "Weight", "Warranty", "Water Resistant"]
  },

  "Sustainability & Eco-Friendly": {
    icon: "♻️",
    hasColors: true,
    colorPresets: ["Natural", "Green", "Brown", "Beige", "Eco-friendly"],
    hasCustomAttributes: true,
    hasSpecifications: true,
    specPresets: ["Material", "Eco Certification", "Biodegradable", "Recyclable", "Carbon Footprint", "Origin"]
  },

  "Others": {
    icon: "📦",
    hasColors: true,
    hasSizes: true,
    hasCustomAttributes: true,
    defaultSizes: ["Small", "Medium", "Large"],
    colorPresets: ["Black", "White", "Red", "Blue", "Green"],
    hasSpecifications: true,
    specPresets: ["Material", "Dimensions", "Weight", "Usage", "Warranty"]
  }
};

// Get variant configuration for a category
export const getVariantConfig = (category) => {
  return VARIANT_CONFIGS[category] || VARIANT_CONFIGS["Others"];
};

// Check if category has specific variant type
export const hasVariantType = (category, variantType) => {
  const config = getVariantConfig(category);
  return config[variantType] === true;
};

// Get available sizes for a category
export const getSizesForCategory = (category) => {
  const config = getVariantConfig(category);
  return config.defaultSizes || [];
};

// Get available colors for a category
export const getColorsForCategory = (category) => {
  const config = getVariantConfig(category);
  return config.colorPresets || [];
};

// Get variant types for a category
export const getVariantTypesForCategory = (category) => {
  const config = getVariantConfig(category);
  return config.variantTypes || [];
};
