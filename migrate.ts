import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
  const records = await prisma.inbodyRecord.findMany();
  console.log(JSON.stringify(records, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
