import prisma from '../config/prisma.js';
import { success, error } from '../utils/response.js';

/**
 * Fetch all units inside a specific property
 */
export const getUnitsByProperty = async (req, res, next) => {
  try {
    const { id: propertyId } = req.params;
    const { status } = req.query;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return error(res, 'Property not found', 404);
    }

    const units = await prisma.unit.findMany({
      where: {
        propertyId,
        ...(status && { status }),
      },
      include: {
        photos: true,
      },
      orderBy: { unitNumber: 'asc' },
    });

    return success(res, units, 'Units retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Add a new unit to an existing property
 */
export const createUnit = async (req, res, next) => {
  try {
    const { id: propertyId } = req.params;
    const { unitNumber, type, price, deposit, facilities, description } = req.body;

    if (!unitNumber || !type || price === undefined) {
      return error(res, 'Unit number, type, and price are required', 400);
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return error(res, 'Property not found', 404);
    }

    // Auth check: Admin must own this property or be a Superadmin
    if (property.adminId !== req.user.id && req.user.role !== 'SUPERADMIN') {
      return error(res, 'You do not have permission to add units to this property', 403);
    }

    // Check if room number is unique in this property
    const existingUnit = await prisma.unit.findFirst({
      where: {
        propertyId,
        unitNumber,
      },
    });

    if (existingUnit) {
      return error(res, `Room/Unit '${unitNumber}' already exists in this property`, 409);
    }

    // Parse facilities array if passed as string/JSON
    let facilitiesArray = [];
    if (Array.isArray(facilities)) {
      facilitiesArray = facilities;
    } else if (typeof facilities === 'string') {
      try {
        facilitiesArray = JSON.parse(facilities);
      } catch {
        // split by comma if string is plain comma separated list
        facilitiesArray = facilities.split(',').map((f) => f.trim());
      }
    }

    const unit = await prisma.unit.create({
      data: {
        propertyId,
        unitNumber,
        type,
        price: parseFloat(price),
        deposit: deposit ? parseFloat(deposit) : 0.0,
        facilities: facilitiesArray,
        description,
        status: 'AVAILABLE',
      },
    });

    return success(res, unit, 'Unit created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Edit an existing unit
 */
export const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { unitNumber, type, price, deposit, facilities, status, description } = req.body;

    const existingUnit = await prisma.unit.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existingUnit) {
      return error(res, 'Unit not found', 404);
    }

    // Auth check
    if (existingUnit.property.adminId !== req.user.id && req.user.role !== 'SUPERADMIN') {
      return error(res, 'You do not have permission to modify this unit', 403);
    }

    // Unique unit check in property if number is changing
    if (unitNumber && unitNumber !== existingUnit.unitNumber) {
      const roomConflict = await prisma.unit.findFirst({
        where: {
          propertyId: existingUnit.propertyId,
          unitNumber,
        },
      });

      if (roomConflict) {
        return error(res, `Room/Unit '${unitNumber}' already exists in this property`, 409);
      }
    }

    const dataToUpdate = {};
    if (unitNumber) dataToUpdate.unitNumber = unitNumber;
    if (type) dataToUpdate.type = type;
    if (price !== undefined) dataToUpdate.price = parseFloat(price);
    if (deposit !== undefined) dataToUpdate.deposit = parseFloat(deposit);
    if (status) dataToUpdate.status = status;
    if (description !== undefined) dataToUpdate.description = description;

    if (facilities !== undefined) {
      let facilitiesArray = [];
      if (Array.isArray(facilities)) {
        facilitiesArray = facilities;
      } else if (typeof facilities === 'string') {
        try {
          facilitiesArray = JSON.parse(facilities);
        } catch {
          facilitiesArray = facilities.split(',').map((f) => f.trim());
        }
      }
      dataToUpdate.facilities = facilitiesArray;
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: dataToUpdate,
    });

    return success(res, updatedUnit, 'Unit updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a unit
 */
export const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUnit = await prisma.unit.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existingUnit) {
      return error(res, 'Unit not found', 404);
    }

    if (existingUnit.property.adminId !== req.user.id && req.user.role !== 'SUPERADMIN') {
      return error(res, 'You do not have permission to delete this unit', 403);
    }

    await prisma.unit.delete({
      where: { id },
    });

    return success(res, null, 'Unit deleted successfully');
  } catch (err) {
    next(err);
  }
};
