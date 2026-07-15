import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { verifyPassword, hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateSecureToken } from '../utils/token';
import { sendPasswordReset } from '../services/email';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// Screen 1: Verify Email/Phone (Google-style Step 1)
router.post('/login/verify', async (req: Request, res: Response) => {
  const { identifier } = req.body; // Can be email or phone

  if (!identifier) {
    return res.status(400).json({ error: 'Email or phone number is required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { phone: identifier.trim() }
        ]
      },
      include: {
        department: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found with this email/phone' });
    }

    return res.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department ? user.department.name : null
    });
  } catch (error) {
    console.error('Verify login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// User Registration (New Volunteer)
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, phone, password, departmentCode } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Name, email, phone, and password are required' });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { phone: phone.trim() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or phone' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (default as VOLUNTEER)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash,
        role: 'VOLUNTEER'
      }
    });

    const payload = {
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        departmentId: user.departmentId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Screen 3: Authenticate Password (Google-style Step 3)
router.post('/login/authenticate', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { phone: identifier.trim() }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const payload = {
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        departmentId: user.departmentId
      }
    });
  } catch (error) {
    console.error('Authenticate login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    
    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    const newPayload = {
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId
    };

    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    return res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// Forgot Password (Request Reset Link)
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      // Return 200 for security to not disclose registered emails
      return res.json({ message: 'If the email exists, a reset link will be sent.' });
    }

    // Expiry: 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const token = generateSecureToken();

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await sendPasswordReset(user.email, user.name, resetLink);

    return res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid, expired, or already used reset token' });
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    return res.json({ message: 'Password has been successfully updated.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Screen 4 Profile Completion
router.post('/profile/complete', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { name, phone } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
      }
    });

    return res.json({
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        departmentId: updatedUser.departmentId
      }
    });
  } catch (error: any) {
    console.error('Complete profile error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Me endpoint to verify user is authenticated
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      include: { department: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department ? user.department.name : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET list of volunteers/coordinators for task assignment (Admins only)
router.get('/coordinators', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  const departmentId = req.user?.departmentId;

  try {
    let users;
    if (role === 'SUPER_ADMIN') {
      users = await prisma.user.findMany({
        where: {
          role: { in: ['DEPARTMENT_ADMIN', 'VOLUNTEER'] }
        },
        include: { department: true },
        orderBy: { name: 'asc' }
      });
    } else if (role === 'DEPARTMENT_ADMIN') {
      // Fetch volunteers inside their own department
      users = await prisma.user.findMany({
        where: {
          role: 'VOLUNTEER',
          departmentId
        },
        include: { department: true },
        orderBy: { name: 'asc' }
      });
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(users);
  } catch (error) {
    console.error('Fetch coordinators error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
