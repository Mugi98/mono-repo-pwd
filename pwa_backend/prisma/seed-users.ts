import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

const prisma = new PrismaClient();


const users = [
    {
        firstName: 'John', 
        lastName: 'Wick', 
        email: 'john.wick@gmail.com', 
        password: 'JohnWick@123',
        role: 'USER' as Role,
        isActive: true
    },
    {
        firstName: 'Goku', 
        lastName: 'Wick', 
        email: 'Goku.wick@gmail.com', 
        password: 'GokuWick@123',
        role: 'USER' as Role,
        isActive: true
    },
    {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@gmail.com',
        password: 'JaneDoe@123',
        role: 'USER' as Role,
        isActive: true
    },
    {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@gmail.com',
        password: 'BobSmith@123',
        role: 'USER' as Role,
        isActive: true
    },
    {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@gmail.com',
        password: 'Alice@123',
        role: 'USER' as Role,
        isActive: false
    }
];

async function main() {
    console.log(' Seeding users...');
    for (const userData of users) {
        try {
            // Check if user already exists
            const existingUser  = await prisma.user.findUnique({
                where: { email: userData.email }
            });

            if (existingUser) {
                console.log(`User ${userData.email} already exists, skipping...`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    ...userData,
                    password: hashedPassword
                }
            });

            console.log(`Created user: ${user.email} (${user.role})`);
        } catch (error) {
            console.error(`Error creating user ${userData.email}:`, error);
        }
    }

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });