import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcrypt'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})

const seedTasks = [
  {
    publicId: 'PW-2415-01',
    statusTone: 'green',
    title: 'House Cleaning Needed',
    category: 'Cleaning',
    status: 'Open',
    location: 'Lusaka, Woodlands',
    date: 'Sat, 15 Feb',
    time: '09:00 - 12:00',
    offerPrice: 'K 350',
    unitDef: 'per task',
    estEarning: 'Est. K350-K400',
    shortDesc: 'Deep cleaning 3-bed house, all rooms and bathrooms.',
    employerName: 'Mutinta K.',
    employerId: 'ZM87654',
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  },
  {
    publicId: 'PW-2415-07',
    statusTone: 'orange',
    title: 'Garden Maintenance Weekly',
    category: 'Gardening',
    status: 'Open',
    location: 'Kitwe, Nkana',
    date: 'Every Mon, Wed',
    time: '07:00 - 09:00',
    offerPrice: 'K 200',
    unitDef: 'per week',
    estEarning: 'Est. K200/week',
    shortDesc: 'Mowing, weeding, trimming - ongoing monthly.',
    employerName: 'Brian C.',
    employerId: 'ZM45321',
    imageUrl:
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  },
  {
    publicId: 'PW-2412-22',
    statusTone: 'green',
    title: 'Moving Assistance Needed',
    category: 'Moving',
    status: 'Open',
    location: 'Ndola, Masala',
    date: 'Sat, 22 Feb',
    time: '08:00 - 11:00',
    offerPrice: 'K 450',
    unitDef: 'per task',
    estEarning: 'Est. K450-K500',
    shortDesc: 'Two people needed to move furniture from flat to truck.',
    employerName: 'Chileshe M.',
    employerId: 'ZM99812',
    imageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  },
  {
    publicId: 'PW-2409-88',
    statusTone: 'green',
    title: 'Math Tutoring Grade 9',
    category: 'Tutoring',
    status: 'Open',
    location: 'Livingstone, Maramba',
    date: 'Tue, Thu',
    time: '16:00 - 18:00',
    offerPrice: 'K 120',
    unitDef: 'per hour',
    estEarning: 'Est. K240/week',
    shortDesc: 'Grade 9 exam prep, 2 hours per session.',
    employerName: 'Namukolo P.',
    employerId: 'ZM33421',
    imageUrl:
      'https://images.unsplash.com/photo-1576675466969-38eeae4b41f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  },
  {
    publicId: 'PW-2417-03',
    statusTone: 'green',
    title: 'Basic Plumbing Fix',
    category: 'Repairs',
    status: 'Open',
    location: 'Lusaka, Kabulonga',
    date: 'Tomorrow',
    time: '14:00 - 16:00',
    offerPrice: 'K 250',
    unitDef: 'per task',
    estEarning: 'Est. K250',
    shortDesc: 'Leaking kitchen tap replacement.',
    employerName: 'Thandiwe B.',
    employerId: 'ZM75643',
    imageUrl:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  },
  {
    publicId: 'PW-2418-11',
    statusTone: 'green',
    title: 'Package Delivery Service',
    category: 'Delivery',
    status: 'Open',
    location: 'Lusaka, CBD',
    date: 'Mon, 17 Feb',
    time: '09:00 - 13:00',
    offerPrice: 'K 300',
    unitDef: 'per route',
    estEarning: 'Est. K300',
    shortDesc: "Five deliveries across Lusaka; driver's license required.",
    employerName: 'John B.',
    employerId: 'ZM11209',
    imageUrl:
      'https://images.unsplash.com/photo-1578768070127-0eacaa6b4c5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  },
]

const parseTimeRange = (value?: string | null) => {
  if (!value || !value.includes('-')) return { startTime: null, endTime: null }
  const [start, end] = value.split('-').map((s) => s.trim())
  return { startTime: start || null, endTime: end || null }
}

async function main() {
  // Check if superuser already exists
  const existingSuperUser = await prisma.user.findFirst({
    where: {  
      email: 'admin@admin.com',
      role: 'SUPERUSER' 
    }
  })

  if (!existingSuperUser) {
    // Create default superuser
    const hashedPassword = await hash('admin123', 10)
    
    await prisma.user.create({
      data: {
        username: 'Admin',
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'SUPERUSER',
        isEmailVerified: true,
        phoneNumber: '+1234567890',
        nrc_card_id: 'NRC-ADMIN',
      }
    })

    console.log('Default superuser created successfully')
  } else {
    console.log('Superuser already exists, skipping creation')
  }

  const publicIds = seedTasks.map((task) => task.publicId || `seed-${task.title}`)

  await prisma.task.deleteMany({
    where: {
      publicId: { in: publicIds },
    },
  })

  await prisma.task.deleteMany({
    where: { publicId: null },
  })

  await prisma.task.createMany({
    data: seedTasks.map((task, index) => {
      const { startTime, endTime } = parseTimeRange(task.time)
      return {
        ...task,
        publicId: task.publicId || `seed-${index + 1}`,
        employerUserId: `seed-user-${index + 1}`,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      }
    }),
  })
  console.log(`Seeded ${seedTasks.length} tasks`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
