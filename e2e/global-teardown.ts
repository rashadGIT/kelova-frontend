import fs from 'fs';
import path from 'path';

const BACKEND = 'http://localhost:3001';
const DIRECTOR_EMAIL = 'director@sunrise.demo';

interface CreatedUser { id: string; email: string }

async function globalTeardown(): Promise<void> {
  const usersFile = path.join(__dirname, '.auth', 'e2e-users.json');
  if (!fs.existsSync(usersFile)) return;

  let users: CreatedUser[] = [];
  try {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf-8')) as CreatedUser[];
  } catch {
    return;
  }

  for (const u of users) {
    try {
      await fetch(`${BACKEND}/users/${u.id}/deactivate`, {
        method: 'PATCH',
        headers: { 'x-dev-user': DIRECTOR_EMAIL },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Non-fatal — teardown best-effort
    }
  }

  // Clean up the file so a fresh run always starts from scratch
  try { fs.unlinkSync(usersFile); } catch { /* ignore */ }
}

export default globalTeardown;
