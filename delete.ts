import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
  await prisma.inbodyRecord.deleteMany({
    where: {
      userId: 'user-a',
      date: new Date('2026-06-22T00:00:00.000Z')
    }
  });
  console.log("Deleted user-a 2026-06-22");
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
