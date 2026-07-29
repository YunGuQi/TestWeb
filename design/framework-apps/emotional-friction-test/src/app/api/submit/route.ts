import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { optionIds } = body

    if (!optionIds || !Array.isArray(optionIds)) {
      return NextResponse.json({ error: 'Invalid options' }, { status: 400 })
    }

    // Read config locally
    const configPath = path.join(process.cwd(), 'src/config/tests/emotional-friction.json')
    const fileContent = await fs.readFile(configPath, 'utf8')
    const config = JSON.parse(fileContent)

    // Flatten all options from config.questions
    const allOptions: any[] = []
    config.questions?.forEach((q: any) => {
      if (q.options) allOptions.push(...q.options)
    })

    // Find selected options
    const options = allOptions.filter(opt => optionIds.includes(opt.id))

    let senTotal = 0
    let rumTotal = 0
    let plsTotal = 0
    let bndTotal = 0

    // To construct the bills, we collect the billNames and calculate amount from scores
    const bills = options
      .filter(opt => opt.billName)
      .map(opt => ({
        name: opt.billName,
        amount: Math.max(Number(opt.senScore)||0, Number(opt.rumScore)||0, Number(opt.plsScore)||0, Number(opt.bndScore)||0) || 5
      }))

    for (const opt of options) {
      senTotal += Number(opt.senScore) || 0
      rumTotal += Number(opt.rumScore) || 0
      plsTotal += Number(opt.plsScore) || 0
      bndTotal += Number(opt.bndScore) || 0
    }

    let resultKey = 'bnd'

    // Thresholds (20 questions, max ~100 per dimension)
    const HIGH = 40
    const LOW = 15

    if (senTotal >= HIGH && rumTotal >= HIGH && bndTotal <= LOW) {
      resultKey = 'high'
    } else if (senTotal >= HIGH && plsTotal >= HIGH) {
      resultKey = 'sen_pls'
    } else if (rumTotal >= HIGH && bndTotal <= LOW) {
      resultKey = 'rum_low_bnd'
    } else if (plsTotal >= Math.max(senTotal, rumTotal, bndTotal)) {
      resultKey = 'pls'
    } else if (rumTotal >= Math.max(senTotal, plsTotal, bndTotal)) {
      resultKey = 'rum'
    } else if (senTotal >= Math.max(rumTotal, plsTotal, bndTotal)) {
      resultKey = 'sen'
    } else if (bndTotal >= Math.max(senTotal, rumTotal, plsTotal) && senTotal <= LOW) {
      resultKey = 'low'
    } else {
      resultKey = 'bnd'
    }

    const resultConfig = config.results?.find((r: any) => r.key === resultKey || r.id === resultKey) || config.results?.[0]

    const record = await prisma.testRecord.create({
      data: {
        senTotal,
        rumTotal,
        plsTotal,
        bndTotal,
        resultKey,
        billsJson: JSON.stringify(bills)
      }
    })

    // Randomize scores slightly for uniqueness, but keep the highest as highest
    const randomize = (val: number) => val + Math.floor(Math.random() * 10) + 1
    
    const maxVal = Math.max(senTotal, rumTotal, plsTotal, bndTotal)
    
    const finalScores = {
      sen: senTotal === maxVal ? senTotal : randomize(senTotal),
      rum: rumTotal === maxVal ? rumTotal : randomize(rumTotal),
      pls: plsTotal === maxVal ? plsTotal : randomize(plsTotal),
      bnd: bndTotal === maxVal ? bndTotal : randomize(bndTotal),
    }

    return NextResponse.json({
      recordId: record.id,
      scores: finalScores,
      result: resultConfig,
      bills: bills
    })
  } catch (error) {
    console.error('Error submitting test:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
