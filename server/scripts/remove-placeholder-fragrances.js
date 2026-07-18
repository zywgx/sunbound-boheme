import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.product.deleteMany({
    where: {
      slug: {
        in: ['midnight-oud', 'amber-dunes'],
      },
    },
  })

  console.log(JSON.stringify(result))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
