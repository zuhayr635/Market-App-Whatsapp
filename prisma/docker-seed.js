const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Running docker seed...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin123!', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@market.com' },
    update: { name: 'Admin', surname: 'User', passwordHash: adminHash, role: 'admin', status: true },
    create: { name: 'Admin', surname: 'User', email: 'admin@market.com', passwordHash: adminHash, role: 'admin', status: true },
  });
  console.log('Admin: admin@market.com / Admin123!');

  // Regular user
  const userHash = await bcrypt.hash('User1234!', 12);
  await prisma.user.upsert({
    where: { email: 'user@market.com' },
    update: { passwordHash: userHash },
    create: {
      name: 'Cihan',
      surname: 'Polat',
      email: 'user@market.com',
      phone: '+905551234567',
      passwordHash: userHash,
      status: 'ACTIVE',
      role: 'MEMBER',
    },
  });
  console.log('User: user@market.com / User1234!');

  // Settings
  const settings = [
    { key: 'site_name', value: 'Cihan Ekspress', group: 'general' },
    { key: 'site_description', value: 'Online Market Platformu', group: 'general' },
    { key: 'maintenance_mode', value: 'false', group: 'general' },
    { key: 'guest_price_visible', value: 'true', group: 'product' },
    { key: 'currency_auto_update', value: 'true', group: 'currency' },
    { key: 'usd_rate', value: '32.50', group: 'currency' },
    { key: 'low_stock_threshold', value: '5', group: 'product' },
    { key: 'max_product_images', value: '10', group: 'product' },
    { key: 'max_image_size_mb', value: '5', group: 'product' },
    { key: 'new_product_days', value: '30', group: 'product' },
    { key: 'cart_expiry_days', value: '30', group: 'cart' },
    { key: 'payment_link_hours', value: '24', group: 'payment' },
    { key: 'sms_verification', value: 'false', group: 'sms' },
    { key: 'email_verification', value: 'true', group: 'email' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }
  console.log('Settings seeded.');

  // Theme settings
  const themes = [
    { key: 'primary_color', value: '#2563eb', type: 'color' },
    { key: 'secondary_color', value: '#64748b', type: 'color' },
    { key: 'accent_color', value: '#f59e0b', type: 'color' },
    { key: 'background_color', value: '#ffffff', type: 'color' },
    { key: 'foreground_color', value: '#0f172a', type: 'color' },
    { key: 'border_radius', value: '0.5rem', type: 'size' },
    { key: 'font_family', value: 'Inter', type: 'font' },
  ];

  for (const t of themes) {
    await prisma.themeSetting.upsert({
      where: { key: t.key },
      update: { value: t.value, type: t.type },
      create: t,
    });
  }
  console.log('Theme settings seeded.');
  console.log('Docker seed completed!');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
