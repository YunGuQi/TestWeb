import { PrismaClient } from '@prisma/client'
import { questions, results } from '../lib/data'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 清除旧数据
  await prisma.option.deleteMany()
  await prisma.question.deleteMany()
  await prisma.resultConfig.deleteMany()
  await prisma.globalConfig.deleteMany()

  // 1. 初始化 GlobalConfig
  await prisma.globalConfig.create({
    data: {
      id: 1,
      baseCount: 1542,
    },
  })
  console.log('GlobalConfig seeded.')

  // 2. 初始化 ResultConfig
  for (const res of results) {
    await prisma.resultConfig.create({
      data: {
        title: res.title,
        desc: res.description,
        quote: res.quote,
        imageUrl: '',
        condition: res.key,
      },
    })
  }
  console.log('ResultConfigs seeded.')

  // 3. 初始化 Questions & Options
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const createdQuestion = await prisma.question.create({
      data: {
        order: i + 1,
        text: q.text,
      },
    })

    for (const opt of q.options) {
      await prisma.option.create({
        data: {
          text: opt.text,
          scores: JSON.stringify({
            sen: opt.senScore || 0,
            rum: opt.rumScore || 0,
            pls: opt.plsScore || 0,
            bnd: opt.bndScore || 0,
            billName: opt.billName
          }),
          questionId: createdQuestion.id,
        },
      })
    }
  }
  console.log('Questions and Options seeded.')
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
