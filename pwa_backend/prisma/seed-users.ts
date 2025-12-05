import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 1 Admin + 19 Users = 20 total
const users = [
  // Admin user
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@gmail.com',
    password: 'Admin@123',
    role: 'ADMIN' as Role,
    isActive: true,
  },

  // Regular users
  {
    firstName: 'John',
    lastName: 'Wick',
    email: 'john.wick@gmail.com',
    password: 'JohnWick@123',
    role: 'USER' as Role,
    isActive: true,
  },
  {
    firstName: 'Goku',
    lastName: 'Son',
    email: 'goku@gmail.com',
    password: 'Goku@123',
    role: 'USER' as Role,
    isActive: true,
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@gmail.com',
    password: 'JaneDoe@123',
    role: 'USER' as Role,
    isActive: true,
  },
  {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.smith@gmail.com',
    password: 'BobSmith@123',
    role: 'USER' as Role,
    isActive: true,
  },
  {
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@gmail.com',
    password: 'Alice@123',
    role: 'USER' as Role,
    isActive: false,
  },

  // More users (add until total = 20)
  { firstName: 'Tony', lastName: 'Stark', email: 'tony@gmail.com', password: 'Tony@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Steve', lastName: 'Rogers', email: 'steve@gmail.com', password: 'Steve@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Thor', lastName: 'Odinson', email: 'thor@gmail.com', password: 'Thor@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Natasha', lastName: 'Romanoff', email: 'natasha@gmail.com', password: 'Natasha@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Bruce', lastName: 'Banner', email: 'bruce@gmail.com', password: 'Bruce@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Clint', lastName: 'Barton', email: 'clint@gmail.com', password: 'Clint@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Peter', lastName: 'Parker', email: 'peter@gmail.com', password: 'Peter@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Wanda', lastName: 'Maximoff', email: 'wanda@gmail.com', password: 'Wanda@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Vision', lastName: 'Synth', email: 'vision@gmail.com', password: 'Vision@123', role: 'USER' as Role, isActive: false },
  { firstName: 'Scott', lastName: 'Lang', email: 'scott@gmail.com', password: 'Scott@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Hope', lastName: 'VanDyne', email: 'hope@gmail.com', password: 'Hope@123', role: 'USER' as Role, isActive: true },
  { firstName: 'TChalla', lastName: 'King', email: 'tchalla@gmail.com', password: 'TChalla@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Shuri', lastName: 'Princess', email: 'shuri@gmail.com', password: 'Shuri@123', role: 'USER' as Role, isActive: true },
  { firstName: 'Bucky', lastName: 'Barnes', email: 'bucky@gmail.com', password: 'Bucky@123', role: 'USER' as Role, isActive: true },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });

    if (exists) {
      console.log(`⚠️ Skipping existing user: ${u.email}`);
      continue;
    }

    const hashed = await bcrypt.hash(u.password, 10);

    await prisma.user.create({
      data: { 
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email.toLowerCase(),
        password: hashed,
        role: u.role,
        isActive: u.isActive,
      },
    });

    console.log(`✓ Created: ${u.email} (${u.role})`);
  }

  console.log('🎉 Done seeding 20 users!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
