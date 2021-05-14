import DBItem from './interfaces/DBItem';
import { dynamoDb } from '../index';

export const ticketCheck = async (ticketId: string): Promise<DBItem[]> => {
  const query = {
    TableName: process.env.TICKETS_TABLE,
    KeyConditionExpression: 'PK= :t_id',
    ExpressionAttributeValues: {
      ':t_id': `tickets-id#${ticketId}`,
    },
  };
  try {
    const data = await dynamoDb.query(query).promise();
    if (data.Count > 0 && data.Items.find((i: any) => i.owner)) {
      return data.Items;
    }
    return [];
  } catch (e) {
    console.log(e);
    return [];
  }
};
