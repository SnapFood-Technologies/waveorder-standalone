import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create SuperAdmin user
  const hashedPassword = await hash('GAdmin@2025x!WaveGG', 12)
  
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin@waveorder.app",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      emailVerified: new Date()
    }
  })

  console.log('SuperAdmin user created:', {
    id: superAdmin.id,
    email: superAdmin.email,
    role: superAdmin.role
  })

  console.log('\nLogin credentials:')
  console.log('Email: superadmin@waveorder.app')
  console.log('Password: GAdmin@2025x!WaveGG')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })