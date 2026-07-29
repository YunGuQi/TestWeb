import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { answers, deviceId } = await req.json(); // Array of chosen indices
    
    // 1. Read local JSON for dynamic scoring
    const filePath = path.join(process.cwd(), 'src', 'config', 'tests', 'city-personality.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // 2. Calculate coordinates
    let userCoords = [5, 5, 0, 5, 5];
    if (Array.isArray(answers)) {
      answers.forEach((optIndex, qIndex) => {
        const q = data.questions[qIndex];
        if (q && q.opts[optIndex]) {
          const delta = q.opts[optIndex].e;
          if (delta) {
             userCoords = userCoords.map((v, i) => v + delta[i]);
          }
        }
      });
    }

    // 3. Find closest city using Euclidean distance
    let minDistance = Infinity;
    let closestCity = null;

    data.cities.forEach((city: any) => {
      let distance = 0;
      for (let i = 0; i < 5; i++) {
        distance += Math.pow(userCoords[i] - city.coords[i], 2);
      }
      distance = Math.sqrt(distance);
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    });

    // 4. Hit shared-backend for rank
    const API_BASE = process.env.API_BASE_URL || 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com';
    let current_rank = 2000;
    try {
      const res = await fetch(`${API_BASE}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: data.id, deviceId })
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.current_rank) {
          current_rank = json.current_rank;
        }
      } else {
        const text = await res.text();
        console.error('Submit rank returned non-JSON:', text.substring(0, 200));
      }
    } catch (e) {
      console.error("Error hitting shared backend:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        city: closestCity,
        rank: current_rank,
        userCoords
      }
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
