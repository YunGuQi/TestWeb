import ResultView from '../components/ResultView';
import { prisma } from '../../../lib/prisma';
import { notFound } from 'next/navigation';

export default async function CityPreview({ searchParams }: { searchParams: { id?: string } }) {
  const cityId = parseInt(searchParams.id || '1', 10);
  // Get all cities
  const allCities = await prisma.resultConfig.findMany({ where: { testId: 'city-personality' } });
  
  const cityObj = allCities.find(c => {
    try {
      const extraData = JSON.parse(c.condition);
      return extraData.id === cityId;
    } catch(e) { return false; }
  });
  
  if (!cityObj) {
    return <div>City not found</div>;
  }
  
  let extraData: any = {};
  try {
    extraData = JSON.parse(cityObj.condition);
  } catch(e) {}
  
  const resultData = {
    city: {
      id: extraData.id,
      name: extraData.name,
      title: cityObj.title, 
      desc: cityObj.desc,
      quote: cityObj.quote,
      theme: extraData.theme,
      tags: extraData.tags,
      coords: extraData.coords
    },
    rank: 1263,
    userCoords: extraData.coords
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] relative font-sans text-[#1a1a1a]">
      <main className="max-w-md mx-auto pt-6 px-4 relative z-10 flex flex-col items-center">
        <ResultView forcedResultData={resultData} />
      </main>
    </div>
  );
}
