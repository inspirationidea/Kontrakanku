import prisma from '../config/prisma.js';
import { success, error } from '../utils/response.js';

/**
 * Fetch all properties (useful for the interactive map markers)
 */
export const getProperties = async (req, res, next) => {
  try {
    const { search, minPrice, maxPrice } = req.query;

    // Build filter query dynamically
    const filter = {};
    
    if (search) {
      filter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.units = {
        some: {
          price: {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          },
          status: 'AVAILABLE',
        },
      };
    }

    const properties = await prisma.property.findMany({
      where: filter,
      include: {
        photos: {
          orderBy: { order: 'asc' },
        },
        units: {
          select: {
            price: true,
            status: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Format properties to include starting price and average rating
    const formattedProperties = properties.map((prop) => {
      const availableUnits = prop.units.filter((u) => u.status === 'AVAILABLE');
      const startPrice = availableUnits.length > 0 
        ? Math.min(...availableUnits.map((u) => u.price))
        : 0;

      const avgRating = prop.reviews.length > 0
        ? prop.reviews.reduce((acc, curr) => acc + curr.rating, 0) / prop.reviews.length
        : 0;

      return {
        id: prop.id,
        name: prop.name,
        address: prop.address,
        lat: prop.lat,
        lng: prop.lng,
        description: prop.description,
        coverImage: prop.coverImage,
        startPrice,
        avgRating,
        totalUnits: prop.units.length,
        availableUnitsCount: availableUnits.length,
        photos: prop.photos,
      };
    });

    return success(res, formattedProperties, 'Properties retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch property by ID with extensive details (units, photos, reviews)
 */
export const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { order: 'asc' },
        },
        units: {
          orderBy: { unitNumber: 'asc' },
          include: {
            photos: { orderBy: { order: 'asc' } },
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        admin: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!property) {
      return error(res, 'Property not found', 404);
    }

    // Calculate rating metrics
    const avgRating = property.reviews.length > 0
      ? property.reviews.reduce((acc, curr) => acc + curr.rating, 0) / property.reviews.length
      : 0;

    const detailedProperty = {
      ...property,
      avgRating,
      totalReviews: property.reviews.length,
    };

    return success(res, detailedProperty, 'Property details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new property listing
 */
export const createProperty = async (req, res, next) => {
  try {
    const { name, address, lat, lng, description } = req.body;

    if (!name || !address || lat === undefined || lng === undefined) {
      return error(res, 'Name, address, latitude, and longitude are required', 400);
    }

    // Handle files upload
    let coverImagePath = null;
    if (req.file) {
      coverImagePath = `/uploads/properties/${req.file.filename}`;
    }

    const property = await prisma.property.create({
      data: {
        name,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description,
        coverImage: coverImagePath,
        adminId: req.user.id, // Current logged in Admin/Owner
      },
    });

    return success(res, property, 'Property created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing property
 */
export const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, lat, lng, description } = req.body;

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return error(res, 'Property not found', 404);
    }

    // Authorization: Only the property owner or Superadmin can edit
    if (existingProperty.adminId !== req.user.id && req.user.role !== 'SUPERADMIN') {
      return error(res, 'You do not have permission to modify this property', 403);
    }

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (address) dataToUpdate.address = address;
    if (lat !== undefined) dataToUpdate.lat = parseFloat(lat);
    if (lng !== undefined) dataToUpdate.lng = parseFloat(lng);
    if (description !== undefined) dataToUpdate.description = description;
    
    if (req.file) {
      dataToUpdate.coverImage = `/uploads/properties/${req.file.filename}`;
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: dataToUpdate,
    });

    return success(res, updatedProperty, 'Property updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a property
 */
export const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return error(res, 'Property not found', 404);
    }

    if (existingProperty.adminId !== req.user.id && req.user.role !== 'SUPERADMIN') {
      return error(res, 'You do not have permission to delete this property', 403);
    }

    await prisma.property.delete({
      where: { id },
    });

    return success(res, null, 'Property deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Upload additional photos to a property listing gallery
 */
export const uploadPropertyPhotos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;

    if (!req.files || req.files.length === 0) {
      return error(res, 'No files uploaded', 400);
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return error(res, 'Property not found', 404);
    }

    // Save photos in DB
    const photoPromises = req.files.map((file, index) => {
      const urlPath = `/uploads/properties/${file.filename}`;
      return prisma.photo.create({
        data: {
          url: urlPath,
          caption: caption || `Property photo ${index + 1}`,
          order: index,
          propertyId: id,
        },
      });
    });

    const photos = await Promise.all(photoPromises);

    return success(res, photos, 'Property photos uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};
