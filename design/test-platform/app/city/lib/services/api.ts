export const verifyOrderCode = async (code: string, deviceId: string, testId: string = 'city-personality', cityName?: string, cityId?: any) => {
  try {
    const res = await fetch(`/api/city/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, deviceId, testId, cityName, cityId })
    });
    return await res.json();
  } catch (error) {
    console.error('Verify order error:', error);
    return { success: false, error: '网络错误，请稍后再试' };
  }
};
