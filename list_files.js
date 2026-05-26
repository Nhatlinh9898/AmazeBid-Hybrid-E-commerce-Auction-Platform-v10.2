const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Listing current directory recursively ---');
try {
  const files = fs.readdirSync('.');
  console.log('Files in .:', files);
} catch (e) {
  console.error(e);
}

console.log('--- Checking git status if any ---');
try {
  const gitStatus = execSync('git status', { encoding: 'utf8' });
  console.log(gitStatus);
} catch (e) {
  console.error('git status failed:', e.message);
}

console.log('--- Checking git log if any ---');
try {
  const gitLog = execSync('git log -n 5 --oneline', { encoding: 'utf8' });
  console.log(gitLog);
} catch (e) {
  console.error('git log failed:', e.message);
}
