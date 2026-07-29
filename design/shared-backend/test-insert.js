const tcb = require('@cloudbase/node-sdk');
const app = tcb.init({ env: 'test-backend-d8grj1s21652da209' });
const db = app.database();

async function run() {
  try {
    const codes = [
      { id: '1', code: 'C1' },
      { id: '2', code: 'C2' }
    ];
    console.log('Testing array insertion...');
    const res = await db.collection('ActivationCode').add(codes);
    console.log('Success:', res);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
