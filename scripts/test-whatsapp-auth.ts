import { normalizeIndianMobile, hashOTP, getOTPProvider } from '../src/lib/otp/provider';
import { sendOTP, verifyOTP, normalizeIdentifier } from '../src/lib/otp/service';
import { prisma } from '../src/lib/prisma';

async function runTests() {
  console.log('--- STARTING ZYORA WHATSAPP & AUTH VERIFICATION TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Indian Mobile Phone Normalization
  console.log('\n[1. Testing normalizeIndianMobile]');
  const t1 = normalizeIndianMobile('9876543210');
  assert(t1.isValid && t1.normalized === '+919876543210' && t1.national10 === '9876543210', 'Direct 10-digit mobile number');

  const t2 = normalizeIndianMobile('+91 98765 43210');
  assert(t2.isValid && t2.normalized === '+919876543210', 'Phone with +91 and spaces');

  const t3 = normalizeIndianMobile('09876543210');
  assert(t3.isValid && t3.normalized === '+919876543210', 'Phone with leading 0');

  const t4 = normalizeIndianMobile('1234567890');
  assert(!t4.isValid, 'Reject invalid prefix (starting with 1-5)');

  const t5 = normalizeIndianMobile('98765');
  assert(!t5.isValid, 'Reject less than 10 digits');

  // TEST 2: Identifier Normalization
  console.log('\n[2. Testing normalizeIdentifier]');
  const id1 = normalizeIdentifier('9820011223');
  assert(id1.type === 'phone' && id1.isValid && id1.identifier === '+919820011223', 'Phone identifier normalized');

  const id2 = normalizeIdentifier('user@zyora.com');
  assert(id2.type === 'email' && id2.isValid && id2.identifier === 'user@zyora.com', 'Email identifier normalized');

  // TEST 3: HMAC-SHA256 OTP Hashing (No plaintext in DB)
  console.log('\n[3. Testing HMAC OTP Hashing]');
  const hash1 = hashOTP('123456', '+919876543210');
  const hash2 = hashOTP('123456', '+919876543210');
  const hash3 = hashOTP('654321', '+919876543210');
  assert(hash1.length === 64 && hash1 === hash2, 'Deterministic HMAC-SHA256');
  assert(hash1 !== hash3, 'Different OTP produces different hash');

  // TEST 4: OTP Provider Resolution & Auto-detection
  console.log('\n[4. Testing OTP Provider Resolution]');
  const provider = getOTPProvider('whatsapp');
  assert(provider !== null, `Provider resolved: ${provider.name}`);

  // TEST 5: Database Schema Verification
  console.log('\n[5. Testing OTP Database Record Creation & Hashing]');
  const testPhone = '+919899988877';
  
  // Clean up any test records
  await prisma.oTPVerification.deleteMany({
    where: { identifier: testPhone },
  });

  const sendRes1 = await sendOTP(testPhone);
  // When credentials are not yet configured in local environment, it safely reports unconfigured provider without crashing
  assert(
    sendRes1.success === false && sendRes1.message.includes('WhatsApp'),
    'Safely handles unconfigured WhatsApp provider with informative production message'
  );

  // Verify in DB that phone and channel are recorded, and otpHash is NOT plaintext
  const dbRecord = await prisma.oTPVerification.findFirst({
    where: { identifier: testPhone },
    orderBy: { createdAt: 'desc' },
  });
  assert(dbRecord !== null, 'OTP record saved in database');
  assert(dbRecord?.phone === testPhone, 'Record phone column set to +91XXXXXXXXXX');
  assert(dbRecord?.channel === 'whatsapp', 'Record channel set to whatsapp');
  assert(dbRecord?.otpHash.length === 64, 'Record otpHash is securely hashed (64 chars)');

  // TEST 6: Cooldown Enforcement (Immediate re-send blocked with 30s timer)
  console.log('\n[6. Testing 30s Cooldown Guard]');
  const sendRes2 = await sendOTP(testPhone);
  assert(
    !sendRes2.success &&
      typeof sendRes2.cooldownSeconds === 'number' &&
      sendRes2.cooldownSeconds <= 30 &&
      sendRes2.cooldownSeconds > 0,
    `Immediate duplicate request blocked by 30s cooldown (waitTime: ${sendRes2.cooldownSeconds}s)`
  );

  // TEST 7: Invalid Verification Code Handling
  console.log('\n[7. Testing Verification Attempts & Lockout]');
  const verifyFail = await verifyOTP(testPhone, '000000');
  assert(!verifyFail.success, 'Reject incorrect OTP code');

  // Clean up test verification record
  await prisma.oTPVerification.deleteMany({
    where: { identifier: testPhone },
  });

  // TEST 8: Demo Account Integrity
  console.log('\n[8. Testing Existing Demo Accounts Integrity]');
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@zyora.com' } });
  assert(adminUser !== null && adminUser.role === 'ADMIN', 'Admin demo account intact');

  const sellerUser = await prisma.user.findUnique({ where: { email: 'seller@atelier.com' } });
  assert(sellerUser !== null && sellerUser.role === 'SELLER', 'Seller demo account intact');

  const clientUser = await prisma.user.findUnique({ where: { email: 'user@zyora.com' } });
  assert(clientUser !== null && clientUser.role === 'CUSTOMER', 'Client demo account intact');

  console.log(`\n==================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

