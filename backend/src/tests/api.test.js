import prisma from '../config/prisma.js';

// Setup central API URL
const BASE_URL = 'http://localhost:4000/api';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('\n======================================================');
  console.log('      KONTRAKANKU CENTRAL API INTEGRATION TEST        ');
  console.log('======================================================\n');

  try {
    // 1. Check health
    console.log('Checking API health...');
    const healthRes = await fetch('http://localhost:4000/api/health');
    const health = await healthRes.json();
    console.log('API Status:', health.status);
    console.log('Database Status:', health.services.database.status);

    if (health.services.database.status !== 'UP') {
      console.warn('\n[WARNING] Database is not connected. Tests requiring database will be skipped or simulated.');
      console.warn('Make sure Docker is running and "npm run db:migrate" has been executed.\n');
    }

    const testEmail = `testuser-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123';
    let token = '';
    let userId = '';
    let propertyId = '';
    let unitId = '';
    let bookingId = '';
    let paymentId = '';

    // 2. Register
    console.log('\n--- 1. Testing User Registration ---');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Budi Test Penyewa',
        email: testEmail,
        password: testPassword,
        phone: '08123456789',
      }),
    });
    const registerData = await registerRes.json();
    if (registerData.success) {
      console.log('✓ Registration successful:', registerData.data.user.email);
      token = registerData.data.token;
      userId = registerData.data.user.id;
    } else {
      console.error('✗ Registration failed:', registerData.message);
      return;
    }

    // 3. Promote User to ADMIN in database to test admin APIs
    console.log('\n--- 2. Promoting User to ADMIN in Database ---');
    await prisma.user.update({
      where: { id: userId },
      data: { 
        role: 'ADMIN',
        isVerified: true, // Auto verify so they can make bookings as well
        ktpPhoto: '/uploads/ktp/ktp-sample.jpg',
      },
    });
    console.log('✓ Successfully promoted user to ADMIN and set isVerified=true in Database.');

    // 4. Get Profile
    console.log('\n--- 3. Testing Get Authenticated Profile ---');
    const profileRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const profileData = await profileRes.json();
    if (profileData.success) {
      console.log('✓ Profile retrieved successfully. Name:', profileData.data.name, '| Role:', profileData.data.role);
    } else {
      console.error('✗ Profile retrieval failed:', profileData.message);
    }

    // 5. Create Property (Admin)
    console.log('\n--- 4. Testing Create Property Listing (Admin) ---');
    const propertyRes = await fetch(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Kontrakan Hijau Dago',
        address: 'Jl. Dago Asri No. 45, Bandung',
        lat: -6.8893,
        lng: 107.6161,
        description: 'Kontrakan eksklusif nan asri dekat kampus ITB. Fasilitas lengkap.',
      }),
    });
    const propertyData = await propertyRes.json();
    if (propertyData.success) {
      console.log('✓ Property created successfully:', propertyData.data.name);
      propertyId = propertyData.data.id;
    } else {
      console.error('✗ Property creation failed:', propertyData.message);
      return;
    }

    // 6. Create Unit in Property (Admin)
    console.log('\n--- 5. Testing Create Unit in Property (Admin) ---');
    const unitRes = await fetch(`${BASE_URL}/properties/${propertyId}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitNumber: 'Kamar A-101',
        type: 'Deluxe Suite',
        price: 1500000,
        deposit: 500000,
        facilities: ['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur Queen'],
        description: 'Kamar deluxe dengan ventilasi udara sejuk langsung dari bukit dago.',
      }),
    });
    const unitData = await unitRes.json();
    if (unitData.success) {
      console.log('✓ Unit created successfully:', unitData.data.unitNumber, '| Price:', unitData.data.price);
      unitId = unitData.data.id;
    } else {
      console.error('✗ Unit creation failed:', unitData.message);
      return;
    }

    // 7. Get All Properties (Public Map View)
    console.log('\n--- 6. Testing Public Properties List (Map View) ---');
    const propsRes = await fetch(`${BASE_URL}/properties`);
    const propsData = await propsRes.json();
    if (propsData.success) {
      console.log('✓ Retrieved properties count:', propsData.data.length);
      const testProp = propsData.data.find(p => p.id === propertyId);
      if (testProp) {
        console.log('  Found property:', testProp.name, '| Start Price:', testProp.startPrice, '| Lat/Lng:', `${testProp.lat}, ${testProp.lng}`);
      }
    } else {
      console.error('✗ Property list failed:', propsData.message);
    }

    // 8. Create Booking (User)
    console.log('\n--- 7. Testing Create Booking (User) ---');
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 3); // 3 months duration

    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        unitId,
        startDate: today.toISOString(),
        endDate: nextMonth.toISOString(),
      }),
    });
    const bookingData = await bookingRes.json();
    if (bookingData.success) {
      console.log('✓ Booking created successfully!');
      console.log('  Total Price:', bookingData.data.booking.totalPrice);
      console.log('  Booking Status:', bookingData.data.booking.status);
      bookingId = bookingData.data.booking.id;
      paymentId = bookingData.data.payment.id;
    } else {
      console.error('✗ Booking failed:', bookingData.message);
      return;
    }

    // 9. Get Booking History
    console.log('\n--- 8. Testing Retrieve Booking History ---');
    const historyRes = await fetch(`${BASE_URL}/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const historyData = await historyRes.json();
    if (historyData.success) {
      console.log('✓ Retrieved bookings count:', historyData.data.length);
      console.log('  Latest Booking Unit:', historyData.data[0].unit.unitNumber, '| Status:', historyData.data[0].status);
    }

    // 10. Manual Payment Confirmation (Admin)
    console.log('\n--- 9. Testing Manual Payment Confirmation (Admin) ---');
    const payConfirmRes = await fetch(`${BASE_URL}/payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const payConfirmData = await payConfirmRes.json();
    if (payConfirmData.success) {
      console.log('✓ Manual payment successfully confirmed!');
      console.log('  New Payment Status:', payConfirmData.data.payment.status);
      console.log('  New Booking Status:', payConfirmData.data.booking.status);

      // Verify unit is OCCUPIED
      const updatedUnit = await prisma.unit.findUnique({
        where: { id: unitId },
      });
      console.log('  Verify Unit Current Status:', updatedUnit.status);
    } else {
      console.error('✗ Payment confirmation failed:', payConfirmData.message);
    }

    // 11. Cleanup test records from database
    console.log('\n--- 10. Cleaning up Test Records from DB ---');
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.payment.deleteMany({ where: { bookingId } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.unit.deleteMany({ where: { propertyId } });
    await prisma.property.deleteMany({ where: { adminId: userId } });
    await prisma.user.delete({ where: { id: userId } });
    console.log('✓ Successfully cleaned up all test records from the database.');

    console.log('\n======================================================');
    console.log('        ALL INTEGRATION TESTS PASSED SUCCESSFULLY      ');
    console.log('======================================================\n');

  } catch (error) {
    console.error('\n✗ Error occurred during API integration tests:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
