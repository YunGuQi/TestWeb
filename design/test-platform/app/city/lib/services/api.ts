export const submitTestResult = async (testId: string, deviceId: string) => {
  try {
    const res = await fetch(`/api/city/submit-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId, deviceId })
    });
    return await res.json();
  } catch (error) {
    console.error('Submit result error:', error);
    return { success: false };
  }
};

export const verifyOrderCode = async (code: string, deviceId: string, testId: string) => {
  try {
    const res = await fetch(`/api/city/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, deviceId, testId })
    });
    return await res.json();
  } catch (error) {
    console.error('Verify order error:', error);
    return { success: false, error: '网络错误，请稍后再试' };
  }
};
