import { Request, Response } from 'express';
import { dynamoDb } from '../../index';
import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';
import { TicketType } from '../../utils/enums';
import Ticket from '../../utils/interfaces/Ticket';
import * as QRCode from 'qrcode';
import { body, validationResult } from 'express-validator';
import CreateTicketRequestBody from '../../utils/interfaces/TicketRequestBody';
import DBItem from '../../utils/interfaces/DBItem';

export const createTicketValidations = [
  body('owner').exists(),
  body('type').isIn([
    TicketType[TicketType.ONE_TIME],
    TicketType[TicketType.SEASON_PASS],
    TicketType[TicketType.TEN_ENTRIES],
  ]),
];

export const CreateTicket = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const params = generateDynamoParams(req.body);
    const data = await dynamoDb.update(params).promise();
    return res.json(await processResponse(data.Attributes));
  } catch (error) {
    return res.status(400).json({ errorMessage: error });
  }
};

const generateDynamoParams = (data: CreateTicketRequestBody) => {
  return {
    TableName: process.env.TICKETS_TABLE,
    Key: {
      PK: `tickets-id#${uuid()}`,
      SK: `tickets-created-at#${DateTime.now().toUTC().toMillis()}`,
    },
    UpdateExpression: 'SET #type= :type,  #entries= :entries, #owner = :owner',
    ExpressionAttributeValues: {
      ':type': data.type,
      ':owner': data.owner,
      ':entries': TicketType[data.type as any],
    },
    ExpressionAttributeNames: {
      '#owner': 'owner',
      '#type': 'type',
      '#entries': 'entries',
    },
    ReturnValues: 'ALL_NEW',
  };
};

const processResponse = async (dbResponse: DBItem): Promise<Ticket> => {
  const id = dbResponse.PK.split('#')[1];
  return {
    id,
    createdAt: parseInt(dbResponse.SK.split('#')[1]),
    entries: dbResponse.entries,
    type: dbResponse.type,
    owner: dbResponse.owner,
    records: [],
    qrCode: await QRCode.toString(id, { type: 'svg' }),
  };
};
