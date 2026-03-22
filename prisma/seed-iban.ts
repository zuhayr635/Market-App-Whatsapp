import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const ibans = [
    { bankName: "Ziraat Bankası", iban: "TR33 0001 0017 4532 8756 1000 01", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "1745", currency: "TRY", sortOrder: 1, status: true },
    { bankName: "İş Bankası", iban: "TR76 0006 4000 0011 2345 6789 01", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "6400", currency: "TRY", sortOrder: 2, status: true },
    { bankName: "Garanti BBVA", iban: "TR16 0006 2000 2310 0006 2992 26", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "2310", currency: "TRY", sortOrder: 3, status: true },
    { bankName: "Akbank", iban: "TR27 0004 6000 8688 6000 2403 79", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "8688", currency: "TRY", sortOrder: 4, status: true },
    { bankName: "Yapı Kredi", iban: "TR44 0006 7010 0000 0097 5318 23", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "0100", currency: "TRY", sortOrder: 5, status: true },
    { bankName: "Halkbank", iban: "TR53 0001 2009 4520 0013 0000 01", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "9452", currency: "TRY", sortOrder: 6, status: true },
    { bankName: "Vakıfbank", iban: "TR68 0001 5001 5800 7302 4438 30", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "1580", currency: "TRY", sortOrder: 7, status: true },
    { bankName: "Denizbank", iban: "TR88 0013 4000 0183 7534 2100 01", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "4000", currency: "TRY", sortOrder: 8, status: true },
    { bankName: "QNB Finansbank", iban: "TR41 0011 1000 0000 0089 7100 29", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "1000", currency: "TRY", sortOrder: 9, status: true },
    { bankName: "TEB (Türk Ekonomi Bankası)", iban: "TR55 0003 2000 0000 0027 8945 01", accountHolder: "Cihan Ekspres Tic. Ltd. Şti.", branchCode: "2000", currency: "TRY", sortOrder: 10, status: true },
  ];

  const result = await prisma.ibanInfo.createMany({ data: ibans });
  console.log(`${result.count} IBAN eklendi.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
