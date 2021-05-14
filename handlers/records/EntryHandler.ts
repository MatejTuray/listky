import { Request, Response } from 'express';
import { dynamoDb } from '../../index';
import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';
import { body, validationResult } from 'express-validator';
import { TicketType } from '../../utils/enums';
import CreateRecordRequestBody from '../../utils/interfaces/RecordRequestBody';
import DBItem from '../../utils/interfaces/DBItem';
import TicketItem from '../../utils/interfaces/TicketItemDB';
import { ticketCheck } from '../../utils/helpers';

export const recordValidations = [
  body('ticketId').isUUID('4'),
  body('location').exists(),
];

export const EntryHandler = async (req: Request, res: Response) => {
  let shouldUpdate = false;
  const dayStart = DateTime.now().toUTC().startOf('day').toMillis();
  const dayEnd = DateTime.now().toUTC().endOf('day').toMillis();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const recordItemsForValidTicket = await ticketCheck(req.body.ticketId);
  if (recordItemsForValidTicket.length === 0) {
    return res.status(400).json({
      errorMessage: 'Invalid ticket',
      errorCode: 'CheckTicketException',
    });
  }
  const ticket = recordItemsForValidTicket.find(
    (i: DBItem) => i.owner
  ) as TicketItem;
  if (!hasExitedProperly(recordItemsForValidTicket)) {
    return res.status(400).json({
      errorMessage: 'Invalid operation',
      errorCode: 'OperationException',
    });
  }
  if (
    isANewEntry(
      recordItemsForValidTicket,
      ticket,
      req.body.location,
      dayStart,
      dayEnd
    )
  ) {
    if (!(ticket.entries > 0)) {
      return res.status(403).json({
        errorMessage: 'Ticket has no entries left',
        errorCode: 'EntryException',
      });
    }
    shouldUpdate = true;
  }
  try {
    const params = generateDynamoParams(req.body);
    if (shouldUpdate) {
      // run this in transaction so both ops succeed/fail
      await dynamoDb.transactWrite(transactionParams(ticket, params)).promise();
    } else {
      await dynamoDb.update(params).promise();
    }
    return res.status(201).json({
      message: 'Record created',
      ticketId: req.body.ticketId,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ errorMessage: error });
  }
};

const transactionParams = (ticket: TicketItem, recordParams: any) => {
  return {
    ReturnConsumedCapacity: 'INDEXES',
    ReturnItemCollectionMetrics: 'SIZE',
    TransactItems: [
      {
        Update: {
          TableName: process.env.TICKETS_TABLE,
          Key: {
            PK: `${ticket.PK}`,
            SK: `${ticket.SK}`,
          },
          UpdateExpression: 'SET #entries= :entries',
          ExpressionAttributeValues: {
            ':entries': ticket.entries - 1,
          },
          ExpressionAttributeNames: {
            '#entries': 'entries',
          },
        },
      },
      {
        Update: recordParams,
      },
    ],
  };
};

const hasExitedProperly = (recordData: DBItem[]): boolean => {
  //failing to check if ticket exit happened is not a good idea
  return (
    recordData.filter((i: any) => i.SK.includes('tickets-entry#')).length ===
    recordData.filter((i: any) => i.SK.includes('tickets-exit#')).length
  );
};

const isANewEntry = (
  recordData: DBItem[],
  ticket: TicketItem,
  location: string,
  dayStart: number,
  dayEnd: number
): boolean => {
  if (ticket.type === TicketType[TicketType.SEASON_PASS]) {
    return false;
  }

  if (
    recordData.find(
      (i: any) =>
        i['GSI-1'] &&
        i['GSI-1'] === `gsi1-tickets-entry-location#${location}` &&
        dayEnd > parseInt(i['GSI-2'].split('#')[1]) &&
        parseInt(i['GSI-2'].split('#')[1]) > dayStart
    )
  ) {
    return false;
  }
  return true;
};

const generateDynamoParams = (data: CreateRecordRequestBody) => {
  const PK = `tickets-id#${data.ticketId}`;
  return {
    TableName: process.env.TICKETS_TABLE,
    Key: {
      PK,
      SK: `tickets-entry#${uuid()}`,
    },
    UpdateExpression: 'SET #gsi1= :location,  #gsi2= :createdAt',
    ExpressionAttributeValues: {
      ':location': `gsi1-tickets-entry-location#${data.location}`,
      ':createdAt': `gsi2-tickets-entry-createdAt#${DateTime.now()
        .toUTC()
        .toMillis()}`,
    },
    ExpressionAttributeNames: {
      '#gsi1': 'GSI-1',
      '#gsi2': 'GSI-2',
    },
  };
};
