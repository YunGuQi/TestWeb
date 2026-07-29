import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'src/config/tests/emotional-friction.json')
    const fileContent = await fs.readFile(configPath, 'utf8')
    const data = JSON.parse(fileContent)
    
    const questions = data.questions || []

    // Shuffle options
    const shuffledQuestions = questions.map((q: any) => {
      const shuffledOptions = [...(q.options || [])].sort(() => Math.random() - 0.5)
      // Remove score fields from options to prevent cheating
      const cleanOptions = shuffledOptions.map(opt => ({
        id: opt.id,
        text: opt.text,
        billName: opt.billName
      }))
      return {
        id: q.id,
        text: q.text,
        options: cleanOptions
      }
    })

    return NextResponse.json(shuffledQuestions)
  } catch (error: any) {
    console.error('Error fetching questions:', error)
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com'
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch questions',
      cause: error.cause?.message || String(error.cause),
      targetUrl: apiBase
    }, { status: 500 })
  }
}
