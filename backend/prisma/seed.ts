import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Móveis", type: "DONATION", icon: "🛋️" },
  { name: "Eletrodomésticos", type: "DONATION", icon: "🔌" },
  { name: "Vestuário", type: "DONATION", icon: "👕" },
  { name: "Brinquedos", type: "DONATION", icon: "🧸" },
  { name: "Livros e Mídia", type: "DONATION", icon: "📚" },
  { name: "Alimentos e Cestas", type: "DONATION", icon: "🍎" },
  { name: "Construção e Materiais", type: "DONATION", icon: "🧱" },
  { name: "Lixo Eletrônico", type: "ECOPOINT", icon: "♻️" },
  { name: "Pilhas e Baterias", type: "ECOPOINT", icon: "🔋" },
  { name: "Óleo de Cozinha", type: "ECOPOINT", icon: "🛢️" },
  { name: "Lâmpadas", type: "ECOPOINT", icon: "💡" },
] as const;

async function main() {
  console.log("🌱 Seeding categorias...");

  for (const c of categories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: c.name,
          type: c.type,
        },
      },
      update: { icon: c.icon },
      create: {
        name: c.name,
        type: c.type,
        icon: c.icon,
      },
    });
  }

  const total = await prisma.category.count();
  console.log(`✅ Seed concluído: ${total} categorias cadastradas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });