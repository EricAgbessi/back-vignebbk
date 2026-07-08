import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'agbessi558@gmail.com';
  const password = '123456789';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Updating password for ${email}...`);

  // Check if user exists first to decide on update or create (upsert handles this but good to be explicit in logs)
  const user = await prisma.utilisateurs.upsert({
    where: { email },
    update: {
      mot_de_passe_hash: hashedPassword,
      r_le: 'administrateur',
    },
    create: {
      email,
      mot_de_passe_hash: hashedPassword,
      nom: 'Admin',
      pr_nom: 'VigneBBK',
      r_le: 'administrateur',
    },
  });

  console.log(`User ${user.email} updated successfully with new password.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
