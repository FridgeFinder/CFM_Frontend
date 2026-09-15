import net from 'net';
import { spawn } from 'child_process';

async function getFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(getFreePort(startPort + 1));
      } else {
        console.error(err);
        resolve(startPort); // fallback
      }
    });
  });
}

async function main() {
  const nextPort = await getFreePort(3000);
  const mockPort = await getFreePort(3050);

  const mockUrl = `http://127.0.0.1:${mockPort}`;

  // Update environment variables
  const env = {
    ...process.env,
    PORT: nextPort.toString(),
    NEXT_PUBLIC_FF_API_URL: mockUrl,
    NEXT_PUBLIC_USERS_API_URL: mockUrl,
  };

  const command = `npx concurrently --names "MOCK,NEXT" --prefix-colors "yellow,green" --kill-others "npx json-server mock/data.json --routes mock/server-routes.json --host 0.0.0.0 --port ${mockPort}" "npx next dev --turbopack --experimental-https -p ${nextPort}"`;

  const child = spawn(command, {
    env,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch(console.error);
