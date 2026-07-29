const { execSync } = require('child_process');

const command = [
  "npx", "-y", "-p", "@cloudbase/cli", "tcb", "db", "nosql", "execute", 
  "-e", "test-backend-d8grj1s21652da209", 
  "--command",
  `[{"TableName":"TestProject","CommandType":"INSERT","Command":"{\\"insert\\":\\"TestProject\\",\\"documents\\":[{\\"testId\\":\\"emotional-friction\\", \\"name\\": \\"情绪摩擦力测试\\", \\"baseCount\\": 12000, \\"realCount\\": 0}, {\\"testId\\":\\"destined-lover\\", \\"name\\": \\"命定恋人测试\\", \\"baseCount\\": 8000, \\"realCount\\": 0}]}"}]`
].join(' ');

try {
  console.log("Running command...");
  const output = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
  console.log("Success");
} catch(e) {
  console.error("Failed", e.message);
}
