import { Router, Response } from 'express';
import { prisma } from '../utils/db';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all departments
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create department (Super Admin only)
router.post('/', authenticateJWT, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Department name is required' });
  }

  try {
    const department = await prisma.department.create({
      data: { name: name.trim() }
    });
    return res.json(department);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
