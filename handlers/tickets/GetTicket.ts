import { Request, Response } from 'express';
import { dynamoDb } from '../../index';
import Ticket from '../../utils/interfaces/Ticket';
import * as QRCode from 'qrcode';
import Record from '../../utils/interfaces/Record';
import { EntryType } from '../../utils/enums';
import { validationResult, param } from 'express-validator';

export const getTicketValidations = [param('id').isUUID('4')];

export const GetTicket = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const params = generateDynamoParams(req.params.id);
    const data = await dynamoDb.query(params).promise();

    if (!data.Count) {
      return res
        .status(404)
        .json({ errorMessage: 'The requested resource was not found' });
    }
    return res.json(await processResponse(data.Items));
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ errorMessage: 'Invalid input' });
  }
};

const generateDynamoParams = (ticketId: string) => {
  return {
    TableName: process.env.TICKETS_TABLE,
    KeyConditionExpression: 'PK= :t_id',
    ExpressionAttributeValues: {
      ':t_id': `tickets-id#${ticketId}`,
    },
  };
};

const processResponse = async (dbResponse: any): Promise<Ticket> => {
  const ticket = dbResponse.find((i: any) => i.owner);
  const records = dbResponse.filter((i: any) => i['GSI-2']);
  const id = ticket.PK.split('#')[1];
  return {
    id,
    createdAt: parseInt(ticket.SK.split('#')[1]),
    entries: ticket.entries,
    type: ticket.type,
    owner: ticket.owner,
    records: processRecords(records),
    qrCode: await QRCode.toString(id, { type: 'svg' }),
  };
};

const processRecords = (records: any[]): Array<Record> => {
  return records.map((r) => ({
    id: r.SK.split('#')[1],
    recordType: r.SK.includes('tickets-entry')
      ? EntryType.ENTRY
      : EntryType.EXIT,
    timestamp: parseInt(r['GSI-2'].split('#')[1]),
    location: r['GSI-1'].split('#')[1],
  }));
};
