const tcb = require('@cloudbase/node-sdk');

async function run() {
  const app = tcb.init({
    env: 'test-backend-d8grj1s21652da209',
    secretId: process.env.TENCENTCLOUD_SECRETID,
    secretKey: process.env.TENCENTCLOUD_SECRETKEY
  });
  const db = app.database();
  try {
    const res = await db.collection('ActivationCode').get();
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
