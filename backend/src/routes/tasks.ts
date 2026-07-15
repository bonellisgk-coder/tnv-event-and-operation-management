import { Router, Response } from 'express';
import { prisma } from '../utils/db';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth';
import { sendTaskAssignment } from '../services/email';
import { TaskStatus, TaskPriority, Role } from '@prisma/client';

const router = Router();

// GET tasks
// - Super Admin: returns all tasks
// - Department Admin: returns tasks for users in their department, or all tasks
// - Volunteer: returns tasks assigned to them only ("My Tasks")
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  const departmentId = req.user?.departmentId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let tasks;

    if (role === Role.SUPER_ADMIN) {
      tasks = await prisma.task.findMany({
        include: {
          assignee: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { deadline: 'asc' }
      });
    } else if (role === Role.DEPARTMENT_ADMIN) {
      // Find tasks assigned to users who belong to this department
      tasks = await prisma.task.findMany({
        where: {
          OR: [
            { assigneeId: null },
            {
              assignee: {
                departmentId: departmentId || undefined
              }
            }
          ]
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { deadline: 'asc' }
      });
    } else {
      // Volunteer: My Tasks
      tasks = await prisma.task.findMany({
        where: { assigneeId: userId },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { deadline: 'asc' }
      });
    }

    return res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST assign task (Super Admin & Dept Admin)
router.post('/', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { title, description, assigneeId, priority, deadline } = req.body;

  if (!title || !description || !deadline) {
    return res.status(400).json({ error: 'Title, description, and deadline are required' });
  }

  try {
    let assignee = null;

    if (assigneeId) {
      assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return res.status(404).json({ error: 'Assignee volunteer user not found' });
      }

      // Department Admin check
      if (req.user?.role === Role.DEPARTMENT_ADMIN && assignee.departmentId !== req.user?.departmentId) {
        return res.status(403).json({ error: 'Forbidden: Cannot assign tasks to volunteers outside your department' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assigneeId: assigneeId || null,
        priority: (priority as TaskPriority) || TaskPriority.MEDIUM,
        deadline: new Date(deadline),
        status: TaskStatus.TODO
      },
      include: {
        assignee: true
      }
    });

    // Send email notification to assignee
    if (assignee) {
      const formattedDeadline = new Date(task.deadline).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      await sendTaskAssignment(
        assignee.email,
        assignee.name,
        task.title,
        task.description,
        task.priority,
        formattedDeadline
      );
    }

    return res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH update task status (Any authenticated user who is assignee or admin)
router.patch('/:id/status', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // TODO, IN_PROGRESS, COMPLETED

  if (!status || !Object.values(TaskStatus).includes(status)) {
    return res.status(400).json({ error: 'Invalid or missing task status' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const userId = req.user?.userId;
    const role = req.user?.role;
    const departmentId = req.user?.departmentId;

    // Access control:
    // Super Admin: yes
    // Dept Admin: yes, if assignee is in their department
    // Volunteer: yes, if task is assigned to them
    const isOwner = task.assigneeId === userId;
    const isSuperAdmin = role === Role.SUPER_ADMIN;
    const isDeptAdmin = role === Role.DEPARTMENT_ADMIN && task.assignee?.departmentId === departmentId;

    if (!isOwner && !isSuperAdmin && !isDeptAdmin) {
      return res.status(403).json({ error: 'Forbidden: You do not have permissions to modify this task status' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: status as TaskStatus
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE task (Admins only)
router.delete('/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'DEPARTMENT_ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user?.role === Role.DEPARTMENT_ADMIN && task.assignee?.departmentId !== req.user?.departmentId) {
      return res.status(403).json({ error: 'Forbidden: Task assignee is in another department' });
    }

    await prisma.task.delete({
      where: { id }
    });

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
