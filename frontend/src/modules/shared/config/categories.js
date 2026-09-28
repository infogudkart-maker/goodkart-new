// Shared Categories Configuration
// Updated with Master Category Structure (21 Main Categories)
// Used across: Landing Page, Mega Menu, Seller Product Page, Product Listing

export const MAIN_CATEGORIES = [
  'Fashion (Men)',
  'Fashion (Women)',
  'Kids & Baby',
  'Electronics',
  'Home & Living',
  'Handicrafts',
  'Artworks',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Books & Stationery',
  'Food & Beverages',
  'Gifts & Customization',
  'Jewelry & Accessories',
  'Fabrics & Tailoring Materials',
  'Local Sellers / Homepreneurs',
  'Services',
  'Pet Supplies',
  'Automotive & Accessories',
  'Travel & Utility',
  'Sustainability & Eco-Friendly',
  'Others'
];

// Special categories (shown alongside main categories)
export const SPECIAL_CATEGORIES = [
  "Today's Deals",
  'New Arrivals',
  'Trending'
];

// All categories combined
export const ALL_CATEGORIES = [...MAIN_CATEGORIES, ...SPECIAL_CATEGORIES];

// Subcategories for each main category (first 4 shown by default in mega menu)
export const SUBCATEGORIES = {
  'Fashion (Men)': ['Topwear', 'Bottomwear', 'Ethnic Wear', 'Innerwear & Sleepwear'],
  'Fashion (Women)': ['Topwear', 'Bottomwear', 'Ethnic Wear', 'Western Wear'],
  'Kids & Baby': ['Kids Clothing (0–14 yrs)', 'Baby Essentials', 'Toys & Games', 'School Supplies'],
  'Electronics': ['Mobiles & Accessories', 'Laptops & Accessories', 'Audio', 'Smart Gadgets'],
  'Home & Living': ['Furniture', 'Home Decor', 'Kitchen & Dining', 'Bedding & Furnishings'],
  'Handicrafts': ['Wood Crafts', 'Clay & Pottery', 'Bamboo & Cane Products', 'Textile Crafts'],
  'Artworks': ['Paintings', 'Sketches & Portraits', 'Digital Art Prints', 'Customized Art'],
  'Beauty & Personal Care': ['Skincare', 'Haircare', 'Makeup', 'Organic & Herbal Products'],
  'Sports & Fitness': ['Fitness Equipment', 'Yoga & Meditation', 'Sports Gear', 'Activewear'],
  'Books & Stationery': ['Academic Books', 'Competitive Exam Books', 'Fiction & Non-fiction', 'Notebooks & Journals'],
  'Food & Beverages': ['Snacks & Namkeen', 'Homemade Pickles & Masalas', 'Sweets & Bakery Items', 'Beverages'],
  'Gifts & Customization': ['Personalized Gifts', 'Festive Gift Hampers', 'Corporate Gifts', 'Handmade Gifts'],
  'Jewelry & Accessories': ['Artificial Jewelry', 'Silver Jewelry', 'Handmade Jewelry', 'Bridal Jewelry'],
  'Fabrics & Tailoring Materials': ['Raw Fabrics', 'Handloom Fabrics', 'Sewing Materials', 'Custom Stitching Services'],
  'Local Sellers / Homepreneurs': ['Homemade Foods', 'Handmade Products', 'Custom Orders', 'Regional Specialties'],
  'Services': ['Custom Art Orders', 'Tailoring Services', 'Home Decor Customization', 'Event-based Craft Orders'],
  'Pet Supplies': ['Pet Food', 'Accessories', 'Grooming', 'Handmade Pet Products'],
  'Automotive & Accessories': ['Bike Accessories', 'Car Accessories', 'Cleaning & Maintenance', 'Others'],
  'Travel & Utility': ['Bags & Luggage', 'Travel Accessories', 'Utility Products', 'Others'],
  'Sustainability & Eco-Friendly': ['Eco-friendly Products', 'Recycled Items', 'Zero Waste Kits', 'Sustainable Fashion'],
  'Others': ['Please specify', 'Miscellaneous', 'Custom Category', 'Other Items'],
  "Today's Deals": ['Under ₹499', 'Under ₹999', 'Best Sellers', 'Limited Offers'],
  'New Arrivals': ['Latest Fashion', 'Latest Electronics', 'Trending Now', 'New Brands'],
  'Trending': ['Most Viewed', 'Most Purchased', "Editor's Picks", 'Hot Deals']
};

