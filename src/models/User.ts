import { query } from '../config/database';
import { createHash } from 'crypto';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string | null;
  role: 'admin' | 'user' | 'viewer';
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

// Hash password using SHA-256
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Ensure table exists
export async function ensureUserTableExists(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(64) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NULL,
      role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
      can_create BOOLEAN DEFAULT true,
      can_edit BOOLEAN DEFAULT true,
      can_delete BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

// Get all users (without passwords)
export async function getAllUsers(): Promise<UserWithoutPassword[]> {
  await ensureUserTableExists();
  const users = await query<User[]>(`
    SELECT id, username, name, email, role, can_create, can_edit, can_delete, is_active, created_at, updated_at
    FROM users
    WHERE is_active = true
    ORDER BY name
  `);
  return users;
}

// Get user by ID
export async function getUserById(id: number): Promise<UserWithoutPassword | null> {
  const rows = await query<User[]>(`
    SELECT id, username, name, email, role, can_create, can_edit, can_delete, is_active, created_at, updated_at
    FROM users WHERE id = ? AND is_active = true
  `, [id]);
  return rows[0] || null;
}

// Get user by username (with password for auth)
export async function getUserByUsername(username: string): Promise<User | null> {
  await ensureUserTableExists();
  const rows = await query<User[]>(
    'SELECT * FROM users WHERE username = ? AND is_active = true',
    [username]
  );
  return rows[0] || null;
}

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<UserWithoutPassword | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;

  if (verifyPassword(password, user.password)) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  return null;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  name: string;
  email?: string;
  role?: 'admin' | 'user' | 'viewer';
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
}

// Create user
export async function createUser(data: CreateUserDTO): Promise<number> {
  await ensureUserTableExists();

  // Check if username already exists
  const existing = await getUserByUsername(data.username);
  if (existing) {
    throw new Error('Username already exists');
  }

  const hashedPassword = hashPassword(data.password);

  const result = await query<any>(
    `INSERT INTO users (username, password, name, email, role, can_create, can_edit, can_delete)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.username,
      hashedPassword,
      data.name,
      data.email || null,
      data.role || 'user',
      data.can_create ?? true,
      data.can_edit ?? true,
      data.can_delete ?? false,
    ]
  );

  return result.insertId;
}

// Update user
export async function updateUser(id: number, data: Partial<Omit<CreateUserDTO, 'username'>>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.password) {
    fields.push('password = ?');
    values.push(hashPassword(data.password));
  }
  if (data.name) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.role) {
    fields.push('role = ?');
    values.push(data.role);
  }
  if (data.can_create !== undefined) {
    fields.push('can_create = ?');
    values.push(data.can_create);
  }
  if (data.can_edit !== undefined) {
    fields.push('can_edit = ?');
    values.push(data.can_edit);
  }
  if (data.can_delete !== undefined) {
    fields.push('can_delete = ?');
    values.push(data.can_delete);
  }

  if (fields.length > 0) {
    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

// Delete user (soft delete)
export async function deleteUser(id: number): Promise<void> {
  await query('UPDATE users SET is_active = false WHERE id = ?', [id]);
}

// Create default admin user if none exists
export async function ensureAdminExists(): Promise<void> {
  await ensureUserTableExists();

  const admins = await query<User[]>(
    "SELECT * FROM users WHERE role = 'admin' AND is_active = true"
  );

  if (admins.length === 0) {
    await createUser({
      username: 'admin',
      password: 'admin123',
      name: 'Administrador',
      email: 'admin@finbot.com',
      role: 'admin',
      can_create: true,
      can_edit: true,
      can_delete: true,
    });
    console.log('Default admin user created: admin / admin123');
  }
}
