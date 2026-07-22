import tcb from '@cloudbase/node-sdk';

let app: any;
let db: any;

try {
  app = tcb.init({
    env: 'test-backend-d8grj1s21652da209'
  });
  db = app.database();
} catch (e: any) {
  console.error("TCB INIT ERROR:", e);
  db = {
    collection: () => { throw new Error(`TCB INIT ERROR: ${e.message}`); }
  };
}

export { app, db };