// All subcategories including "Other" items (complete list from PDF)
export const ALL_SUBCATEGORIES = {
  'Fashion (Men)': [
    'Topwear',
    'Bottomwear',
    'Ethnic Wear',
    'Innerwear & Sleepwear',
    'Footwear',
    'Accessories',
    'Handmade Fashion',
    'Others'
  ],
  'Fashion (Women)': [
    'Topwear',
    'Bottomwear',
    'Ethnic Wear',
    'Western Wear',
    'Innerwear & Nightwear',
    'Footwear',
    'Jewelry',
    'Accessories',
    'Handmade & Boutique Collections',
    'Others'
  ],
  'Kids & Baby': [
    'Kids Clothing (0–14 yrs)',
    'Baby Essentials',
    'Toys & Games',
    'School Supplies',
    'Handmade Kids Wear & Toys',
    'Others'
  ],
  'Electronics': [
    'Mobiles & Accessories',
    'Laptops & Accessories',
    'Audio',
    'Smart Gadgets',
    'Home Appliances',
    'Refurbished Products',
    'Others'
  ],
  'Home & Living': [
    'Furniture',
    'Home Decor',
    'Kitchen & Dining',
    'Bedding & Furnishings',
    'Storage & Organization',
    'Gardening Essentials',
    'Handmade Home Decor',
    'Others'
  ],
  'Handicrafts': [
    'Wood Crafts',
    'Clay & Pottery',
    'Bamboo & Cane Products',
    'Textile Crafts',
    'Metal Crafts',
    'Tribal & Regional Crafts',
    'DIY Craft Kits',
    'Others'
  ],
  'Artworks': [
    'Paintings',
    'Sketches & Portraits',
    'Digital Art Prints',
    'Customized Art',
    'Calligraphy & Handmade Cards',
    'Others'
  ],
  'Beauty & Personal Care': [
    'Skincare',
    'Haircare',
    'Makeup',
    'Organic & Herbal Products',
    'Handmade Soaps & Cosmetics',
    'Grooming Essentials',
    'Others'
  ],
  'Sports & Fitness': [
    'Fitness Equipment',
    'Yoga & Meditation',
    'Sports Gear',
    'Activewear',
    'Outdoor & Adventure',
    'Others'
  ],
  'Books & Stationery': [
    'Academic Books',
    'Competitive Exam Books',
    'Fiction & Non-fiction',
    'Notebooks & Journals',
    'Office Supplies',
    'Handmade Stationery',
    'Others'
  ],
  'Food & Beverages': [
    'Snacks & Namkeen',
    'Homemade Pickles & Masalas',
    'Sweets & Bakery Items',
    'Beverages',
    'Organic & Natural Foods',
    'Others'
  ],
  'Gifts & Customization': [
    'Personalized Gifts',
    'Festive Gift Hampers',
    'Corporate Gifts',
    'Handmade Gifts',
    'Return Gifts',
    'Others'
  ],
  'Jewelry & Accessories': [
    'Artificial Jewelry',
    'Silver Jewelry',
    'Handmade Jewelry',
    'Bridal Jewelry',
    "Men's Jewelry",
    'Others'
  ],
  'Fabrics & Tailoring Materials': [
    'Raw Fabrics',
    'Handloom Fabrics',
    'Sewing Materials',
    'Custom Stitching Services',
    'Others'
  ],
  'Local Sellers / Homepreneurs': [
    'Homemade Foods',
    'Handmade Products',
    'Custom Orders',
    'Regional Specialties',
    'Women-led Businesses',
    'Student Entrepreneurs',
    'Others'
  ],
  'Services': [
    'Custom Art Orders',
    'Tailoring Services',
    'Home Decor Customization',
    'Event-based Craft Orders',
    'Others'
  ],
  'Pet Supplies': [
    'Pet Food',
    'Accessories',
    'Grooming',
    'Handmade Pet Products',
    'Others'
  ],
  'Automotive & Accessories': [
    'Bike Accessories',
    'Car Accessories',
    'Cleaning & Maintenance',
    'Others'
  ],
  'Travel & Utility': [
    'Bags & Luggage',
    'Travel Accessories',
    'Utility Products',
    'Others'
  ],
  'Sustainability & Eco-Friendly': [
    'Eco-friendly Products',
    'Recycled Items',
    'Zero Waste Kits',
    'Sustainable Fashion',
    'Others'
  ],
  'Others': [
    'Please specify',
    'Miscellaneous',
    'Custom Category',
    'Other Items'
  ],
  "Today's Deals": ['Under ₹499', 'Under ₹999', 'Best Sellers', 'Limited Offers', 'Flash Sale', 'Clearance', 'Bundle Deals', 'Daily Deals'],
  'New Arrivals': ['Latest Fashion', 'Latest Electronics', 'Trending Now', 'New Brands', 'Just In', 'Pre-Orders', 'Coming Soon', 'Exclusives'],
  'Trending': ['Most Viewed', 'Most Purchased', "Editor's Picks", 'Hot Deals', 'Viral Products', 'Bestsellers', 'Top Rated', 'Staff Picks']
};

// Seller-specific categories (for product publishing) - All 21 main categories
export const SELLER_CATEGORIES = [
  'Fashion (Men)',
  'Fashion (Women)',
  'Kids & Baby',
  'Electronics',
  'Home & Living',
  'Handicrafts',
  'Artworks',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Books & Stationery',
  'Food & Beverages',
  'Gifts & Customization',
  'Jewelry & Accessories',
  'Fabrics & Tailoring Materials',
  'Local Sellers / Homepreneurs',
  'Services',
  'Pet Supplies',
  'Automotive & Accessories',
  'Travel & Utility',
  'Sustainability & Eco-Friendly',
  'Others'
];

// Get subcategories for a specific category
export const getSubcategories = (category) => {
  return ALL_SUBCATEGORIES[category] || [];
};

// Check if category exists
export const isCategoryValid = (category) => {
  return SELLER_CATEGORIES.includes(category);
};

// Category descriptions for USP categories
export const CATEGORY_DESCRIPTIONS = {
  'Handicrafts': 'OUR CORE USP - Authentic handcrafted products from artisans',
  'Local Sellers / Homepreneurs': 'USP CATEGORY - Game changer category supporting local entrepreneurs',
  'Artworks': 'Unique artistic creations from talented artists',
  'Food & Beverages': 'Note: FSSAI compliance required for food items',
  'Fabrics & Tailoring Materials': 'Important for artisan ecosystem',
  'Services': 'Optional but powerful differentiator',
  'Sustainability & Eco-Friendly': 'Modern + premium positioning'
};
