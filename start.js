node -e "
const { spawn } = require('child_process');
const path = require('path');
const server = spawn('npm', ['run', 'dev', '--', '-p', '3011'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  detached: true,
  shell: true
});
server.unref();
console.log('Server started on port 3011');
"