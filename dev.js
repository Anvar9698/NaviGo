const { spawn } = require('child_process');
const path = require('path');

console.log("\x1b[36m%s\x1b[0m", "[NaviGo — Smart Navigation & Emergency Response] Ishga tushirilmoqda...");
console.log("\x1b[32m%s\x1b[0m", "➜ Backend API: http://localhost:4001");
console.log("\x1b[32m%s\x1b[0m", "➜ Web Xarita:  http://localhost:3000");

const api = spawn('node', ['apps/api/dist/server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

const web = spawn('npm', ['run', 'dev', '--workspace=@yol/web'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

const handleExit = () => {
  try { api.kill(); } catch (e) {}
  try { web.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', handleExit);
