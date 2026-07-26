import type { Request, Response } from 'express';
import { Router } from 'express';
import crypto from 'node:crypto';
import { authenticateAccessToken } from '../modules/auth/auth.middleware';
import { eventBus } from '../providers/events';
import { prisma } from '../config/prisma';

export const sseRouter = Router();

// Store active clients
const clients = new Map<string, Response[]>();

export function broadcastEvent(userId: string, eventType: string, data: any) {
  const userClients = clients.get(userId);
  if (userClients && userClients.length > 0) {
    userClients.forEach((client) => {
      client.write(`event: ${eventType}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
}

// Setup EventBus Subscriptions
let isSubscribed = false;

function setupSubscriptions() {
  if (isSubscribed) return;
  isSubscribed = true;

  eventBus.subscribe('APPLICATION_SUBMITTED', async (payload: any) => {
    // Notify the recruiter
    try {
      const app = await prisma.application.findUnique({
        where: { id: payload.applicationId },
        include: { jobPosting: true }
      });
      if (app?.jobPosting?.recruiterId) {
        broadcastEvent(app.jobPosting.recruiterId, 'notification', {
          id: crypto.randomUUID(),
          message: `New application submitted for ${app.jobPosting.title}`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    } catch (e) {}
  });

  eventBus.subscribe('APPLICATION_STATUS_UPDATED', async (payload: any) => {
    // Notify the student
    try {
      const app = await prisma.application.findUnique({
        where: { id: payload.applicationId },
        include: { resume: true, jobPosting: true }
      });
      if (app?.resume?.ownerId) {
        broadcastEvent(app.resume.ownerId, 'notification', {
          id: crypto.randomUUID(),
          message: `Your application for ${app.jobPosting.title} is now ${payload.newStatus}`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    } catch (e) {}
  });
}

// Call setup
setupSubscriptions();

sseRouter.get('/events', authenticateAccessToken, (req: Request, res: Response) => {
  const userId = req.auth!.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  // Tell the client that the connection is open
  res.write(`event: notification\ndata: ${JSON.stringify({ id: crypto.randomUUID(), message: 'Connected to notifications stream', read: true, timestamp: new Date().toISOString() })}\n\n`);

  const userClients = clients.get(userId) || [];
  userClients.push(res);
  clients.set(userId, userClients);

  req.on('close', () => {
    const currentClients = clients.get(userId) || [];
    clients.set(userId, currentClients.filter(c => c !== res));
  });
});
