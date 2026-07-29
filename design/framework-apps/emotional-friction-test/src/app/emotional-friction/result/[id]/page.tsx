import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ResultClient from './ResultClient'

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recordId = parseInt(id, 10)
  
  if (isNaN(recordId)) {
    notFound()
  }

  const record = await prisma.testRecord.findUnique({
    where: { id: recordId }
  })

  if (!record) {
    notFound()
  }

  const config = await prisma.resultConfig.findUnique({
    where: { key: record.resultKey }
  })

  if (!config) {
    notFound()
  }

  // Calculate slightly randomized scores like API did, or just read from record if we saved exact randomized scores?
  // Wait, we didn't save randomized scores in DB, we returned them.
  // We can randomize them here again consistently if we seed a random generator with recordId, 
  // or we just use the raw totals + some logic.
  // Actually, for simplicity, we just use the raw totals for now, since this is a server component and we want consistency on refresh.
  
  const rawScores = {
    sen: record.senTotal,
    rum: record.rumTotal,
    pls: record.plsTotal,
    bnd: record.bndTotal
  }

  const allConfigs = await prisma.resultConfig.findMany()

  return <ResultClient record={record} config={config} scores={rawScores} allConfigs={allConfigs} />
}
