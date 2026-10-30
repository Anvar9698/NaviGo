const { spawn } = require('child_process');

console.log("\x1b[36m%s\x1b[0m", "[Yo'l Ma'lumoti 103] Ishga tushirilmoqda...");
console.log("\x1b[32m%s\x1b[0m", "➜ Backend API: http://localhost:4000");
console.log("\x1b[32m%s\x1b[0m", "➜ Web Xarita:  http://localhost:3000");

const api = spawn('npm', ['run', 'dev', '--workspace=@yol/api'], {
  stdio: 'inherit',
  shell: true
});

const web = spawn('npm', ['run', 'dev', '--workspace=@yol/web'], {
  stdio: 'inherit',
  shell: true
});

const handleExit = () => {
  try { api.kill(); } catch (e) {}
  try { web.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', handleExit);
