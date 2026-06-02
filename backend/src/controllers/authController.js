import prisma from '../config/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { success, error } from '../utils/response.js';

/**
 * Register a new User
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return error(res, 'Email is already registered', 409);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'USER', // Defaults to USER role
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);

    return success(res, { user, token }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Login User
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    // Omit password from user response
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user);

    return success(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ktpPhoto: true,
        profilePhoto: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(res, user, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Upload KTP Photo for Verification
 */
export const uploadKtp = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    // Save relative upload path in DB
    const relativePath = `/uploads/ktp/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ktpPhoto: relativePath,
        isVerified: false, // Reset verification status upon new upload
      },
      select: {
        id: true,
        name: true,
        ktpPhoto: true,
        isVerified: true,
      },
    });

    return success(res, user, 'KTP photo uploaded successfully. Awaiting admin review.');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Verify user KTP status
 */
export const verifyUserKtp = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isVerified, reason } = req.body;

    if (isVerified === undefined) {
      return error(res, 'isVerified status is required', 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified },
      select: { id: true, name: true, email: true, isVerified: true },
    });

    const rejectionBody = reason
      ? `Identitas KTP Anda ditolak oleh admin. Alasan: "${reason}". Silakan unggah ulang foto KTP yang jelas.`
      : 'Identitas KTP Anda gagal diverifikasi oleh admin. Silakan unggah ulang foto KTP yang jelas.';

    await prisma.notification.create({
      data: {
        userId,
        type: isVerified ? 'INFO' : 'DANGER',
        title: isVerified ? '✅ KTP Anda Telah Terverifikasi' : '❌ Verifikasi KTP Ditolak',
        body: isVerified
          ? 'Selamat! Identitas KTP Anda telah diverifikasi oleh admin. Anda sekarang dapat memesan unit kontrakan.'
          : rejectionBody,
      },
    });

    return success(res, user, `User verification status updated to ${isVerified}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Get all tenants (role=USER) with their booking & payment history
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ktpPhoto: true,
        isVerified: true,
        createdAt: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          include: {
            unit: {
              select: {
                unitNumber: true,
                type: true,
                price: true,
                deposit: true,
                property: { select: { name: true, address: true } },
              },
            },
            payments: {
              select: { id: true, amount: true, status: true, method: true, paidAt: true, dueDate: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    return success(res, users, 'Users fetched successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Create tenant account (walk-in registration)
 */
export const adminCreateUser = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return error(res, 'Nama, email, dan password wajib diisi', 400);
    }
    if (password.length < 6) {
      return error(res, 'Password minimal 6 karakter', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, 'Email sudah terdaftar', 409);

    // KTP file uploaded by admin?
    const ktpPath = req.file ? `/uploads/ktp/${req.file.filename}` : null;

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashed,
        role: 'USER',
        ktpPhoto: ktpPath || null,
        isVerified: !!ktpPath, // auto-verified if admin uploads KTP
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, createdAt: true },
    });

    const notifBody = ktpPath
      ? `Akun Anda telah didaftarkan oleh admin dan KTP Anda sudah diverifikasi. Gunakan email ${email} untuk masuk. Segera ganti password Anda setelah login pertama.`
      : `Akun Anda telah didaftarkan oleh admin. Gunakan email ${email} untuk masuk. Segera ganti password Anda setelah login pertama.`;

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'INFO',
        title: '🎉 Akun KontrakanKu Anda Siap',
        body: notifBody,
      },
    });

    return success(res, user, 'Akun penyewa berhasil dibuat');
  } catch (err) {
    next(err);
  }
};

/**
 * User: Get own notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return success(res, notifications, 'Notifications fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * User: Mark notification as read
 */
