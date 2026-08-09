require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected via pg');

  const resultConfigs = (await client.query('SELECT * FROM "ResultConfig"')).rows;
  const globalConfigs = (await client.query('SELECT * FROM "GlobalConfig"')).rows;
  const questionsRaw = (await client.query('SELECT * FROM "Question" ORDER BY "order"')).rows;
  const optionsRaw = (await client.query('SELECT * FROM "Option"')).rows;
  const activationCodes = (await client.query('SELECT * FROM "ActivationCode"')).rows;
  const testRecords = (await client.query('SELECT * FROM "TestRecord"')).rows;

  // Group options into questions
  const questions = questionsRaw.map(q => {
    return {
      ...q,
      options: optionsRaw.filter(o => o.questionId === q.id)
    };
  });

  const dumpData = {
    resultConfigs,
    globalConfigs,
    questions,
    activationCodes,
    testRecords
  };

  const dumpPath = path.join(process.cwd(), 'vercel_dump.json');
  fs.writeFileSync(dumpPath, JSON.stringify(dumpData, null, 2), 'utf-8');
  console.log(`Exported all data to ${dumpPath}`);

  await client.end();
}

main().catch(console.error);
