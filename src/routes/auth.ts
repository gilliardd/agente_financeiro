import { Router, Request, Response } from 'express';
import {
  authenticateUser,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  ensureAdminExists,
  type CreateUserDTO,
} from '../models/User';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username e password sao obrigatorios',
      });
      return;
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Credenciais invalidas',
      });
      return;
    }

    // In a real app, you'd use JWT tokens here
    // For simplicity, we'll return the user data directly
    res.json({
      success: true,
      data: {
        user,
        token: Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64'),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login',
    });
  }
});

// Helper to get user from token
function getUserIdFromToken(authHeader: string | undefined): number | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [userId] = decoded.split(':');
  return parseInt(userId) || null;
}

// Get current user (validate token)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Token nao fornecido',
      });
      return;
    }

    const user = await getUserById(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario nao encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter usuario',
    });
  }
});

// Update current user profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Token nao fornecido',
      });
      return;
    }

    const { name, email, currentPassword, newPassword } = req.body;

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          error: 'Senha atual e obrigatoria para alterar a senha',
        });
        return;
      }

      // Get user with password to verify
      const { getUserByUsername } = await import('../models/User');
      const user = await getUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario nao encontrado',
        });
        return;
      }

      // Verify current password using authenticateUser
      const authResult = await authenticateUser(user.username, currentPassword);
      if (!authResult) {
        res.status(400).json({
          success: false,
          error: 'Senha atual incorreta',
        });
        return;
      }
    }

    // Update user profile
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (newPassword) updateData.password = newPassword;

    await updateUser(userId, updateData);

    const updatedUser = await getUserById(userId);

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar perfil',
    });
  }
});

// Get all users (admin only)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar usuarios',
    });
  }
});

// Get user by ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(parseInt(req.params.id));

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Usuario nao encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter usuario',
    });
  }
});

// Create user (admin only)
router.post('/users', async (req: Request, res: Response) => {
  try {
    const data: CreateUserDTO = req.body;

    if (!data.username || !data.password || !data.name) {
      res.status(400).json({
        success: false,
        error: 'Username, password e name sao obrigatorios',
      });
      return;
    }

    const id = await createUser(data);

    res.status(201).json({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    console.error('Create user error:', error);

    if (error.message === 'Username already exists') {
      res.status(400).json({
        success: false,
        error: 'Username ja existe',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Erro ao criar usuario',
    });
  }
});

// Update user
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    await updateUser(id, data);

    const user = await getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar usuario',
    });
  }
});

// Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    await deleteUser(parseInt(req.params.id));

    res.json({
      success: true,
      message: 'Usuario excluido com sucesso',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao excluir usuario',
    });
  }
});

// Initialize admin user
router.post('/init', async (req: Request, res: Response) => {
  try {
    await ensureAdminExists();
    res.json({
      success: true,
      message: 'Sistema inicializado',
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao inicializar sistema',
    });
  }
});

export default router;
