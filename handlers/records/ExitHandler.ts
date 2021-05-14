import { Request, Response } from 'express';
import { dynamoDb } from '../../index';
import { v4 as uuid } from 'uuid';
import { DateTime } from 'luxon';
import { validationResult } from 'express-validator';
import { ticketCheck } from '../../utils/helpers';
import DBItem from '../../utils/interfaces/DBItem';
import CreateRecordRequestBody from '../../utils/interfaces/RecordRequestBody';

export const ExitHandler = async (req: Request, res: Response) => {
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
  if (!validateOperation(recordItemsForValidTicket)) {
    return res.status(400).json({
      errorMessage: 'Invalid operation',
      errorCode: 'OperationException',
    });
  }
  try {
    const params = generateDynamoParams(req.body);
    const data = await dynamoDb.update(params).promise();
    return res.status(201).json({
      message: 'Record created',
      ticketId: data.Attributes.PK.split('#')[1],
    });
  } catch (error) {
    return res
      .status(400)
      .json({ errorMessage: error.message, errorCode: error.code });
  }
};

const validateOperation = (records: DBItem[]) => {
  return (
    records.filter((i: DBItem) => i.SK.includes('tickets-entry#')).length >
    records.filter((i: DBItem) => i.SK.includes('tickets-exit#')).length
  );
};

const generateDynamoParams = (data: CreateRecordRequestBody) => {
  const PK = `tickets-id#${data.ticketId}`;
  return {
    TableName: process.env.TICKETS_TABLE,
    Key: {
      PK,
      SK: `tickets-exit#${uuid()}`,
    },
    UpdateExpression: 'SET #gsi1= :location,  #gsi2= :createdAt',
    ExpressionAttributeValues: {
      ':location': `gsi1-tickets-exit-location#${data.location}`,
      ':createdAt': `gsi2-tickets-exit-createdAt#${DateTime.now()
        .toUTC()
        .toMillis()}`,
    },
    ExpressionAttributeNames: {
      '#gsi1': 'GSI-1',
      '#gsi2': 'GSI-2',
    },
    ReturnValues: 'ALL_NEW',
  };
};
