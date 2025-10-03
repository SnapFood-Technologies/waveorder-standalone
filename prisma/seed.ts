import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create SuperAdmin user
  const hashedPassword = await hash('********', 12)
  
  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin@waveorder.app",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      emailVerified: new Date()
    }
  })

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })