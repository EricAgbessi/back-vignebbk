import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@vignebbk.com";
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!password) {
    console.error(
      "ADMIN_SEED_PASSWORD is required to seed the admin account. " +
        "Set it in the environment before running this seed."
    );
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_ADMIN_SEED) {
    console.error(
      "Refusing to run admin seed in production without ALLOW_ADMIN_SEED=1."
    );
    process.exit(1);
  }

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
