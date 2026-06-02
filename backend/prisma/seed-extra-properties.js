import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.error('Admin user not found. Run seed.js first.');
    process.exit(1);
  }

  const properties = [
    { name: 'Kontrakan Setiabudi Residence', address: 'Jl. Setiabudi No. 88, Sukasari, Bandung', lat: -6.8620, lng: 107.6010, price: 1300000 },
    { name: 'Kost Eksklusif Bukit Dago', address: 'Jl. Dago Pojok No. 22, Coblong, Bandung', lat: -6.8790, lng: 107.6230, price: 1800000 },
    { name: 'Kontrakan Cimahi Baru', address: 'Jl. Raya Cimahi No. 34, Cimahi Tengah', lat: -6.8840, lng: 107.5420, price: 900000 },
    { name: 'Kost Istana Antapani', address: 'Jl. Antapani No. 15, Antapani, Bandung', lat: -6.9120, lng: 107.6580, price: 1100000 },
    { name: 'Hunian Nyaman Arcamanik', address: 'Jl. Arcamanik No. 7, Arcamanik, Bandung', lat: -6.9200, lng: 107.6810, price: 950000 },
    { name: 'Kontrakan Permata Cibeunying', address: 'Jl. Cibeunying Indah No. 3, Bandung', lat: -6.8850, lng: 107.6320, price: 1400000 },
    { name: 'Kost Strategis Pasirkaliki', address: 'Jl. Pasirkaliki No. 55, Cicendo, Bandung', lat: -6.9010, lng: 107.5920, price: 1200000 },
    { name: 'Kontrakan Babakan Sari', address: 'Jl. Babakan Sari No. 18, Kiaracondong, Bandung', lat: -6.9280, lng: 107.6450, price: 850000 },
    { name: 'Kost Dekat Tol Pasteur', address: 'Jl. Dr. Djunjunan No. 71, Cicendo, Bandung', lat: -6.8960, lng: 107.5860, price: 1350000 },
    { name: 'Kontrakan Sindangsari Asri', address: 'Jl. Sindangsari No. 9, Bojongloa Kidul, Bandung', lat: -6.9380, lng: 107.6000, price: 800000 },
    { name: 'Kost Premium Buah Batu', address: 'Jl. Buah Batu No. 41, Batununggal, Bandung', lat: -6.9450, lng: 107.6390, price: 1600000 },
    { name: 'Kontrakan Dekat RS Hasan Sadikin', address: 'Jl. Pasteur No. 28, Sukajadi, Bandung', lat: -6.8900, lng: 107.5940, price: 1250000 },
    { name: 'Kost Soreang Garden', address: 'Jl. Raya Soreang No. 12, Soreang, Bandung', lat: -7.0260, lng: 107.5520, price: 700000 },
    { name: 'Kontrakan Ciwastra Indah', address: 'Jl. Ciwastra No. 66, Buahbatu, Bandung', lat: -6.9580, lng: 107.6510, price: 1000000 },
    { name: 'Kost Eksklusif Gegerkalong', address: 'Jl. Gegerkalong Hilir No. 4, Sukasari, Bandung', lat: -6.8530, lng: 107.5880, price: 1450000 },
    { name: 'Kontrakan Merdeka Regency', address: 'Jl. Merdeka No. 33, Sumur Bandung, Bandung', lat: -6.9050, lng: 107.6140, price: 1700000 },
    { name: 'Kost Murah Ujungberung', address: 'Jl. Ujungberung Indah No. 5, Ujungberung, Bandung', lat: -6.9150, lng: 107.7050, price: 650000 },
    { name: 'Kontrakan Girimekar Permai', address: 'Jl. Girimekar No. 20, Cilengkrang, Bandung', lat: -6.9060, lng: 107.7150, price: 750000 },
    { name: 'Kost Dekat Univ Telkom', address: 'Jl. Telekomunikasi No. 1, Dayeuhkolot, Bandung', lat: -6.9730, lng: 107.6300, price: 1150000 },
    { name: 'Kontrakan Sarijadi Baru', address: 'Jl. Sarijadi No. 11, Sukasari, Bandung', lat: -6.8620, lng: 107.5830, price: 1050000 },
    { name: 'Kost Dekat Stasiun Hall', address: 'Jl. Stasiun Barat No. 4, Regol, Bandung', lat: -6.9140, lng: 107.6060, price: 1300000 },
    { name: 'Kontrakan Baleendah Sejahtera', address: 'Jl. Baleendah No. 17, Baleendah, Bandung', lat: -7.0010, lng: 107.6190, price: 780000 },
    { name: 'Kost Premium Setiabudhi', address: 'Jl. Setiabudhi No. 200, Sukasari, Bandung', lat: -6.8500, lng: 107.5990, price: 2000000 },
    { name: 'Kontrakan Cipamokolan Lestari', address: 'Jl. Cipamokolan No. 8, Rancasari, Bandung', lat: -6.9500, lng: 107.6720, price: 870000 },
    { name: 'Kost Margahayu Raya', address: 'Jl. Margahayu Raya No. 55, Margahayu, Bandung', lat: -6.9610, lng: 107.6080, price: 990000 },
  ];

  let created = 0;
  for (const p of properties) {
    const prop = await prisma.property.create({
      data: {
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        description: `Hunian nyaman di lokasi strategis ${p.address.split(',')[1]?.trim() || 'Bandung'}. Cocok untuk mahasiswa dan karyawan dengan harga terjangkau dan fasilitas memadai.`,
        coverImage: null,
        adminId: admin.id,
      },
    });

    // Add 2 units per property
    await prisma.unit.createMany({
      data: [
        {
          propertyId: prop.id,
          unitNumber: 'Kamar A',
          type: 'Standard',
          price: p.price,
          deposit: Math.round(p.price * 0.3),
          facilities: ['WiFi', 'Kasur', 'Lemari', 'Kipas Angin'],
          status: 'AVAILABLE',
          description: 'Kamar Standard bersih dan nyaman.',
        },
        {
          propertyId: prop.id,
          unitNumber: 'Kamar B',
          type: 'Deluxe',
          price: Math.round(p.price * 1.4),
          deposit: Math.round(p.price * 0.5),
          facilities: ['AC', 'WiFi', 'Kasur', 'Lemari', 'Kamar Mandi Dalam'],
          status: 'AVAILABLE',
          description: 'Kamar Deluxe dengan kamar mandi dalam dan AC.',
        },
      ],
    });

    created++;
    process.stdout.write(`[${created}/${properties.length}] ${p.name}\n`);
  }

  console.log(`\nSelesai! ${created} properti berhasil ditambahkan.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
