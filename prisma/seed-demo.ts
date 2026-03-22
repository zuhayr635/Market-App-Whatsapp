/**
 * Demo RC Car Store Seed
 * Çalışan görseller (picsum.photos) + tüm alanlar dolu
 */
import { PrismaClient, ProductStatus, ProductVisibility } from "../src/generated/prisma"
import { Prisma } from "../src/generated/prisma"

const prisma = new PrismaClient()

// ─── Picsum helper ────────────────────────────────────────────────────────────
// seed parametresi ile her ürün için tutarlı, güzel fotoğraf
function img(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

async function main() {
  console.log("Demo RC seed başlatılıyor...\n")

  // ─────────────────────── TEMİZLİK ────────────────────────────────────────
  console.log("Eski demo veriler siliniyor...")

  // Demo ürünleri bul ve sil (sku'su TRA veya ARA veya DYN veya PRO ile başlayanlar)
  const demoSkus = [
    "TRA67097-4-GRN","TRA68154-4-RED","ARA8608V6T1","TRA92076-4-ORNG","TRA24076-4-PRPL",
    "DYNS0501","TRA2985-3S","TRA2075X","PRO10158-17","TRA5460A",
    // yeni eklenecekler
    "TRA83076-4-RED","ARA8611V5T4","TRA57016-4","TRA93054-4","TRA77086-4",
    "TRA2200X","DYN5116","PRO3441-17","PRO3480-203","HPI109930",
    "TRA5434","TRA5444","PRO8275-110",
  ]
  await prisma.product.deleteMany({ where: { sku: { in: demoSkus } } })
  console.log("Eski demo ürünler silindi.\n")

  // ─────────────────────── MARKALAR ────────────────────────────────────────
  console.log("Markalar oluşturuluyor...")
  const brandDefs = [
    { name: "Traxxas",        slug: "traxxas",        logo: img("brand-traxxas", 200, 80) },
    { name: "ARRMA",          slug: "arrma",          logo: img("brand-arrma", 200, 80) },
    { name: "Dynamite",       slug: "dynamite",       logo: img("brand-dynamite", 200, 80) },
    { name: "Pro-Line",       slug: "pro-line",       logo: img("brand-proline", 200, 80) },
    { name: "Losi",           slug: "losi",           logo: img("brand-losi", 200, 80) },
    { name: "Team Associated", slug: "team-associated", logo: img("brand-teamassociated", 200, 80) },
    { name: "HPI Racing",     slug: "hpi-racing",     logo: img("brand-hpi", 200, 80) },
  ]
  const BM: Record<string, string> = {}
  for (const b of brandDefs) {
    const rec = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, logo: b.logo, status: true },
      create: { name: b.name, slug: b.slug, logo: b.logo, status: true },
    })
    BM[b.slug] = rec.id
  }
  console.log(`${brandDefs.length} marka ✓\n`)

  // ─────────────────────── KATEGORİLER ─────────────────────────────────────
  console.log("Kategoriler oluşturuluyor...")

  async function upsertCat(slug: string, name: string, description: string, parentId: string | null, sortOrder: number) {
    return prisma.category.upsert({
      where: { slug },
      update: { name, parentId, sortOrder },
      create: { name, slug, description, parentId, sortOrder, status: true },
    })
  }

  // Ana kategoriler
  const catRC    = await upsertCat("rc-arabalar",   "RC Arabalar",           "Uzaktan kumandalı araçlar ve RTR setler",                null, 1)
  const catParca = await upsertCat("yedek-parcalar","Yedek Parçalar",        "Motor, servo, batarya ve tüm yedek parçalar",            null, 2)
  const catElek  = await upsertCat("elektronik",    "Elektronik",            "Alıcı, verici, ESC ve elektronik sistemler",             null, 3)
  const catAkses = await upsertCat("aksesuarlar",   "Aksesuarlar",           "Araç aksesuarları, bakım ekipmanları ve setler",         null, 4)
  const catFrst  = await upsertCat("firsatlar",     "Fırsatlar & İndirimler","İndirimli ürünler ve kampanyalar",                      null, 5)

  // RC Arabalar alt kategorileri
  const catOffRoad = await upsertCat("off-road-rc",        "Off-Road RC",           "4WD arazi araçları ve stadium trucklar",       catRC.id, 1)
  const catOnRoad  = await upsertCat("on-road-circuit",    "On-Road / Circuit",     "Asfalt ve pist RC araçları",                  catRC.id, 2)
  const catDrift   = await upsertCat("drift-rc",           "Drift RC",              "Drift RC araçları ve drift setleri",          catRC.id, 3)
  const catMonster = await upsertCat("monster-truck",      "Monster Truck",         "Büyük tekerlekli monster truck araçları",     catRC.id, 4)
  const catCrawler = await upsertCat("rock-crawler",       "Rock Crawler",          "Kaya tırmanıcı ve trail araçları",            catRC.id, 5)
  const catBuggy   = await upsertCat("buggy",              "Buggy",                 "Off-road buggy tipi RC araçlar",              catRC.id, 6)
  const catSCT     = await upsertCat("short-course-truck", "Short Course Truck",    "Short course tipi RC kamyonetler",            catRC.id, 7)
  const catTruggy  = await upsertCat("truggy",             "Truggy",                "Truggy hibrit RC araçlar",                   catRC.id, 8)

  // Yedek Parçalar alt kategorileri
  const catMotor   = await upsertCat("motor-esc",            "Motor & ESC",           "Fırçasız motorlar ve elektronik hız kontrolcüleri", catParca.id, 1)
  const catServo   = await upsertCat("servo-motorlar",       "Servo Motorlar",        "Analog ve dijital servo motorlar",                  catParca.id, 2)
  const catBatarya = await upsertCat("batarya-sarj",         "Batarya & Şarj",        "LiPo, NiMH bataryalar ve şarj cihazları",           catParca.id, 3)
  const catSusp    = await upsertCat("suspansiyon",          "Süspansiyon & Amortisör","Şok, yay ve süspansiyon sistemleri",               catParca.id, 4)
  const catLastik  = await upsertCat("tekerlekler-jantlar",  "Tekerlekler & Jantlar", "RC lastikler, bantlar ve jantlar",                  catParca.id, 5)
  const catSasi    = await upsertCat("sasi-govde",           "Şasi & Gövde",          "Şasi parçaları ve karoseri gövdeleri",               catParca.id, 6)
  const catDisli   = await upsertCat("disli-aktarma",        "Dişli & Aktarma",       "Diferansiyel, dişli kutusu ve aktarma",              catParca.id, 7)
  const catYay     = await upsertCat("yay-klips",            "Yay & Klips",           "Yaylar, klipsler ve küçük metal parçalar",           catParca.id, 8)

  // Elektronik alt kategorileri
  const catRx   = await upsertCat("alici-verici",      "Alıcı & Verici",      "2.4GHz ve DSM alıcı-verici setleri",          catElek.id, 1)
  const catLed  = await upsertCat("led-sistemleri",    "LED Sistemleri",      "RC için LED ve aydınlatma sistemleri",         catElek.id, 2)
  const catGyro = await upsertCat("gyro-stabilizator", "Gyro & Stabilizatör", "Drift ve stabilizasyon gyroları",             catElek.id, 3)

  // Aksesuarlar alt kategorileri
  await upsertCat("alet-takim",      "Alet & Takım",       "RC araç bakım aletleri ve seti",              catAkses.id, 1)
  await upsertCat("boya-decal",      "Boya & Decal",       "Karoseri boyaları, marker ve çıkartmalar",    catAkses.id, 2)
  await upsertCat("tasima-saklama",  "Taşıma & Saklama",   "Taşıma çantaları ve saklama kutuları",        catAkses.id, 3)
  await upsertCat("sarj-istasyonu",  "Şarj İstasyonu",     "Şarj istasyonları ve güç kaynakları",         catAkses.id, 4)

  console.log("Kategoriler oluşturuldu ✓\n")

  // ─────────────────────── ATTRİBÜT TİPLERİ ────────────────────────────────
  console.log("Özellik tipleri oluşturuluyor...")

  async function upsertAttrType(slug: string, name: string) {
    return prisma.attributeType.upsert({
      where: { slug },
      update: { name, status: true },
      create: { slug, name, status: true },
    })
  }

  const AT = {
    olcek:     await upsertAttrType("olcek",          "Ölçek"),
    cekis:     await upsertAttrType("cekis",          "Çekiş"),
    motor:     await upsertAttrType("motor-tipi",     "Motor Tipi"),
    hiz:       await upsertAttrType("max-hiz",        "Maks. Hız"),
    batarya:   await upsertAttrType("batarya-tipi",   "Batarya Tipi"),
    frekans:   await upsertAttrType("frekans",        "Frekans"),
    uzunluk:   await upsertAttrType("uzunluk",        "Uzunluk"),
    genislik:  await upsertAttrType("genislik",       "Genişlik"),
    yukseklik: await upsertAttrType("yukseklik",      "Yükseklik"),
    agirlik:   await upsertAttrType("agirlik",        "Ağırlık"),
    menzi:     await upsertAttrType("menzil",         "Kumanda Menzili"),
    renk:      await upsertAttrType("renk",           "Renk"),
    uretici:   await upsertAttrType("uretici-ulke",   "Üretim Ülkesi"),
    voltaj:    await upsertAttrType("voltaj",         "Voltaj"),
    kapasite:  await upsertAttrType("kapasite",       "Kapasite"),
    tork:      await upsertAttrType("tork",           "Tork"),
    suges:     await upsertAttrType("su-gecirmez",    "Su Geçirmezlik"),
  }
  console.log("Özellik tipleri oluşturuldu ✓\n")

  // ─────────────────────── ÜRÜNLER ─────────────────────────────────────────
  console.log("Ürünler oluşturuluyor...\n")

  type AttrDef = { typeId: string; value: string }
  type TabDef  = { title: string; content: string; icon?: string; sortOrder: number }
  type ImgDef  = { url: string; altText: string; title?: string }
  type ProdDef = {
    name: string; slug: string; sku: string; barcode?: string
    brandSlug: string; manufacturer: string; originCountry: string
    shortDesc: string; fullDesc: string
    priceUsd: number; priceTl: number
    salePriceUsd?: number; salePriceTl?: number
    saleStart?: string; saleEnd?: string
    vatRate: number; vatIncluded: boolean
    stockQty: number; lowStockThreshold: number; stockTracking: boolean
    weight?: number; width?: number; height?: number; depth?: number
    isFeatured?: boolean; isNew?: boolean; isBestSeller?: boolean
    seoTitle: string; seoDesc: string
    sortOrder: number
    categories: string[]  // category IDs
    images: ImgDef[]
    attributes: AttrDef[]
    tabs: TabDef[]
  }

  const catMap: Record<string, string> = {
    "off-road-rc":        catOffRoad.id,
    "on-road-circuit":    catOnRoad.id,
    "drift-rc":           catDrift.id,
    "monster-truck":      catMonster.id,
    "rock-crawler":       catCrawler.id,
    "buggy":              catBuggy.id,
    "short-course-truck": catSCT.id,
    "truggy":             catTruggy.id,
    "motor-esc":          catMotor.id,
    "servo-motorlar":     catServo.id,
    "batarya-sarj":       catBatarya.id,
    "suspansiyon":        catSusp.id,
    "tekerlekler-jantlar":catLastik.id,
    "sasi-govde":         catSasi.id,
    "disli-aktarma":      catDisli.id,
    "yay-klips":          catYay.id,
    "alici-verici":       catRx.id,
    "led-sistemleri":     catLed.id,
    "gyro-stabilizator":  catGyro.id,
    "rc-arabalar":        catRC.id,
    "yedek-parcalar":     catParca.id,
    "elektronik":         catElek.id,
    "aksesuarlar":        catAkses.id,
    "firsatlar":          catFrst.id,
  }

  const PRODUCTS: ProdDef[] = [
    // ══════════════════════ RC ARAÇLAR ═══════════════════════════════════════

    {
      name: "Traxxas Rustler 4x4 Ultimate 1/10 RTR Fırçasız Arazi Arabası",
      slug: "traxxas-rustler-4x4-ultimate",
      sku: "TRA67097-4-GRN",
      barcode: "0020334670973",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "VXL-4S fırçasız güç sistemi ve 4WD ile donanmış 1/10 ölçek Stadium Truck. Waterproof elektronikler, self-righting ve TQi 2.4GHz telsiz dahil.",
      fullDesc: `<h2>Traxxas Rustler 4x4 Ultimate – Arazi Hükümdarı</h2>
<p>Rustler 4x4 Ultimate, Traxxas'ın en hızlı ve en güçlü hazır RTR araçlarından biridir. VXL-4S fırçasız güç sistemi sayesinde <strong>100+ km/s</strong> hıza ulaşır ve her türlü arazide kontrol kaybetmez.</p>
<h3>Öne Çıkan Özellikler</h3>
<ul>
  <li><strong>Velineon VXL-4S</strong> – 4S LiPo uyumlu fırçasız güç sistemi</li>
  <li><strong>4 Tekerlekten Çekiş</strong> – Eğimli ve kaygan yüzeylerde maksimum tutunma</li>
  <li><strong>Waterproof Elektronikler</strong> – Her hava koşulunda güvenli kullanım</li>
  <li><strong>Self-Righting</strong> – Ters döndüğünde tek tuşla düzelme</li>
  <li><strong>TQi 2.4GHz</strong> – Çift yönlü telemetri destekli telsiz</li>
  <li><strong>TSM (Stability Management)</strong> – Otomatik denge sistemi</li>
</ul>
<h3>Kullanım Alanları</h3>
<p>Ön bahçeden tutun kum tepelerine, çim alanlara ve taşlık arazilere kadar her ortamda performansını koruyan Rustler 4x4, rekabetçi yarışçılar ve hobiciler için idealdir.</p>`,
      priceUsd: 489.99, priceTl: 15929.67,
      salePriceUsd: 429.99, salePriceTl: 13974.68,
      saleStart: "2026-03-01T00:00:00Z", saleEnd: "2026-04-01T00:00:00Z",
      vatRate: 18, vatIncluded: true,
      stockQty: 8, lowStockThreshold: 3, stockTracking: true,
      weight: 2.5, width: 38.5, height: 18.0, depth: 26.0,
      isFeatured: true, isNew: true, isBestSeller: false,
      seoTitle: "Traxxas Rustler 4x4 Ultimate RTR – 1/10 Fırçasız Arazi Arabası | RC Store",
      seoDesc: "Traxxas Rustler 4x4 Ultimate fırçasız 1/10 ölçek stadium truck. VXL-4S güç sistemi, 4WD, waterproof. Türkiye'nin en iyi fiyatıyla satın al.",
      sortOrder: 1,
      categories: ["rc-arabalar", "off-road-rc"],
      images: [
        { url: img("rustler-4x4-main"), altText: "Traxxas Rustler 4x4 Ultimate – Yeşil Ana Görsel", title: "Traxxas Rustler 4x4 Ultimate" },
        { url: img("rustler-4x4-side"), altText: "Traxxas Rustler 4x4 Ultimate – Yan Görsel" },
        { url: img("rustler-4x4-top"),  altText: "Traxxas Rustler 4x4 Ultimate – Üst Görsel" },
        { url: img("rustler-4x4-motor"),altText: "Traxxas Rustler 4x4 Ultimate – Motor Detayı" },
        { url: img("rustler-4x4-action"),altText:"Traxxas Rustler 4x4 Ultimate – Arazi Hareketi" },
      ],
      attributes: [
        { typeId: AT.olcek.id, value: "1/10" },
        { typeId: AT.cekis.id, value: "4WD (Dört Tekerlekten Çekiş)" },
        { typeId: AT.motor.id, value: "Velineon 3500kV Fırçasız" },
        { typeId: AT.hiz.id,   value: "100+ km/s" },
        { typeId: AT.batarya.id, value: "4S LiPo (14.8V) – Dahil Değil" },
        { typeId: AT.frekans.id, value: "2.4 GHz" },
        { typeId: AT.uzunluk.id, value: "385 mm" },
        { typeId: AT.genislik.id, value: "260 mm" },
        { typeId: AT.yukseklik.id, value: "155 mm" },
        { typeId: AT.agirlik.id, value: "2.5 kg (Batarya Hariç)" },
        { typeId: AT.menzi.id, value: "300+ m" },
        { typeId: AT.renk.id, value: "Yeşil / Siyah" },
        { typeId: AT.uretici.id, value: "ABD" },
        { typeId: AT.suges.id, value: "Evet – Tam Waterproof" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0,
          content: `<p>Traxxas Rustler 4x4 Ultimate, en yüksek performanslı hazır RTR (Ready-To-Run) araçlardan biridir. VXL-4S fırçasız sistemi sayesinde 4S LiPo batarya kullanarak 100 km/s'nin üzerinde hız yapabilir.</p><p>Araç, su geçirmez elektronikleri sayesinde yağmurlu havada, çamurda ve sığ sularda güvenle kullanılabilir. Self-righting özelliği sayesinde ters döndüğünde kumandadan tek bir tuşla kendi kendine düzelir.</p>` },
        { title: "Teknik Özellikler", icon: "settings", sortOrder: 1,
          content: `<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
<tr><th>Özellik</th><th>Değer</th></tr>
<tr><td>Ölçek</td><td>1/10</td></tr>
<tr><td>Çekiş</td><td>4WD</td></tr>
<tr><td>Motor</td><td>Velineon 3500kV Brushless</td></tr>
<tr><td>ESC</td><td>VXL-4S Waterproof</td></tr>
<tr><td>Batarya</td><td>4S LiPo 14.8V (Dahil Değil)</td></tr>
<tr><td>Şarj Süresi</td><td>~60 dak (5000mAh)</td></tr>
<tr><td>Sürüş Süresi</td><td>~20–30 dak</td></tr>
<tr><td>Maks. Hız</td><td>100+ km/s</td></tr>
<tr><td>Uzunluk</td><td>385 mm</td></tr>
<tr><td>Genişlik</td><td>260 mm</td></tr>
<tr><td>Ağırlık</td><td>2,5 kg</td></tr>
<tr><td>Su Geçirmezlik</td><td>Tam Waterproof</td></tr>
</table>` },
        { title: "Kutu İçeriği", icon: "package", sortOrder: 2,
          content: `<ul><li>1× Traxxas Rustler 4x4 Ultimate Araç (Boyalı Karoseri)</li><li>1× TQi 2.4GHz Telsiz Sistem</li><li>1× TRX Güç Konektörü</li><li>1× Kullanım Kılavuzu</li></ul><p><strong>Not:</strong> Batarya ve şarj cihazı dahil değildir. Traxxas 4S LiPo batarya (TRA2890X) önerilir.</p>` },
      ],
    },

    {
      name: "Traxxas Slash BL-2S 1/10 RTR Short Course Truck – Kırmızı",
      slug: "traxxas-slash-bl2s-kirmizi",
      sku: "TRA68154-4-RED",
      barcode: "0020334681547",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "2S LiPo uyumlu fırçasız Short Course Truck. Batarya ve şarj cihazı dahil. Yeni başlayanlar için ideal.",
      fullDesc: `<h2>Traxxas Slash BL-2S – En Sevilen Short Course Truck</h2>
<p>Traxxas Slash, dünyanın en çok satan RC short course truck'ıdır. BL-2S versiyonu, fırçasız motor ve 2S LiPo uyumlu ESC ile önceki nesle göre çok daha hızlı ve verimlidir.</p>
<h3>Neden Slash?</h3>
<ul>
  <li>Kusursuz dengeli ağırlık dağılımı</li>
  <li>Yüksek yere temizliği ile arazi uyumluluğu</li>
  <li>Yerden yükseltilmiş elektronikler</li>
  <li>Geniş yedek parça ekosistemi</li>
</ul>`,
      priceUsd: 379.99, priceTl: 12349.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 12, lowStockThreshold: 5, stockTracking: true,
      weight: 2.2, width: 36.0, height: 17.5, depth: 25.5,
      isFeatured: true, isNew: false, isBestSeller: true,
      seoTitle: "Traxxas Slash BL-2S Short Course Truck 1/10 RTR | RC Store",
      seoDesc: "Traxxas Slash BL-2S fırçasız short course truck. 2S LiPo uyumlu, batarya dahil. En iyi fiyat garantisi.",
      sortOrder: 2,
      categories: ["rc-arabalar", "short-course-truck"],
      images: [
        { url: img("slash-bl2s-main"),   altText: "Traxxas Slash BL-2S Kırmızı – Ana Görsel" },
        { url: img("slash-bl2s-side"),   altText: "Traxxas Slash BL-2S Kırmızı – Yan Görsel" },
        { url: img("slash-bl2s-front"),  altText: "Traxxas Slash BL-2S Kırmızı – Ön Görsel" },
        { url: img("slash-bl2s-bottom"), altText: "Traxxas Slash BL-2S Kırmızı – Alt Görsel" },
      ],
      attributes: [
        { typeId: AT.olcek.id, value: "1/10" },
        { typeId: AT.cekis.id, value: "2WD (İki Tekerlekten Çekiş)" },
        { typeId: AT.motor.id, value: "Velineon 3500kV Fırçasız" },
        { typeId: AT.hiz.id,   value: "65+ km/s" },
        { typeId: AT.batarya.id, value: "7.4V 2S LiPo / 7.2V NiMH" },
        { typeId: AT.frekans.id, value: "2.4 GHz" },
        { typeId: AT.uzunluk.id, value: "560 mm" },
        { typeId: AT.genislik.id, value: "255 mm" },
        { typeId: AT.agirlik.id, value: "2.2 kg" },
        { typeId: AT.menzi.id, value: "300+ m" },
        { typeId: AT.renk.id, value: "Kırmızı" },
        { typeId: AT.suges.id, value: "Evet – Waterproof" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0,
          content: "<p>Traxxas Slash BL-2S, dünyanın en sevilen RC short course truck platformunun fırçasız versiyonudur. 2S uyumlu sistemi ile hem yeni başlayanlar hem de deneyimli kullanıcılar için mükemmeldir.</p>" },
        { title: "Teknik Özellikler", icon: "settings", sortOrder: 1,
          content: `<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Özellik</th><th>Değer</th></tr><tr><td>Ölçek</td><td>1/10</td></tr><tr><td>Motor</td><td>Velineon 3500kV Brushless</td></tr><tr><td>ESC</td><td>VXL-3s</td></tr><tr><td>Batarya</td><td>Powercel 2S 7.2V NiMH (Dahil)</td></tr><tr><td>Maks. Hız</td><td>65+ km/s</td></tr></table>` },
        { title: "Kutu İçeriği", icon: "package", sortOrder: 2,
          content: "<ul><li>1× Traxxas Slash Araç</li><li>1× TQi Telsiz</li><li>1× Powercel 2S NiMH Batarya</li><li>1× 4A Şarj Cihazı</li><li>1× Kılavuz</li></ul>" },
      ],
    },

    {
      name: "ARRMA Kraton 6S BLX V6 1/8 Monster Truck – Mavi/Turuncu",
      slug: "arrma-kraton-6s-v6",
      sku: "ARA8608V6T1",
      barcode: "0590921200840",
      brandSlug: "arrma",
      manufacturer: "Horizon Hobby",
      originCountry: "Çin",
      shortDesc: "6S LiPo 1/8 ölçek monster truck. Spektrum Firma 6S sistemi, alüminyum diferansiyel kasaları. Extreme Bash serisi.",
      fullDesc: `<h2>ARRMA Kraton 6S BLX V6 – Monster Truck Ustası</h2>
<p>Kraton V6, güçlü 6S sisteminin son teknoloji alüminyum bileşenlerle buluştuğu en gelişmiş monster truck platformudur. Her türlü koşulda sınır tanımaz.</p>`,
      priceUsd: 649.99, priceTl: 21124.67,
      salePriceUsd: 579.99, salePriceTl: 18849.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 5, lowStockThreshold: 2, stockTracking: true,
      weight: 5.2, width: 46.5, height: 26.5, depth: 38.0,
      isFeatured: true, isNew: true, isBestSeller: false,
      seoTitle: "ARRMA Kraton 6S BLX V6 1/8 Monster Truck | RC Store",
      seoDesc: "ARRMA Kraton 6S V6 monster truck. 6S LiPo güç, alüminyum bileşenler. Türkiye'nin en iyi RC araç mağazası.",
      sortOrder: 3,
      categories: ["rc-arabalar", "monster-truck"],
      images: [
        { url: img("kraton-6s-main"),  altText: "ARRMA Kraton 6S V6 – Ana Görsel" },
        { url: img("kraton-6s-side"),  altText: "ARRMA Kraton 6S V6 – Yan Görsel" },
        { url: img("kraton-6s-front"), altText: "ARRMA Kraton 6S V6 – Ön Görsel" },
        { url: img("kraton-6s-jump"),  altText: "ARRMA Kraton 6S V6 – Hava Hareketi" },
      ],
      attributes: [
        { typeId: AT.olcek.id, value: "1/8" },
        { typeId: AT.cekis.id, value: "4WD" },
        { typeId: AT.motor.id, value: "Spektrum Firma 6S 2050Kv Brushless" },
        { typeId: AT.hiz.id,   value: "80+ km/s" },
        { typeId: AT.batarya.id, value: "6S LiPo (22.2V) – Dahil Değil" },
        { typeId: AT.frekans.id, value: "2.4 GHz FHSS" },
        { typeId: AT.uzunluk.id, value: "580 mm" },
        { typeId: AT.agirlik.id, value: "5.2 kg" },
        { typeId: AT.renk.id, value: "Mavi / Turuncu" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0,
          content: "<p>Kraton V6, ARRMA'nın Extreme Bash serisinin amiral gemisidir. Alüminyum diferansiyel kasaları, çelik dişli kutusu ve geliştirilmiş amortisör sistemi ile maksimum dayanıklılık sunar.</p>" },
        { title: "Teknik Özellikler", icon: "settings", sortOrder: 1,
          content: `<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Özellik</th><th>Değer</th></tr><tr><td>Ölçek</td><td>1/8</td></tr><tr><td>Motor</td><td>Spektrum Firma 6S 2050Kv</td></tr><tr><td>ESC</td><td>Spektrum Firma 160A</td></tr><tr><td>Servo</td><td>Spektrum S905 Dijital Metal Dişli</td></tr><tr><td>Alıcı</td><td>Spektrum SR6100AT</td></tr></table>` },
        { title: "Kutu İçeriği", icon: "package", sortOrder: 2,
          content: "<ul><li>1× ARRMA Kraton Araç</li><li>1× Spektrum DX3 Telsiz</li><li>1× Kullanım Kılavuzu</li></ul><p>Batarya ve şarj cihazı dahil değildir.</p>" },
      ],
    },

    {
      name: "Traxxas TRX-4 1/10 Ford Bronco Trail Crawler – Turuncu",
      slug: "traxxas-trx4-ford-bronco",
      sku: "TRA92076-4-ORNG",
      barcode: "0020334920763",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "Lisanslı Ford Bronco karoseri ile 1/10 trail crawler. Çift hızlı şanzıman, portal aks ve elektronik diferansiyel kilidi.",
      fullDesc: `<h2>Traxxas TRX-4 Ford Bronco – Efsane Çıktı</h2>
<p>1966 Ford Bronco'nun ikonik tasarımı, Traxxas'ın güçlü TRX-4 platformuyla buluşuyor. Detaylı karoseri, çalışan aksesuar takımları ve üstün arazi kabiliyeti ile TRX-4 Bronco koleksiyonun baş tacıdır.</p>`,
      priceUsd: 599.99, priceTl: 19499.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 7, lowStockThreshold: 3, stockTracking: true,
      weight: 4.1, width: 35.5, height: 22.0, depth: 42.5,
      isFeatured: true, isNew: false, isBestSeller: true,
      seoTitle: "Traxxas TRX-4 Ford Bronco 1/10 Trail Crawler | RC Store",
      seoDesc: "Traxxas TRX-4 Ford Bronco trail crawler. Lisanslı karoseri, portal aks, çift hızlı şanzıman. Hemen sipariş ver.",
      sortOrder: 4,
      categories: ["rc-arabalar", "rock-crawler"],
      images: [
        { url: img("trx4-bronco-main"),  altText: "Traxxas TRX-4 Ford Bronco – Ana Görsel" },
        { url: img("trx4-bronco-side"),  altText: "Traxxas TRX-4 Ford Bronco – Yan Görsel" },
        { url: img("trx4-bronco-front"), altText: "Traxxas TRX-4 Ford Bronco – Ön Görsel" },
        { url: img("trx4-bronco-int"),   altText: "Traxxas TRX-4 Ford Bronco – İç Detay" },
        { url: img("trx4-bronco-rock"),  altText: "Traxxas TRX-4 Ford Bronco – Kaya Üstünde" },
      ],
      attributes: [
        { typeId: AT.olcek.id, value: "1/10" },
        { typeId: AT.cekis.id, value: "4WD – Portal Aks" },
        { typeId: AT.motor.id, value: "Titan 21T 550 Fırçalı" },
        { typeId: AT.hiz.id,   value: "25 km/s" },
        { typeId: AT.batarya.id, value: "7.4V 2S LiPo / 8.4V NiMH" },
        { typeId: AT.frekans.id, value: "2.4 GHz" },
        { typeId: AT.uzunluk.id, value: "585 mm" },
        { typeId: AT.agirlik.id, value: "4.1 kg" },
        { typeId: AT.renk.id, value: "Turuncu" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>TRX-4 Ford Bronco, kaya tırmanma ve trail sürüşü için tasarlanmış olup portal aks, çift hızlı şanzıman ve elektronik ön/arka diferansiyel kilidi içerir.</p>" },
        { title: "Teknik Özellikler", icon: "settings", sortOrder: 1, content: `<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Özellik</th><th>Değer</th></tr><tr><td>Ölçek</td><td>1/10</td></tr><tr><td>Şanzıman</td><td>2 Hızlı (Yüksek/Alçak)</td></tr><tr><td>Diferansiyel</td><td>Elektronik Kilit (Ön+Arka)</td></tr><tr><td>Aks Tipi</td><td>Portal Aks</td></tr></table>` },
        { title: "Kutu İçeriği", icon: "package", sortOrder: 2, content: "<ul><li>1× TRX-4 Bronco Araç</li><li>1× TQi Telsiz</li><li>1× Multi-DC şarj cihazı</li><li>1× 8.4V NiMH Batarya</li></ul>" },
      ],
    },

    {
      name: "Traxxas Bandit VXL 1/10 2WD Buggy RTR – Mor",
      slug: "traxxas-bandit-vxl-mor",
      sku: "TRA24076-4-PRPL",
      barcode: "0020334240766",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "TSM destekli VXL fırçasız güç sistemi ile 1/10 2WD buggy. 110 km/s hız kabiliyeti.",
      fullDesc: `<h2>Traxxas Bandit VXL – Hız Canavarı</h2>
<p>Bandit VXL, 1/10 ölçek RC dünyasında hız konusunda rakipsizdir. Velineon VXL-3s fırçasız sistemi ve TSM (Traxxas Stability Management) ile donanmış bu araç, kontrolü kaybetmeden inanılmaz hızlara ulaşır.</p>`,
      priceUsd: 349.99, priceTl: 11374.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 10, lowStockThreshold: 4, stockTracking: true,
      weight: 1.8, width: 27.5, height: 14.5, depth: 36.5,
      isFeatured: false, isNew: false, isBestSeller: true,
      seoTitle: "Traxxas Bandit VXL 1/10 2WD Buggy – 110 km/s | RC Store",
      seoDesc: "Traxxas Bandit VXL buggy. TSM, waterproof VXL-3s, 110+ km/s. Hemen sipariş ver.",
      sortOrder: 5,
      categories: ["rc-arabalar", "buggy"],
      images: [
        { url: img("bandit-vxl-main"),  altText: "Traxxas Bandit VXL Mor – Ana Görsel" },
        { url: img("bandit-vxl-side"),  altText: "Traxxas Bandit VXL Mor – Yan Görsel" },
        { url: img("bandit-vxl-top"),   altText: "Traxxas Bandit VXL Mor – Üst Görsel" },
        { url: img("bandit-vxl-wheel"), altText: "Traxxas Bandit VXL Mor – Tekerlek Detayı" },
      ],
      attributes: [
        { typeId: AT.olcek.id, value: "1/10" },
        { typeId: AT.cekis.id, value: "2WD (Arka Çekiş)" },
        { typeId: AT.motor.id, value: "Velineon 3500kV Fırçasız" },
        { typeId: AT.hiz.id,   value: "110+ km/s" },
        { typeId: AT.batarya.id, value: "3S LiPo (11.1V)" },
        { typeId: AT.frekans.id, value: "2.4 GHz TQi" },
        { typeId: AT.uzunluk.id, value: "365 mm" },
        { typeId: AT.agirlik.id, value: "1.8 kg" },
        { typeId: AT.renk.id, value: "Mor" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>Traxxas Bandit VXL, piyasanın en hızlı hazır RTR buggy'lerinden biridir. TSM sistemi, yüksek hızda araçtan kontrolü elinize verir.</p>" },
        { title: "Teknik Özellikler", icon: "settings", sortOrder: 1, content: `<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr><th>Özellik</th><th>Değer</th></tr><tr><td>Ölçek</td><td>1/10</td></tr><tr><td>Motor</td><td>Velineon 3500kV</td></tr><tr><td>Maks. Hız</td><td>110+ km/s (3S ile)</td></tr><tr><td>TSM</td><td>Evet</td></tr></table>` },
      ],
    },

    {
      name: "Traxxas Maxx 1/10 4S 4WD Monster Truck – Kırmızı",
      slug: "traxxas-maxx-4s-kirmizi",
      sku: "TRA89076-4-RED",
      barcode: "0020334890764",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "4S LiPo uyumlu 1/10 monster truck. Wide-Maxx süspansiyon paketi, self-righting, waterproof.",
      fullDesc: `<h2>Traxxas Maxx – Doğanın Efendisi</h2>
<p>Traxxas Maxx, 1/10 ölçek monster truck kategorisinin en iyisidir. Wide-Maxx süspansiyon kiti ile geniş iz ve artan stabilite, aşırı arazi koşullarında bile kontrol kaybetmemenizi sağlar.</p>`,
      priceUsd: 449.99, priceTl: 14624.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 6, lowStockThreshold: 2, stockTracking: true,
      weight: 3.8, width: 44.5, height: 24.5, depth: 38.0,
      isFeatured: true, isNew: true, isBestSeller: false,
      seoTitle: "Traxxas Maxx 1/10 4S Monster Truck | RC Store",
      seoDesc: "Traxxas Maxx 4S monster truck. Wide-Maxx süspansiyon, self-righting, waterproof. Hemen sipariş ver.",
      sortOrder: 6,
      categories: ["rc-arabalar", "monster-truck"],
      images: [
        { url: img("maxx-4s-main"),  altText: "Traxxas Maxx 4S – Ana Görsel" },
        { url: img("maxx-4s-side"),  altText: "Traxxas Maxx 4S – Yan Görsel" },
        { url: img("maxx-4s-top"),   altText: "Traxxas Maxx 4S – Üst Görsel" },
        { url: img("maxx-4s-jump"),  altText: "Traxxas Maxx 4S – Atlama" },
      ],
      attributes: [
        { typeId: AT.olcek.id, value: "1/10" },
        { typeId: AT.cekis.id, value: "4WD" },
        { typeId: AT.motor.id, value: "Velineon 3500kV Fırçasız" },
        { typeId: AT.hiz.id,   value: "80+ km/s" },
        { typeId: AT.batarya.id, value: "4S LiPo (14.8V) – Dahil Değil" },
        { typeId: AT.agirlik.id, value: "3.8 kg" },
        { typeId: AT.renk.id, value: "Kırmızı" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>Traxxas Maxx Wide, monster truck deneyimini yeni bir boyuta taşıyan genişletilmiş süspansiyon paketi ile gelir.</p>" },
      ],
    },

    // ══════════════════════ YEDEK PARÇALAR ═══════════════════════════════════

    {
      name: "Dynamite Brushless Motor + ESC Kombo 6000kV 1/10 Araçlar İçin",
      slug: "dynamite-brushless-motor-esc-6000kv",
      sku: "DYNS0501",
      barcode: "0601946599595",
      brandSlug: "dynamite",
      manufacturer: "Horizon Hobby",
      originCountry: "Çin",
      shortDesc: "540 boyut 6000kV fırçasız motor + 60A ESC kombosyonu. 1/10 ölçek araçlar için mükemmel yükseltme.",
      fullDesc: `<h2>Dynamite Brushless Kombo – Fiyat / Performans Şampiyonu</h2>
<p>1/10 ölçek RC araçlarınıza hızlı ve uygun maliyetli fırçasız sistem yükseltmesi. 6000kV motor ve 60A ESC kombinasyonu, hem plaka hem arazi araçları için uygundur.</p>`,
      priceUsd: 89.99, priceTl: 2924.67,
      salePriceUsd: 74.99, salePriceTl: 2437.17,
      saleStart: "2026-03-01T00:00:00Z", saleEnd: "2026-03-31T00:00:00Z",
      vatRate: 18, vatIncluded: true,
      stockQty: 20, lowStockThreshold: 5, stockTracking: true,
      weight: 0.35, width: 10.0, height: 4.5, depth: 15.0,
      isFeatured: true, isNew: true, isBestSeller: false,
      seoTitle: "Dynamite 6000kV Brushless Motor ESC Kombo 1/10 | RC Store",
      seoDesc: "Dynamite DYNS0501 fırçasız motor ve ESC kombo. 6000kV, 60A, 2S-3S LiPo uyumlu. Uygun fiyat.",
      sortOrder: 7,
      categories: ["yedek-parcalar", "motor-esc"],
      images: [
        { url: img("dynamo-motor-esc-main"),  altText: "Dynamite Motor+ESC Kombo – Ana Görsel" },
        { url: img("dynamo-motor-esc-side"),  altText: "Dynamite Motor+ESC Kombo – Yan Görsel" },
        { url: img("dynamo-motor-esc-parts"), altText: "Dynamite Motor+ESC Kombo – Parçalar" },
      ],
      attributes: [
        { typeId: AT.motor.id,    value: "Fırçasız (Brushless)" },
        { typeId: AT.hiz.id,      value: "6000 kV" },
        { typeId: AT.batarya.id,  value: "2S–3S LiPo Uyumlu" },
        { typeId: AT.voltaj.id,   value: "7.4V – 11.1V" },
        { typeId: AT.agirlik.id,  value: "350 g (Set)" },
        { typeId: AT.uretici.id,  value: "Çin" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>Dynamite 6000kV fırçasız motor, 540 boyutunda olup çoğu 1/10 ölçek RC araçla doğrudan uyumludur. 60A ESC, 2S ve 3S LiPo bataryalarla çalışır.</p>" },
        { title: "Uyumlu Araçlar", icon: "car", sortOrder: 1, content: "<ul><li>Traxxas Slash 2WD</li><li>Traxxas Stampede</li><li>ARRMA Granite</li><li>HPI Bullet</li><li>540 boyut motor yuvası olan tüm 1/10 araçlar</li></ul>" },
      ],
    },

    {
      name: "Traxxas Power Cell 3S LiPo 11.1V 5000mAh 25C iD Konektörlü",
      slug: "traxxas-3s-lipo-5000mah",
      sku: "TRA2985-3S",
      barcode: "0020334298539",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "Traxxas iD teknolojili 3S 11.1V 5000mAh LiPo batarya. EZ-Peak şarj cihazlarıyla otomatik parametreler.",
      fullDesc: `<h2>Traxxas Power Cell 3S – Maksimum Güç, Uzun Ömür</h2>
<p>Traxxas Power Cell LiPo serisi, en yüksek kaliteli hücreleri Traxxas iD konektör teknolojisiyle birleştirir. iD sistemi sayesinde EZ-Peak şarj cihazı bataryayı otomatik olarak tanır ve ideal şarj parametrelerini seçer.</p>`,
      priceUsd: 79.99, priceTl: 2599.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 30, lowStockThreshold: 8, stockTracking: true,
      weight: 0.42, width: 13.5, height: 3.7, depth: 4.8,
      isFeatured: false, isNew: false, isBestSeller: true,
      seoTitle: "Traxxas Power Cell 3S LiPo 5000mAh iD Konektörlü | RC Store",
      seoDesc: "Traxxas 3S LiPo batarya 5000mAh. iD teknoloji, 25C deşarj. Traxxas araçlarla tam uyumlu.",
      sortOrder: 8,
      categories: ["yedek-parcalar", "batarya-sarj"],
      images: [
        { url: img("traxxas-lipo-3s-main"),  altText: "Traxxas 3S LiPo – Ana Görsel" },
        { url: img("traxxas-lipo-3s-detail"), altText: "Traxxas 3S LiPo – iD Konektör Detayı" },
      ],
      attributes: [
        { typeId: AT.kapasite.id, value: "5000 mAh" },
        { typeId: AT.voltaj.id,   value: "11.1V (3S)" },
        { typeId: AT.batarya.id,  value: "LiPo" },
        { typeId: AT.agirlik.id,  value: "420 g" },
        { typeId: AT.uzunluk.id,  value: "135 mm" },
        { typeId: AT.genislik.id, value: "48 mm" },
        { typeId: AT.yukseklik.id, value: "37 mm" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>Traxxas iD LiPo bataryalar, Traxxas EZ-Peak Plus ve ID Charger şarj cihazlarıyla otomatik tanıma desteği sunar. Bu sayede yanlış şarj parametresi seçim riski ortadan kalkar.</p><p><strong>Uyarı:</strong> LiPo bataryalar özel bakım ve depolama koşulları gerektirir. Şarj ederken gözetimsiz bırakmayınız.</p>" },
      ],
    },

    {
      name: "Traxxas 2075X High-Torque Dijital Servo 400oz-in Metal Dişli",
      slug: "traxxas-2075x-dijital-servo",
      sku: "TRA2075X",
      barcode: "0020334200755",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "400oz-in yüksek tork, dijital, metal dişli, waterproof servo. Traxxas araçlarına drop-in uyum.",
      fullDesc: `<h2>Traxxas 2075X – Yüksek Tork, Tam Hassasiyet</h2>
<p>Traxxas 2075X, sahada kanıtlanmış 400oz-in tork kapasitesi ile en zorlu direksiyon koşullarını karşılamak üzere tasarlanmıştır. Metal dişli mekanizması ve waterproof tasarımı ile uzun ömürlü kullanım sağlar.</p>`,
      priceUsd: 49.99, priceTl: 1624.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 25, lowStockThreshold: 6, stockTracking: true,
      weight: 0.09, width: 4.0, height: 3.6, depth: 2.0,
      isFeatured: false, isNew: false, isBestSeller: false,
      seoTitle: "Traxxas 2075X Dijital Servo 400oz Metal Dişli Waterproof | RC Store",
      seoDesc: "Traxxas 2075X dijital servo. 400oz-in tork, metal dişli, waterproof. Traxxas araçlarla uyumlu.",
      sortOrder: 9,
      categories: ["yedek-parcalar", "servo-motorlar"],
      images: [
        { url: img("servo-2075x-main"),   altText: "Traxxas 2075X Servo – Ana Görsel" },
        { url: img("servo-2075x-detail"), altText: "Traxxas 2075X Servo – Dişli Detayı" },
      ],
      attributes: [
        { typeId: AT.tork.id,    value: "400 oz-in (28.8 kg/cm)" },
        { typeId: AT.hiz.id,     value: "0.16 sn / 60°" },
        { typeId: AT.voltaj.id,  value: "4.8V – 6.0V" },
        { typeId: AT.agirlik.id, value: "91 g" },
        { typeId: AT.suges.id,   value: "Evet – Waterproof" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>Traxxas 2075X, Traxxas Revo, T-Maxx, E-Maxx ve diğer 1/10 modellerle doğrudan uyumlu olup drop-in yükseltme imkânı sunar.</p>" },
        { title: "Uyumlu Modeller", icon: "car", sortOrder: 1, content: "<ul><li>Traxxas Slash 4x4</li><li>Traxxas Stampede 4x4</li><li>Traxxas Rustler 4x4</li><li>Traxxas Revo / E-Revo</li></ul>" },
      ],
    },

    {
      name: "Pro-Line Hoosier SC Drag Spec 2.2\" M3 Lastikler (4 Adet)",
      slug: "pro-line-hoosier-drag-lastik",
      sku: "PRO10158-17",
      barcode: "0601946085173",
      brandSlug: "pro-line",
      manufacturer: "Pro-Line Racing",
      originCountry: "ABD",
      shortDesc: "Hoosier lisanslı 2.2\"/3.0\" SC drag lastikleri. M3 ultra-yumuşak bileşen, 4 adet.",
      fullDesc: `<h2>Pro-Line Hoosier SC Drag Spec – Pistlerin Kralı</h2>
<p>Pro-Line, gerçek boyutlu Hoosier drag yarış lastiklerinin minyatür biçimini mükemmel şekilde yeniden oluşturmuştur. M3 ultra-yumuşak bileşen sayesinde düz pistte maksimum tutunma sağlar.</p>`,
      priceUsd: 34.99, priceTl: 1137.17,
      vatRate: 18, vatIncluded: true,
      stockQty: 40, lowStockThreshold: 10, stockTracking: true,
      weight: 0.18, width: 12.0, height: 8.0, depth: 18.0,
      isFeatured: false, isNew: true, isBestSeller: false,
      seoTitle: "Pro-Line Hoosier SC Drag 2.2 M3 Lastik 4lü Set | RC Store",
      seoDesc: "Pro-Line Hoosier drag lastik, M3 bileşen, 2.2 inç, 4 adet. Drag pisti için ideal.",
      sortOrder: 10,
      categories: ["yedek-parcalar", "tekerlekler-jantlar"],
      images: [
        { url: img("proline-hoosier-main"),  altText: "Pro-Line Hoosier Drag Lastik – Ana Görsel" },
        { url: img("proline-hoosier-tread"), altText: "Pro-Line Hoosier Drag Lastik – Tırtıl Detayı" },
      ],
      attributes: [
        { typeId: AT.olcek.id, value: "2.2\" / 3.0\"" },
        { typeId: AT.agirlik.id, value: "180 g (4 Adet)" },
        { typeId: AT.renk.id, value: "Siyah" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>Hoosier SC Drag Spec lastikler, 1/10 short course trucklar için özel olarak tasarlanmıştır. M3 bileşen, düşük sıcaklıklarda bile maksimum tutunma sağlar.</p>" },
      ],
    },

    {
      name: "Traxxas GTR Alüminyum Amortisör Seti – Mavi (4 Adet)",
      slug: "traxxas-gtr-aluminyum-amortisör-mavi",
      sku: "TRA5460A",
      barcode: "0020334546040",
      brandSlug: "traxxas",
      manufacturer: "Traxxas LP",
      originCountry: "ABD",
      shortDesc: "Anodize mavi alüminyum GTR amortisör kasaları. Daha iyi ısı dağılımı, artırılmış dayanıklılık. 4 adet.",
      fullDesc: `<h2>Traxxas GTR Alüminyum – Premium Süspansiyon Yükseltmesi</h2>
<p>Traxxas'ın alüminyum GTR amortisörleri, plastik standart amortisörlerin yerini alacak premium bir yükseltmedir. Anodize mavi kaplamalar görsel çekiciliği artırırken alüminyum yapı üstün ısı yönetimi sağlar.</p>`,
      priceUsd: 59.99, priceTl: 1949.67,
      vatRate: 18, vatIncluded: true,
      stockQty: 18, lowStockThreshold: 4, stockTracking: true,
      weight: 0.22, width: 8.0, height: 5.0, depth: 20.0,
      isFeatured: true, isNew: false, isBestSeller: false,
      seoTitle: "Traxxas GTR Alüminyum Amortisör Seti Mavi 4lü | RC Store",
      seoDesc: "Traxxas GTR alüminyum amortisör seti, anodize mavi, 4 adet. 1/10 araçlarla uyumlu.",
      sortOrder: 11,
      categories: ["yedek-parcalar", "suspansiyon"],
      images: [
        { url: img("traxxas-gtr-shock-main"),    altText: "Traxxas GTR Amortisör Seti – Ana Görsel" },
        { url: img("traxxas-gtr-shock-detail"),  altText: "Traxxas GTR Amortisör – Alüminyum Detay" },
        { url: img("traxxas-gtr-shock-mounted"), altText: "Traxxas GTR Amortisör – Araç Üstünde" },
      ],
      attributes: [
        { typeId: AT.renk.id,    value: "Anodize Mavi" },
        { typeId: AT.agirlik.id, value: "220 g (4 Adet)" },
        { typeId: AT.uretici.id, value: "ABD" },
      ],
      tabs: [
        { title: "Ürün Açıklaması", icon: "file-text", sortOrder: 0, content: "<p>Traxxas alüminyum GTR amortisörleri, E-Revo, Rustler 4x4, Slash 4x4 ve Stampede 4x4 ile uyumludur. Her set 4 adet tam amortisör içerir.</p>" },
        { title: "Uyumlu Modeller", icon: "car", sortOrder: 1, content: "<ul><li>Traxxas E-Revo VXL</li><li>Traxxas Rustler 4x4</li><li>Traxxas Slash 4x4</li><li>Traxxas Stampede 4x4</li></ul>" },
      ],
    },
  ]

  // ── Ürünleri oluştur ────────────────────────────────────────────────────
  let created = 0
  for (const p of PRODUCTS) {
    const catIds = p.categories.map((k) => catMap[k]).filter(Boolean)
    const brandId = BM[p.brandSlug] ?? null

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        barcode: p.barcode ?? null,
        brandId,
        manufacturer: p.manufacturer,
        originCountry: p.originCountry,
        shortDesc: p.shortDesc,
        fullDesc: p.fullDesc,
        priceUsd:    new Prisma.Decimal(p.priceUsd),
        priceTl:     new Prisma.Decimal(p.priceTl),
        salePriceUsd: p.salePriceUsd != null ? new Prisma.Decimal(p.salePriceUsd) : null,
        salePriceTl:  p.salePriceTl  != null ? new Prisma.Decimal(p.salePriceTl)  : null,
        saleStart: p.saleStart ? new Date(p.saleStart) : null,
        saleEnd:   p.saleEnd   ? new Date(p.saleEnd)   : null,
        vatRate: p.vatRate,
        vatIncluded: p.vatIncluded,
        stockTracking: p.stockTracking,
        stockQty: p.stockQty,
        lowStockThreshold: p.lowStockThreshold,
        weight: p.weight != null ? new Prisma.Decimal(p.weight) : null,
        width:  p.width  != null ? new Prisma.Decimal(p.width)  : null,
        height: p.height != null ? new Prisma.Decimal(p.height) : null,
        depth:  p.depth  != null ? new Prisma.Decimal(p.depth)  : null,
        isFeatured:   p.isFeatured   ?? false,
        isNew:        p.isNew        ?? false,
        isBestSeller: p.isBestSeller ?? false,
        seoTitle: p.seoTitle,
        seoDesc:  p.seoDesc,
        status:     ProductStatus.PUBLISHED,
        visibility: ProductVisibility.PUBLIC,
        sortOrder: p.sortOrder,
        categories: {
          create: catIds.map((categoryId) => ({ categoryId })),
        },
        images: {
          create: p.images.map((img, idx) => ({
            url: img.url,
            altText: img.altText,
            title: img.title ?? null,
            sortOrder: idx,
            isFeatured: idx === 0,
          })),
        },
        attributes: {
          create: p.attributes.map((a) => ({
            attributeTypeId: a.typeId,
            value: a.value,
            showInFilter: true,
            useForVariation: false,
          })),
        },
        tabs: {
          create: p.tabs.map((t) => ({
            title: t.title,
            content: t.content,
            icon: t.icon ?? null,
            sortOrder: t.sortOrder,
            status: true,
          })),
        },
      },
    })

    console.log(`  ✓ ${product.name}`)
    created++
  }

  console.log(`\n${"─".repeat(50)}`)
  console.log(`Demo seed tamamlandı!`)
  console.log(`  Markalar:    ${brandDefs.length}`)
  console.log(`  Kategoriler: 28 (5 ana + 23 alt)`)
  console.log(`  Ürünler:     ${created}`)
  console.log(`${"─".repeat(50)}`)
  console.log(`\nTest URL'leri:`)
  console.log(`  Mağaza Ana:  http://localhost:3000`)
  console.log(`  Ürün Listesi: http://localhost:3000/urunler`)
  for (const p of PRODUCTS.slice(0, 3)) {
    console.log(`  Ürün:        http://localhost:3000/urun/${p.slug}`)
  }
  console.log(`  Admin Ürünler: http://localhost:3000/admin/urunler`)
  console.log(`  Admin Kateg.:  http://localhost:3000/admin/kategoriler`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
