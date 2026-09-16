import { prisma } from "../src/lib/prisma";
import { hash } from "@node-rs/argon2";
import dotenv from "dotenv";

dotenv.config();

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .trim();
}

async function main() {
  console.log("🌱 Starting TruyenKomi Database Seeding...");

  // 1. Create Default Admin & Demo Users
  console.log("👤 Creating default admin user (admin@truyenkomi.local)...");
  const adminPasswordHash = await hash("Admin@123456");
  const userPasswordHash = await hash("User@123456");

  const admin = await prisma.user.upsert({
    where: { email: "admin@truyenkomi.local" },
    create: {
      username: "admin",
      email: "admin@truyenkomi.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      level: 99,
      exp: 999999,
      dailyStreak: 30,
    },
    update: {
      role: "ADMIN",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "reader@truyenkomi.local" },
    create: {
      username: "reader_demo",
      email: "reader@truyenkomi.local",
      passwordHash: userPasswordHash,
      role: "USER",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      level: 12,
      exp: 3450,
      dailyStreak: 7,
    },
    update: {},
  });

  // 2. Create Standard Categories
  console.log("📚 Creating standard comic categories...");
  const categoryNames = [
    "Hành Động",
    "Phiêu Lưu",
    "Hài Hước",
    "Giả Tưởng",
    "Chuyển Sinh",
    "Lãng Mạn",
    "Khoa Học Viễn Tưởng",
    "Shounen",
    "Đời Thường",
    "Bí Ẩn",
    "Siêu Nhiên",
    "Võ Thuật",
    "Học Đường",
    "Kinh Dị",
  ];

  const categories = await Promise.all(
    categoryNames.map((name) => {
      const slug = toSlug(name);
      return prisma.category.upsert({
        where: { slug },
        create: { name, slug, description: `Truyện thể loại ${name} đặc sắc` },
        update: { name },
      });
    })
  );

  const catMap = new Map(categories.map((c) => [c.name, c.id]));

  // 3. Create Sample Comics with Chapters and Pages
  console.log("📖 Seeding sample comics and chapters...");
  const sampleComicsData = [
    {
      title: "Đảo Hải Tạc (One Piece)",
      otherNames: "Vua Hải Tặc, One Piece",
      author: "Eiichiro Oda",
      status: "ONGOING" as const,
      coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
      description:
        "Cuộc hành trình vĩ đại của Monkey D. Luffy cùng băng Mũ Rơm trên con đường chinh phục Đại Hải Trình để trở thành Vua Hải Tặc tiếp theo và khám phá kho báu huyền thoại One Piece do Gol D. Roger để lại.",
      views: BigInt(1520000),
      weeklyViews: BigInt(45000),
      monthlyViews: BigInt(180000),
      ratingAvg: 4.9,
      ratingCount: 1240,
      categories: ["Hành Động", "Phiêu Lưu", "Hài Hước", "Shounen", "Giả Tưởng"],
      chapters: [
        {
          chapterNumber: 1,
          title: "Romance Dawn - Bình minh của cuộc phiêu lưu",
          pages: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
          ],
        },
        {
          chapterNumber: 2,
          title: "Cậu bé Luffy Mũ Rơm",
          pages: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
          ],
        },
        {
          chapterNumber: 3,
          title: "Thợ săn hải tặc Zoro xuất hiện",
          pages: [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
          ],
        },
      ],
    },
    {
      title: "Thanh Gươm Diệt Quỷ (Demon Slayer)",
      otherNames: "Kimetsu no Yaiba",
      author: "Koyoharu Gotouge",
      status: "COMPLETED" as const,
      coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
      description:
        "Thời kỳ Taisho ở Nhật Bản. Tanjiro, một cậu bé tốt bụng sống bằng nghề bán than củi, phát hiện ra gia đình mình bị quỷ tàn sát. Em gái cậu Nezuko biến thành quỷ nhưng vẫn giữ lại nhân tính. Cậu bắt đầu gia nhập Sát Quỷ Đội.",
      views: BigInt(980000),
      weeklyViews: BigInt(29000),
      monthlyViews: BigInt(120000),
      ratingAvg: 4.8,
      ratingCount: 890,
      categories: ["Hành Động", "Siêu Nhiên", "Shounen", "Giả Tưởng"],
      chapters: [
        {
          chapterNumber: 1,
          title: "Tàn Khốc",
          pages: [
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
          ],
        },
        {
          chapterNumber: 2,
          title: "Người Lạ Mặt",
          pages: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
          ],
        },
      ],
    },
    {
      title: "Chú Thuật Hồi Chiến (Jujutsu Kaisen)",
      otherNames: "Chiến Binh Chú Thuật",
      author: "Gege Akutami",
      status: "ONGOING" as const,
      coverImage: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
      description:
        "Itadori Yuji nuốt ngón tay của Ryomen Sukuna - Vua của những lời nguyền, từ đó bước chân vào thế giới của các Chú thuật sư để bảo vệ con người khỏi những nguyền hồn tàn ác.",
      views: BigInt(850000),
      weeklyViews: BigInt(38000),
      monthlyViews: BigInt(150000),
      ratingAvg: 4.7,
      ratingCount: 760,
      categories: ["Hành Động", "Siêu Nhiên", "Bí Ẩn", "Shounen"],
      chapters: [
        {
          chapterNumber: 1,
          title: "Sukuna Ryomen",
          pages: [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
          ],
        },
      ],
    },
    {
      title: "Ta Là Tà Đế (I'm an Evil God)",
      otherNames: "Wo Wei Xie Di",
      author: "Thí Thần Giả",
      status: "ONGOING" as const,
      coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
      description:
        "Tạ Diệm xuyên không vào thân phận của một đệ tử ma môn có thể chất cực âm, kích hoạt Hệ Thống Thu Thập Nguồn Gốc để du hành qua vô số thế giới tu chân võ đạo khác nhau.",
      views: BigInt(620000),
      weeklyViews: BigInt(22000),
      monthlyViews: BigInt(95000),
      ratingAvg: 4.6,
      ratingCount: 450,
      categories: ["Chuyển Sinh", "Giả Tưởng", "Võ Thuật", "Hành Động"],
      chapters: [
        {
          chapterNumber: 1,
          title: "Xuyên Không Vào Ma Môn",
          pages: [
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
          ],
        },
      ],
    },
    {
      title: "Thám Tử Lừng Danh Conan",
      otherNames: "Detective Conan, Meitantei Conan",
      author: "Gosho Aoyama",
      status: "ONGOING" as const,
      coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      description:
        "Kudo Shinichi, một thám tử học sinh trung học tài năng, bị biến nhỏ thành cậu bé 6 tuổi Edogawa Conan sau khi bị Tổ Chức Áo Đen ép uống thuốc độc APTX 4869.",
      views: BigInt(1200000),
      weeklyViews: BigInt(31000),
      monthlyViews: BigInt(135000),
      ratingAvg: 4.9,
      ratingCount: 1100,
      categories: ["Bí Ẩn", "Học Đường", "Shounen"],
      chapters: [
        {
          chapterNumber: 1,
          title: "Sherlock Holmes Thời Hiện Đại",
          pages: [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
          ],
        },
      ],
    },
  ];

  for (const c of sampleComicsData) {
    const slug = toSlug(c.title);
    const titleUnaccent = normalizeTitle(c.title);

    const categoryIds = c.categories
      .map((name) => catMap.get(name))
      .filter((id): id is string => Boolean(id));

    const comic = await prisma.comic.upsert({
      where: { slug },
      create: {
        title: c.title,
        titleUnaccent,
        slug,
        otherNames: c.otherNames,
        author: c.author,
        status: c.status,
        coverImage: c.coverImage,
        description: c.description,
        views: c.views,
        weeklyViews: c.weeklyViews,
        monthlyViews: c.monthlyViews,
        ratingAvg: c.ratingAvg,
        ratingCount: c.ratingCount,
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      update: {
        title: c.title,
        titleUnaccent,
        otherNames: c.otherNames,
        author: c.author,
        description: c.description,
        coverImage: c.coverImage,
      },
    });

    for (const ch of c.chapters) {
      const chapter = await prisma.chapter.upsert({
        where: {
          comicId_chapterNumber: {
            comicId: comic.id,
            chapterNumber: ch.chapterNumber,
          },
        },
        create: {
          comicId: comic.id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          views: BigInt(Math.floor(Math.random() * 5000) + 500),
          pages: {
            create: ch.pages.map((imageUrl, pageIndex) => ({
              pageIndex,
              imageUrl,
            })),
          },
        },
        update: {
          title: ch.title,
        },
      });

      // Seed sample comment
      await prisma.comment.create({
        data: {
          comicId: comic.id,
          chapterId: chapter.id,
          userId: demoUser.id,
          content: `Truyện hay quá! Chương ${ch.chapterNumber} nét căng luôn.`,
          likes: 5,
        },
      }).catch(() => {});
    }

    // Follow and rate demo
    await prisma.follow.upsert({
      where: { userId_comicId: { userId: demoUser.id, comicId: comic.id } },
      create: { userId: demoUser.id, comicId: comic.id },
      update: {},
    });

    await prisma.comicRating.upsert({
      where: { userId_comicId: { userId: demoUser.id, comicId: comic.id } },
      create: { userId: demoUser.id, comicId: comic.id, score: 5 },
      update: { score: 5 },
    });
  }

  console.log("✅ TruyenKomi Seeding Completed Successfully!");
  console.log("-----------------------------------------------");
  console.log("🔑 Default Admin Account:");
  console.log("   Email:    admin@truyenkomi.local");
  console.log("   Password: Admin@123456");
  console.log("🔑 Demo Reader Account:");
  console.log("   Email:    reader@truyenkomi.local");
  console.log("   Password: User@123456");
  console.log("-----------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
