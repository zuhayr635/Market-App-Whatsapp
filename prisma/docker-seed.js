const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Running docker seed...');

  // ==================== CITIES ====================
  console.log('Seeding cities...');
  const cities = [
    { name: 'Adana', plateCode: '01' }, { name: 'Adıyaman', plateCode: '02' },
    { name: 'Afyonkarahisar', plateCode: '03' }, { name: 'Ağrı', plateCode: '04' },
    { name: 'Amasya', plateCode: '05' }, { name: 'Ankara', plateCode: '06' },
    { name: 'Antalya', plateCode: '07' }, { name: 'Artvin', plateCode: '08' },
    { name: 'Aydın', plateCode: '09' }, { name: 'Balıkesir', plateCode: '10' },
    { name: 'Bilecik', plateCode: '11' }, { name: 'Bingöl', plateCode: '12' },
    { name: 'Bitlis', plateCode: '13' }, { name: 'Bolu', plateCode: '14' },
    { name: 'Burdur', plateCode: '15' }, { name: 'Bursa', plateCode: '16' },
    { name: 'Çanakkale', plateCode: '17' }, { name: 'Çankırı', plateCode: '18' },
    { name: 'Çorum', plateCode: '19' }, { name: 'Denizli', plateCode: '20' },
    { name: 'Diyarbakır', plateCode: '21' }, { name: 'Edirne', plateCode: '22' },
    { name: 'Elazığ', plateCode: '23' }, { name: 'Erzincan', plateCode: '24' },
    { name: 'Erzurum', plateCode: '25' }, { name: 'Eskişehir', plateCode: '26' },
    { name: 'Gaziantep', plateCode: '27' }, { name: 'Giresun', plateCode: '28' },
    { name: 'Gümüşhane', plateCode: '29' }, { name: 'Hakkari', plateCode: '30' },
    { name: 'Hatay', plateCode: '31' }, { name: 'Isparta', plateCode: '32' },
    { name: 'Mersin', plateCode: '33' }, { name: 'İstanbul', plateCode: '34' },
    { name: 'İzmir', plateCode: '35' }, { name: 'Kars', plateCode: '36' },
    { name: 'Kastamonu', plateCode: '37' }, { name: 'Kayseri', plateCode: '38' },
    { name: 'Kırklareli', plateCode: '39' }, { name: 'Kırşehir', plateCode: '40' },
    { name: 'Kocaeli', plateCode: '41' }, { name: 'Konya', plateCode: '42' },
    { name: 'Kütahya', plateCode: '43' }, { name: 'Malatya', plateCode: '44' },
    { name: 'Manisa', plateCode: '45' }, { name: 'Kahramanmaraş', plateCode: '46' },
    { name: 'Mardin', plateCode: '47' }, { name: 'Muğla', plateCode: '48' },
    { name: 'Muş', plateCode: '49' }, { name: 'Nevşehir', plateCode: '50' },
    { name: 'Niğde', plateCode: '51' }, { name: 'Ordu', plateCode: '52' },
    { name: 'Rize', plateCode: '53' }, { name: 'Sakarya', plateCode: '54' },
    { name: 'Samsun', plateCode: '55' }, { name: 'Siirt', plateCode: '56' },
    { name: 'Sinop', plateCode: '57' }, { name: 'Sivas', plateCode: '58' },
    { name: 'Tekirdağ', plateCode: '59' }, { name: 'Tokat', plateCode: '60' },
    { name: 'Trabzon', plateCode: '61' }, { name: 'Tunceli', plateCode: '62' },
    { name: 'Şanlıurfa', plateCode: '63' }, { name: 'Uşak', plateCode: '64' },
    { name: 'Van', plateCode: '65' }, { name: 'Yozgat', plateCode: '66' },
    { name: 'Zonguldak', plateCode: '67' }, { name: 'Aksaray', plateCode: '68' },
    { name: 'Bayburt', plateCode: '69' }, { name: 'Karaman', plateCode: '70' },
    { name: 'Kırıkkale', plateCode: '71' }, { name: 'Batman', plateCode: '72' },
    { name: 'Şırnak', plateCode: '73' }, { name: 'Bartın', plateCode: '74' },
    { name: 'Ardahan', plateCode: '75' }, { name: 'Iğdır', plateCode: '76' },
    { name: 'Yalova', plateCode: '77' }, { name: 'Karabük', plateCode: '78' },
    { name: 'Kilis', plateCode: '79' }, { name: 'Osmaniye', plateCode: '80' },
    { name: 'Düzce', plateCode: '81' },
  ];

  const cityMap = {};
  for (const city of cities) {
    const plateNum = parseInt(city.plateCode, 10);
    const upserted = await prisma.city.upsert({
      where: { id: plateNum },
      update: { name: city.name, plateCode: city.plateCode, sortOrder: plateNum, status: true },
      create: { id: plateNum, name: city.name, plateCode: city.plateCode, sortOrder: plateNum, status: true },
    });
    cityMap[city.name] = upserted.id;
  }
  console.log(`Seeded ${cities.length} cities.`);

  // ==================== DISTRICTS ====================
  console.log('Seeding districts...');
  const districtData = {
    'Adana': ['Seyhan','Çukurova','Yüreğir','Sarıçam','Ceyhan'],
    'Adıyaman': ['Merkez','Kahta','Besni','Gölbaşı'],
    'Afyonkarahisar': ['Merkez','Sandıklı','Dinar','Bolvadin'],
    'Ağrı': ['Merkez','Doğubayazıt','Patnos','Eleşkirt'],
    'Amasya': ['Merkez','Merzifon','Suluova','Taşova'],
    'Ankara': ['Çankaya','Keçiören','Mamak','Etimesgut','Yenimahalle','Sincan','Altındağ','Pursaklar'],
    'Antalya': ['Muratpaşa','Konyaaltı','Kepez','Aksu','Döşemealtı'],
    'Artvin': ['Merkez','Arhavi','Hopa','Borçka'],
    'Aydın': ['Efeler','Nazilli','Söke','Kuşadası','Didim'],
    'Balıkesir': ['Altıeylül','Karesi','Bandırma','Edremit','Gönen'],
    'Bilecik': ['Merkez','Bozüyük','Söğüt','Osmaneli'],
    'Bingöl': ['Merkez','Genç','Solhan','Karlıova'],
    'Bitlis': ['Merkez','Tatvan','Ahlat','Güroymak'],
    'Bolu': ['Merkez','Gerede','Mudurnu','Göynük'],
    'Burdur': ['Merkez','Bucak','Gölhisar','Yeşilova'],
    'Bursa': ['Osmangazi','Nilüfer','Yıldırım','Mudanya','Gemlik'],
    'Çanakkale': ['Merkez','Biga','Çan','Gelibolu','Ayvacık'],
    'Çankırı': ['Merkez','Çerkeş','Ilgaz','Şabanözü'],
    'Çorum': ['Merkez','Sungurlu','Osmancık','Alaca','İskilip'],
    'Denizli': ['Merkezefendi','Pamukkale','Çivril','Acıpayam','Buldan'],
    'Diyarbakır': ['Bağlar','Kayapınar','Sur','Yenişehir','Ergani'],
    'Edirne': ['Merkez','Keşan','Uzunköprü','İpsala'],
    'Elazığ': ['Merkez','Kovancılar','Karakoçan','Baskil'],
    'Erzincan': ['Merkez','Tercan','Üzümlü','Refahiye'],
    'Erzurum': ['Yakutiye','Palandöken','Aziziye','Oltu','Horasan'],
    'Eskişehir': ['Odunpazarı','Tepebaşı','Sivrihisar','Çifteler'],
    'Gaziantep': ['Şahinbey','Şehitkamil','Nizip','İslahiye','Oğuzeli'],
    'Giresun': ['Merkez','Bulancak','Espiye','Görele'],
    'Gümüşhane': ['Merkez','Kelkit','Şiran','Torul'],
    'Hakkari': ['Merkez','Yüksekova','Şemdinli','Çukurca'],
    'Hatay': ['Antakya','İskenderun','Defne','Samandağ','Dörtyol'],
    'Isparta': ['Merkez','Yalvaç','Eğirdir','Şarkikaraağaç'],
    'Mersin': ['Yenişehir','Akdeniz','Mezitli','Toroslar','Tarsus'],
    'İstanbul': ['Kadıköy','Beşiktaş','Üsküdar','Fatih','Şişli','Bakırköy','Beyoğlu','Sarıyer','Maltepe','Kartal','Pendik','Ataşehir','Beylikdüzü','Esenyurt','Başakşehir'],
    'İzmir': ['Konak','Bornova','Karşıyaka','Buca','Bayraklı','Çiğli','Gaziemir','Balçova'],
    'Kars': ['Merkez','Sarıkamış','Kağızman','Selim'],
    'Kastamonu': ['Merkez','Tosya','Taşköprü','İnebolu'],
    'Kayseri': ['Melikgazi','Kocasinan','Talas','Develi','Bünyan'],
    'Kırklareli': ['Merkez','Lüleburgaz','Babaeski','Vize'],
    'Kırşehir': ['Merkez','Kaman','Mucur','Çiçekdağı'],
    'Kocaeli': ['İzmit','Gebze','Darıca','Körfez','Derince'],
    'Konya': ['Selçuklu','Meram','Karatay','Ereğli','Akşehir'],
    'Kütahya': ['Merkez','Tavşanlı','Simav','Gediz'],
    'Malatya': ['Battalgazi','Yeşilyurt','Doğanşehir','Akçadağ'],
    'Manisa': ['Yunusemre','Şehzadeler','Akhisar','Turgutlu','Salihli'],
    'Kahramanmaraş': ['Dulkadiroğlu','Onikişubat','Elbistan','Afşin','Göksun'],
    'Mardin': ['Artuklu','Kızıltepe','Midyat','Nusaybin','Derik'],
    'Muğla': ['Menteşe','Bodrum','Fethiye','Marmaris','Milas'],
    'Muş': ['Merkez','Malazgirt','Bulanık','Varto'],
    'Nevşehir': ['Merkez','Ürgüp','Avanos','Derinkuyu','Kozaklı'],
    'Niğde': ['Merkez','Bor','Çamardı','Ulukışla'],
    'Ordu': ['Altınordu','Ünye','Fatsa','Perşembe'],
    'Rize': ['Merkez','Çamlıhemşin','Ardeşen','Pazar','Çayeli'],
    'Sakarya': ['Adapazarı','Serdivan','Erenler','Arifiye','Hendek'],
    'Samsun': ['İlkadım','Atakum','Canik','Tekkeköy','Bafra'],
    'Siirt': ['Merkez','Kurtalan','Pervari','Baykan'],
    'Sinop': ['Merkez','Boyabat','Gerze','Ayancık'],
    'Sivas': ['Merkez','Şarkışla','Suşehri','Zara','Kangal'],
    'Tekirdağ': ['Süleymanpaşa','Çorlu','Çerkezköy','Kapaklı','Malkara'],
    'Tokat': ['Merkez','Turhal','Erbaa','Niksar','Zile'],
    'Trabzon': ['Ortahisar','Akçaabat','Araklı','Of','Yomra'],
    'Tunceli': ['Merkez','Pertek','Çemişgezek','Hozat'],
    'Şanlıurfa': ['Eyyübiye','Haliliye','Karaköprü','Siverek','Viranşehir'],
    'Uşak': ['Merkez','Banaz','Eşme','Sivaslı'],
    'Van': ['İpekyolu','Tuşba','Edremit','Erciş','Özalp'],
    'Yozgat': ['Merkez','Sorgun','Akdağmadeni','Yerköy'],
    'Zonguldak': ['Merkez','Ereğli','Çaycuma','Devrek','Alaplı'],
    'Aksaray': ['Merkez','Ortaköy','Eskil','Ağaçören'],
    'Bayburt': ['Merkez','Demirözü','Aydıntepe'],
    'Karaman': ['Merkez','Ermenek','Sarıveliler','Ayrancı'],
    'Kırıkkale': ['Merkez','Yahşihan','Keskin','Delice'],
    'Batman': ['Merkez','Kozluk','Sason','Beşiri'],
    'Şırnak': ['Merkez','Cizre','Silopi','İdil'],
    'Bartın': ['Merkez','Amasra','Ulus','Kurucaşile'],
    'Ardahan': ['Merkez','Göle','Çıldır','Hanak'],
    'Iğdır': ['Merkez','Tuzluca','Aralık','Karakoyunlu'],
    'Yalova': ['Merkez','Çınarcık','Altınova','Çiftlikköy'],
    'Karabük': ['Merkez','Safranbolu','Yenice','Eskipazar'],
    'Kilis': ['Merkez','Musabeyli','Elbeyli','Polateli'],
    'Osmaniye': ['Merkez','Kadirli','Düziçi','Bahçe'],
    'Düzce': ['Merkez','Akçakoca','Kaynaşlı','Gölyaka'],
  };

  let districtCount = 0;
  for (const [cityName, districts] of Object.entries(districtData)) {
    const cityId = cityMap[cityName];
    if (!cityId) continue;
    for (let i = 0; i < districts.length; i++) {
      const districtId = cityId * 1000 + (i + 1);
      await prisma.district.upsert({
        where: { id: districtId },
        update: { name: districts[i], cityId, sortOrder: i + 1, status: true },
        create: { id: districtId, name: districts[i], cityId, sortOrder: i + 1, status: true },
      });
      districtCount++;
    }
  }
  console.log(`Seeded ${districtCount} districts.`);

  // ==================== ADMIN USER ====================
  const adminHash = await bcrypt.hash('Admin123!', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@market.com' },
    update: { name: 'Admin', surname: 'User', passwordHash: adminHash, role: 'admin', status: true },
    create: { name: 'Admin', surname: 'User', email: 'admin@market.com', passwordHash: adminHash, role: 'admin', status: true },
  });
  console.log('Admin: admin@market.com / Admin123!');

  // ==================== REGULAR USER ====================
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

  // ==================== SETTINGS ====================
  const settings = [
    { key: 'site_name', value: 'Cihan Ekspress', group: 'general' },
    { key: 'site_description', value: 'Online Market Platformu', group: 'general' },
    { key: 'whatsapp_number', value: '+905551234567', group: 'whatsapp' },
    { key: 'whatsapp_message_template', value: '🛒 YENİ SİPARİŞ\n\nSipariş No: {siparis_no}\nMüşteri: {musteri_adi}\nTelefon: {telefon}\n\nÜrünler:\n{urunler}\n\nToplam: {toplam_usd} USD ({toplam_tl} TL)', group: 'whatsapp' },
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

  // ==================== THEME SETTINGS ====================
  const themes = [
    { key: 'primary_color', value: '#2563eb', type: 'color' },
    { key: 'secondary_color', value: '#64748b', type: 'color' },
    { key: 'accent_color', value: '#f59e0b', type: 'color' },
    { key: 'background_color', value: '#ffffff', type: 'color' },
    { key: 'foreground_color', value: '#0f172a', type: 'color' },
    { key: 'header_bg_color', value: '#ffffff', type: 'color' },
    { key: 'footer_bg_color', value: '#1e293b', type: 'color' },
    { key: 'success_color', value: '#22c55e', type: 'color' },
    { key: 'warning_color', value: '#f59e0b', type: 'color' },
    { key: 'error_color', value: '#ef4444', type: 'color' },
    { key: 'info_color', value: '#3b82f6', type: 'color' },
    { key: 'whatsapp_color', value: '#25D366', type: 'color' },
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
