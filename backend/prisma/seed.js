import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Start seeding...');

  // 1. Clean Database
  await prisma.notification.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.photo.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleaned.');

  // 2. Create Users
  const superAdminPassword = await hashPassword('superadmin123');
  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');

  // SuperAdmin — pemilik platform
  await prisma.user.create({
    data: {
      name: 'Owner KontrakanKu',
      email: 'owner@kontrakanku.com',
      password: superAdminPassword,
      phone: '08100000001',
      role: 'SUPERADMIN',
      isVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Pak Hasan (Admin)',
      email: 'admin@kontrakanku.com',
      password: adminPassword,
      phone: '08123456789',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const tenant = await prisma.user.create({
    data: {
      name: 'Budi (Penyewa)',
      email: 'user@kontrakanku.com',
      password: userPassword,
      phone: '08987654321',
      role: 'USER',
      isVerified: true,
      ktpPhoto: '/uploads/ktp/ktp-sample.jpg',
    },
  });

  console.log('Users seeded:');
  console.log(`- SuperAdmin: owner@kontrakanku.com`);
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Tenant/User: ${tenant.email}`);

  // 3. Create Properties
  const prop1 = await prisma.property.create({
    data: {
      name: 'Kontrakan Dago Asri',
      address: 'Jl. Dago Asri No. 45, Coblong, Bandung, Jawa Barat',
      lat: -6.8872,
      lng: 107.6152,
      description: 'Hunian nyaman dan tenang di kawasan Dago. Dekat dengan kampus ITB, UNPAD, dan berbagai pusat perbelanjaan. Cocok untuk mahasiswa dan karyawan.',
      coverImage: '/uploads/properties/prop1.jpg',
      adminId: admin.id,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      name: 'Kontrakan Dipatiukur Jaya',
      address: 'Jl. Dipatiukur No. 12, Coblong, Bandung, Jawa Barat',
      lat: -6.8920,
      lng: 107.6180,
      description: 'Kontrakan strategis tepat di pinggir jalan utama Dipatiukur. Sangat dekat dengan halte bus, minimarket, dan kampus UNIKOM/ITHB.',
      coverImage: '/uploads/properties/prop2.jpg',
      adminId: admin.id,
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      name: 'Kost & Kontrakan Cihampelas Indah',
      address: 'Jl. Cihampelas No. 102, Bandung, Jawa Barat',
      lat: -6.8965,
      lng: 107.6040,
      description: 'Kontrakan eksklusif dengan parkir luas dan keamanan 24 jam. Dekat dengan Cihampelas Walk (Ciwalk) dan akses mudah ke Pasteur.',
      coverImage: '/uploads/properties/prop3.jpg',
      adminId: admin.id,
    },
  });

  console.log('Properties seeded.');

  // 4. Create Units
  // Dago Asri units
  await prisma.unit.createMany({
    data: [
      {
        propertyId: prop1.id,
        unitNumber: 'Kamar 101',
        type: 'Deluxe',
        price: 1500000,
        deposit: 500000,
        facilities: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur', 'Lemari'],
        status: 'AVAILABLE',
        description: 'Kamar Deluxe lantai 1 dengan ventilasi udara yang baik.',
      },
      {
        propertyId: prop1.id,
        unitNumber: 'Kamar 102',
        type: 'Standard',
        price: 1000000,
        deposit: 300000,
        facilities: ['WiFi', 'Kasur', 'Lemari'],
        status: 'AVAILABLE',
        description: 'Kamar Standard hemat biaya dengan kasur empuk.',
      },
      {
        propertyId: prop1.id,
        unitNumber: 'Kamar 103',
        type: 'Standard',
        price: 1000000,
        deposit: 300000,
        facilities: ['WiFi', 'Kasur', 'Lemari'],
        status: 'OCCUPIED',
        description: 'Kamar Standard lantai 2.',
      },
    ],
  });

  // Dipatiukur Jaya units
  await prisma.unit.createMany({
    data: [
      {
        propertyId: prop2.id,
        unitNumber: 'Kamar A',
        type: 'Deluxe',
        price: 1700000,
        deposit: 500000,
        facilities: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur', 'Lemari', 'TV'],
        status: 'AVAILABLE',
        description: 'Kamar Deluxe fasilitas lengkap termasuk smart TV.',
      },
      {
        propertyId: prop2.id,
        unitNumber: 'Kamar B',
        type: 'Standard',
        price: 1200000,
        deposit: 400000,
        facilities: ['WiFi', 'Kamar Mandi Dalam', 'Kasur', 'Lemari'],
        status: 'AVAILABLE',
        description: 'Kamar Standard dengan kamar mandi dalam, nyaman.',
      },
    ],
  });

  // Cihampelas Indah units
  await prisma.unit.createMany({
    data: [
      {
        propertyId: prop3.id,
        unitNumber: 'Kamar VIP 1',
        type: 'VIP',
        price: 2500000,
        deposit: 1000000,
        facilities: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur', 'Lemari', 'TV', 'Water Heater'],
        status: 'AVAILABLE',
        description: 'Kamar tipe VIP yang mewah dengan fasilitas pemanas air.',
      },
      {
        propertyId: prop3.id,
        unitNumber: 'Kamar VIP 2',
        type: 'VIP',
        price: 2500000,
        deposit: 1000000,
        facilities: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur', 'Lemari', 'TV', 'Water Heater'],
        status: 'AVAILABLE',
        description: 'Kamar VIP lantai atas dengan pemandangan kota.',
      },
    ],
  });

  console.log('Units seeded.');

  // 5. Create Demo Bookings & Payments
  // Fetch units by unitNumber to get their IDs
  const unit101 = await prisma.unit.findFirst({ where: { propertyId: prop1.id, unitNumber: 'Kamar 101' } });
  const unitKamarA = await prisma.unit.findFirst({ where: { propertyId: prop2.id, unitNumber: 'Kamar A' } });
  const unitVip1 = await prisma.unit.findFirst({ where: { propertyId: prop3.id, unitNumber: 'Kamar VIP 1' } });

  // Booking 1: ACTIVE + PAID — demo "sudah bayar, sedang sewa"
  const booking1 = await prisma.booking.create({
    data: {
      userId: tenant.id,
      unitId: unit101.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-04-01'),   // 3 bulan
      status: 'ACTIVE',
      totalPrice: 4500000 + 500000,     // 3bln × 1.5jt + deposit
      ktpDocument: '/uploads/ktp/ktp-sample.jpg',
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: 5000000,
      method: 'VA_BCA',
      status: 'PAID',
      paidAt: new Date('2026-01-01T10:00:00'),
      dueDate: new Date('2026-01-05'),
    },
  });
  // Mark unit as OCCUPIED
  await prisma.unit.update({ where: { id: unit101.id }, data: { status: 'OCCUPIED' } });

  // Booking 2: CONFIRMED + PENDING — demo "perlu bayar, ada jatuh tempo"
  const booking2 = await prisma.booking.create({
    data: {
      userId: tenant.id,
      unitId: unitKamarA.id,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-01'),   // 3 bulan
      status: 'CONFIRMED',
      totalPrice: 5100000 + 500000,     // 3bln × 1.7jt + deposit
      ktpDocument: '/uploads/ktp/ktp-sample.jpg',
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      amount: 5600000,
      method: 'MANUAL_BANK',
      status: 'PENDING',
      dueDate: new Date('2026-06-07'),  // jatuh tempo 7 hari
    },
  });

  // Booking 3: COMPLETED — demo riwayat selesai
  const booking3 = await prisma.booking.create({
    data: {
      userId: tenant.id,
      unitId: unitVip1.id,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-01-01'),   // 3 bulan lalu
      status: 'COMPLETED',
      totalPrice: 7500000 + 1000000,
      ktpDocument: '/uploads/ktp/ktp-sample.jpg',
    },
  });
  await prisma.payment.create({
    data: {
      bookingId: booking3.id,
      amount: 8500000,
      method: 'QRIS',
      status: 'PAID',
      paidAt: new Date('2025-10-01T09:00:00'),
      dueDate: new Date('2025-10-05'),
    },
  });

  console.log('Bookings & Payments seeded.');

  // 7. Create Reviews
  await prisma.review.createMany({
    data: [
      {
        userId: tenant.id,
        propertyId: prop1.id,
        rating: 5,
        comment: 'Sangat nyaman tinggal di sini! Pemiliknya sangat ramah dan responsif.',
      },
      {
        userId: tenant.id,
        propertyId: prop2.id,
        rating: 4,
        comment: 'Lokasi luar biasa strategis, cuma agak berisik kalau malam minggu karena dekat jalan raya.',
      },
    ],
  });

  console.log('Reviews seeded.');

  // 6. Create initial Notifications
  await prisma.notification.create({
    data: {
      userId: tenant.id,
      type: 'INFO',
      title: 'Selamat Datang!',
      body: 'Selamat datang di aplikasi KontrakanKu! Akun Anda telah aktif dan KTP Anda telah diverifikasi oleh admin.',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
