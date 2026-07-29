const { execSync } = require('child_process');

function run(tableName) {
  const commandObj = [
    {
      TableName: tableName,
      CommandType: "INSERT",
      Command: JSON.stringify({
        insert: tableName,
        documents: [{ _id: "dummy" }]
      })
    }
  ];
  
  const cmdStr = JSON.stringify(commandObj).replace(/"/g, '\\"');
  const fullCmd = `npx -y -p @cloudbase/cli tcb db nosql execute -e test-backend-d8grj1s21652da209 --command "${cmdStr}"`;
  
  console.log(`Running: ${fullCmd}`);
  try {
    execSync(fullCmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(e.message);
  }
}

// run('TestProject');
run('ActivationCode');