/**
 * User: Upload profile photo (avatar)
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePhoto: avatarPath },
      select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, profilePhoto: true },
    });
    return success(res, updated, 'Foto profil berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

/**
 * User: Update own profile (name, phone)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      return error(res, 'Nama minimal 2 karakter', 400);
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim(), phone: phone?.trim() || null },
      select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true },
    });
    return success(res, updated, 'Profil berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

// In-memory OTP store (resets on server restart — sufficient for demo)
const otpStore = new Map(); // email → { otp, expires }

/**
 * User: Change password (requires current password)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return error(res, 'Password lama dan baru wajib diisi', 400);
    }
    if (newPassword.length < 6) {
      return error(res, 'Password baru minimal 6 karakter', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) return error(res, 'Password lama tidak sesuai', 401);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return success(res, null, 'Password berhasil diubah');
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Request OTP for forgot password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email wajib diisi', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return error(res, 'Email tidak ditemukan', 404);

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    otpStore.set(email, { otp, expires: Date.now() + 15 * 60 * 1000 }); // 15 min

    const isDev = process.env.NODE_ENV !== 'production';
    // Production: kirim via email (integrasi email service di sini)
    // Development: tampilkan di response untuk kemudahan testing
    const responseData = isDev ? { otp, email } : { email };
    const message = isDev
      ? '[DEV MODE] Kode OTP: ' + otp + ' (tidak akan muncul di production)'
      : 'Kode OTP telah dikirim ke email Anda. Berlaku 15 menit.';

    return success(res, responseData, message);
  } catch (err) {
    next(err);
  }
};

/**
 * Public: Reset password using OTP
 */
export const resetPasswordOTP = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return error(res, 'Email, OTP, dan password baru wajib diisi', 400);
    }
    if (newPassword.length < 6) {
      return error(res, 'Password baru minimal 6 karakter', 400);
    }

    const entry = otpStore.get(email);
    if (!entry) return error(res, 'OTP tidak ditemukan atau sudah kadaluarsa', 400);
    if (Date.now() > entry.expires) {
      otpStore.delete(email);
      return error(res, 'OTP sudah kadaluarsa. Minta ulang kode baru.', 400);
    }
    if (entry.otp !== otp) return error(res, 'Kode OTP salah', 400);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    otpStore.delete(email);

    return success(res, null, 'Password berhasil direset');
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    return success(res, null, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

/**
 * SuperAdmin: Get all admin accounts with their property stats
 */
export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, name: true, email: true, phone: true, role: true, createdAt: true,
        properties: {
          select: {
            id: true, name: true, address: true,
            units: { select: { id: true, status: true, price: true } },
          },
        },
      },
    });

    const result = admins.map(a => ({
      ...a,
      propertyCount: a.properties.length,
      unitCount: a.properties.reduce((s, p) => s + p.units.length, 0),
      availableCount: a.properties.reduce((s, p) => s + p.units.filter(u => u.status === 'AVAILABLE').length, 0),
      occupiedCount: a.properties.reduce((s, p) => s + p.units.filter(u => u.status === 'OCCUPIED').length, 0),
    }));

    return success(res, result, 'Admins fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * SuperAdmin: Create a new admin account
 */
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return error(res, 'Nama, email, password wajib diisi', 400);
    if (password.length < 6) return error(res, 'Password minimal 6 karakter', 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, 'Email sudah terdaftar', 409);

    const hashed = await hashPassword(password);
    const admin = await prisma.user.create({
      data: { name, email, phone: phone || null, password: hashed, role: 'ADMIN', isVerified: true },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    return success(res, admin, 'Akun admin baru berhasil dibuat', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * SuperAdmin: Global platform statistics
 */
export const getGlobalStats = async (req, res, next) => {
  try {
    const [properties, units, bookings, payments, admins, users] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.booking.groupBy({ by: ['status'], _count: true }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: true }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } }),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);

    const bookingMap = Object.fromEntries(bookings.map(b => [b.status, b._count]));

    return success(res, {
      properties,
      units,
      admins,
      tenants: users,
      bookings: {
        total: bookings.reduce((s, b) => s + b._count, 0),
        active: bookingMap.ACTIVE || 0,
        pending: bookingMap.PENDING || 0,
        confirmed: bookingMap.CONFIRMED || 0,
        completed: bookingMap.COMPLETED || 0,
        cancelled: bookingMap.CANCELLED || 0,
      },
      revenue: {
        total: Number(payments._sum.amount || 0),
        transactions: payments._count,
      },
    }, 'Global stats fetched');
  } catch (err) {
    next(err);
  }
};
