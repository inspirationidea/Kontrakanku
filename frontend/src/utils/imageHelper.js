/**
 * Curated list of premium, high-resolution house and property images from Unsplash.
 * These are used as placeholders to give the application a stunning, professional look.
 */
export const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80', // Cozy classic house
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', // Modern luxury villa
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80', // Elegant suburban residence
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', // Modern architectural house
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', // Elegant modern home
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=800&q=80'  // Stylish residential duplex
];

/**
 * Get a deterministic placeholder image based on the property ID or name.
 * This ensures that different properties get different premium placeholders,
 * making the grid look extremely rich and realistic.
 */
export const getPlaceholderImage = (seedString) => {
  if (!seedString) return PLACEHOLDER_IMAGES[0];
  const charCodeSum = seedString.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PLACEHOLDER_IMAGES[charCodeSum % PLACEHOLDER_IMAGES.length];
};

/**
 * Formats the property image URL. If it's a relative path, prepends the backend base URL.
 * If it's empty or null, returns a deterministic premium placeholder.
 */
export const getPropertyImageUrl = (coverImage, seedString) => {
  if (!coverImage) {
    return getPlaceholderImage(seedString);
  }
  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    return coverImage;
  }
  // Prepend backend port/domain (defaulting to localhost:4000 if not configured)
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  return `${baseUrl}${coverImage}`;
};

/**
 * An onError event handler for <img> tags to gracefully handle broken images (e.g. 404s).
 * If the image fails to load, it falls back to a deterministic premium placeholder.
 */
export const handleImageError = (e, seedString) => {
  e.target.onerror = null; // Prevent infinite loop if placeholder also fails
  e.target.src = getPlaceholderImage(seedString);
};
