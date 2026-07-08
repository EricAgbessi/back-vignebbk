import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@vignebbk.com";
  const password = "adminpassword123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.utilisateurs.upsert({
    where: { email },
    update: {
      mot_de_passe_hash: hashedPassword,
      r_le: "administrateur",
    },
    create: {
      email,
      mot_de_passe_hash: hashedPassword,
      nom: "Admin",
      pr_nom: "Vignebbk",
      r_le: "administrateur",
    },
  });

  console.log("Admin user created/updated:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
