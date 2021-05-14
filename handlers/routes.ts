import express from 'express';
import { Request, Response } from 'express';
import { CreateTicket, createTicketValidations } from './tickets/CreateTicket';
import { GetTicket, getTicketValidations } from './tickets/GetTicket';
import { EntryHandler, recordValidations } from './records/EntryHandler';
import { ExitHandler } from './records/ExitHandler';

const router = express.Router();

router.get(
  '/tickets/:id',
  ...getTicketValidations,
  async (req: Request, res: Response) => {
    await GetTicket(req, res);
  }
);

router.post(
  '/tickets',
  ...createTicketValidations,
  async (req: Request, res: Response) => {
    await CreateTicket(req, res);
  }
);

router.post(
  '/entry',
  ...recordValidations,
  async (req: Request, res: Response) => {
    await EntryHandler(req, res);
  }
);

router.post(
  '/exit',
  ...recordValidations,
  async (req: Request, res: Response) => {
    await ExitHandler(req, res);
  }
);

export default router;
