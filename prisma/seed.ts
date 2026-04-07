import { PrismaClient } from "../src/generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ==================== CITIES ====================
  console.log("Seeding cities...");

  const cities = [
    { name: "Adana", plateCode: "01" },
    { name: "Adıyaman", plateCode: "02" },
    { name: "Afyonkarahisar", plateCode: "03" },
    { name: "Ağrı", plateCode: "04" },
    { name: "Amasya", plateCode: "05" },
    { name: "Ankara", plateCode: "06" },
    { name: "Antalya", plateCode: "07" },
    { name: "Artvin", plateCode: "08" },
    { name: "Aydın", plateCode: "09" },
    { name: "Balıkesir", plateCode: "10" },
    { name: "Bilecik", plateCode: "11" },
    { name: "Bingöl", plateCode: "12" },
    { name: "Bitlis", plateCode: "13" },
    { name: "Bolu", plateCode: "14" },
    { name: "Burdur", plateCode: "15" },
    { name: "Bursa", plateCode: "16" },
    { name: "Çanakkale", plateCode: "17" },
    { name: "Çankırı", plateCode: "18" },
    { name: "Çorum", plateCode: "19" },
    { name: "Denizli", plateCode: "20" },
    { name: "Diyarbakır", plateCode: "21" },
    { name: "Edirne", plateCode: "22" },
    { name: "Elazığ", plateCode: "23" },
    { name: "Erzincan", plateCode: "24" },
    { name: "Erzurum", plateCode: "25" },
    { name: "Eskişehir", plateCode: "26" },
    { name: "Gaziantep", plateCode: "27" },
    { name: "Giresun", plateCode: "28" },
    { name: "Gümüşhane", plateCode: "29" },
    { name: "Hakkari", plateCode: "30" },
    { name: "Hatay", plateCode: "31" },
    { name: "Isparta", plateCode: "32" },
    { name: "Mersin", plateCode: "33" },
    { name: "İstanbul", plateCode: "34" },
    { name: "İzmir", plateCode: "35" },
    { name: "Kars", plateCode: "36" },
    { name: "Kastamonu", plateCode: "37" },
    { name: "Kayseri", plateCode: "38" },
    { name: "Kırklareli", plateCode: "39" },
    { name: "Kırşehir", plateCode: "40" },
    { name: "Kocaeli", plateCode: "41" },
    { name: "Konya", plateCode: "42" },
    { name: "Kütahya", plateCode: "43" },
    { name: "Malatya", plateCode: "44" },
    { name: "Manisa", plateCode: "45" },
    { name: "Kahramanmaraş", plateCode: "46" },
    { name: "Mardin", plateCode: "47" },
    { name: "Muğla", plateCode: "48" },
    { name: "Muş", plateCode: "49" },
    { name: "Nevşehir", plateCode: "50" },
    { name: "Niğde", plateCode: "51" },
    { name: "Ordu", plateCode: "52" },
    { name: "Rize", plateCode: "53" },
    { name: "Sakarya", plateCode: "54" },
    { name: "Samsun", plateCode: "55" },
    { name: "Siirt", plateCode: "56" },
    { name: "Sinop", plateCode: "57" },
    { name: "Sivas", plateCode: "58" },
    { name: "Tekirdağ", plateCode: "59" },
    { name: "Tokat", plateCode: "60" },
    { name: "Trabzon", plateCode: "61" },
    { name: "Tunceli", plateCode: "62" },
    { name: "Şanlıurfa", plateCode: "63" },
    { name: "Uşak", plateCode: "64" },
    { name: "Van", plateCode: "65" },
    { name: "Yozgat", plateCode: "66" },
    { name: "Zonguldak", plateCode: "67" },
    { name: "Aksaray", plateCode: "68" },
    { name: "Bayburt", plateCode: "69" },
    { name: "Karaman", plateCode: "70" },
    { name: "Kırıkkale", plateCode: "71" },
    { name: "Batman", plateCode: "72" },
    { name: "Şırnak", plateCode: "73" },
    { name: "Bartın", plateCode: "74" },
    { name: "Ardahan", plateCode: "75" },
    { name: "Iğdır", plateCode: "76" },
    { name: "Yalova", plateCode: "77" },
    { name: "Karabük", plateCode: "78" },
    { name: "Kilis", plateCode: "79" },
    { name: "Osmaniye", plateCode: "80" },
    { name: "Düzce", plateCode: "81" },
  ];

  const cityMap: Record<string, number> = {};

  for (const city of cities) {
    const plateNum = parseInt(city.plateCode, 10);
    const upserted = await prisma.city.upsert({
      where: { id: plateNum },
      update: {
        name: city.name,
        plateCode: city.plateCode,
        sortOrder: plateNum,
        status: true,
      },
      create: {
        id: plateNum,
        name: city.name,
        plateCode: city.plateCode,
        sortOrder: plateNum,
        status: true,
      },
    });
    cityMap[city.name] = upserted.id;
  }

  console.log(`Seeded ${cities.length} cities.`);

  // ==================== DISTRICTS ====================
  console.log("Seeding districts...");

  const districtData: Record<string, string[]> = {
    "İstanbul": [
      "Kadıköy", "Beşiktaş", "Üsküdar", "Fatih", "Şişli",
      "Bakırköy", "Beyoğlu", "Sarıyer", "Maltepe", "Kartal",
      "Pendik", "Ataşehir", "Beylikdüzü", "Esenyurt", "Başakşehir",
    ],
    "Ankara": [
      "Çankaya", "Keçiören", "Mamak", "Etimesgut", "Yenimahalle",
      "Sincan", "Altındağ", "Pursaklar",
    ],
    "İzmir": [
      "Konak", "Bornova", "Karşıyaka", "Buca", "Bayraklı",
      "Çiğli", "Gaziemir", "Balçova",
    ],
    "Antalya": [
      "Muratpaşa", "Konyaaltı", "Kepez", "Aksu", "Döşemealtı",
    ],
    "Bursa": [
      "Osmangazi", "Nilüfer", "Yıldırım", "Mudanya", "Gemlik",
    ],
  };

  let districtCount = 0;
  for (const [cityName, districts] of Object.entries(districtData)) {
    const cityId = cityMap[cityName];
    if (!cityId) {
      console.warn(`City not found: ${cityName}`);
      continue;
    }

    for (let i = 0; i < districts.length; i++) {
      const districtName = districts[i];
      // Use a deterministic ID based on city and index for idempotent upserts
      const districtId = cityId * 1000 + (i + 1);
      await prisma.district.upsert({
        where: { id: districtId },
        update: {
          name: districtName,
          cityId,
          sortOrder: i + 1,
          status: true,
        },
        create: {
          id: districtId,
          name: districtName,
          cityId,
          sortOrder: i + 1,
          status: true,
        },
      });
      districtCount++;
    }
  }

  console.log(`Seeded ${districtCount} districts.`);

  // ==================== ADMIN USER ====================
  console.log("Seeding admin user...");

  const passwordHash = await hash("chnplt1905", 12);

  await prisma.adminUser.upsert({
    where: { email: "cihanekspress@admin.com" },
    update: {
      name: "Admin",
      surname: "User",
      passwordHash,
      role: "admin",
      status: true,
    },
    create: {
      name: "Admin",
      surname: "User",
      email: "cihanekspress@admin.com",
      passwordHash,
      role: "admin",
      status: true,
    },
  });

  console.log("Seeded admin user.");

  // ==================== SETTINGS ====================
  console.log("Seeding settings...");

  const settings = [
    { key: "site_name", value: "Market App", group: "general" },
    { key: "site_description", value: "Online Market Platformu", group: "general" },
    { key: "whatsapp_number", value: "+905551234567", group: "whatsapp" },
    {
      key: "whatsapp_message_template",
      value: "🛒 YENİ SİPARİŞ\n\nSipariş No: {siparis_no}\nMüşteri: {musteri_adi}\nTelefon: {telefon}\nE-posta: {eposta}\n\nTeslimat Adresi:\n{adres}\n\nÜrünler:\n{urunler}\n\nGenel Toplam: {toplam_usd} USD ({toplam_tl} TL)\n\nSipariş Notu: {siparis_notu}\nTarih: {tarih}",
      group: "whatsapp",
    },
    { key: "maintenance_mode", value: "false", group: "general" },
    { key: "guest_price_visible", value: "true", group: "product" },
    { key: "currency_auto_update", value: "true", group: "currency" },
    { key: "usd_rate", value: "32.50", group: "currency" },
    { key: "low_stock_threshold", value: "5", group: "product" },
    { key: "max_product_images", value: "10", group: "product" },
    { key: "max_image_size_mb", value: "5", group: "product" },
    { key: "new_product_days", value: "30", group: "product" },
    { key: "cart_expiry_days", value: "30", group: "cart" },
    { key: "payment_link_hours", value: "24", group: "payment" },
    { key: "sms_verification", value: "false", group: "sms" },
    { key: "email_verification", value: "true", group: "email" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, group: setting.group },
      create: setting,
    });
  }

  console.log(`Seeded ${settings.length} settings.`);

  // ==================== THEME SETTINGS ====================
  console.log("Seeding theme settings...");

  const themeSettings = [
    { key: "primary_color", value: "#2563eb", type: "color" },
    { key: "secondary_color", value: "#64748b", type: "color" },
    { key: "accent_color", value: "#f59e0b", type: "color" },
    { key: "background_color", value: "#ffffff", type: "color" },
    { key: "foreground_color", value: "#0f172a", type: "color" },
    { key: "header_bg_color", value: "#ffffff", type: "color" },
    { key: "footer_bg_color", value: "#1e293b", type: "color" },
    { key: "success_color", value: "#22c55e", type: "color" },
    { key: "warning_color", value: "#f59e0b", type: "color" },
    { key: "error_color", value: "#ef4444", type: "color" },
    { key: "info_color", value: "#3b82f6", type: "color" },
    { key: "whatsapp_color", value: "#25D366", type: "color" },
    { key: "border_radius", value: "0.5rem", type: "size" },
    { key: "font_family", value: "Inter", type: "font" },
  ];

  for (const theme of themeSettings) {
    await prisma.themeSetting.upsert({
      where: { key: theme.key },
      update: { value: theme.value, type: theme.type },
      create: theme,
    });
  }

  console.log(`Seeded ${themeSettings.length} theme settings.`);

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
