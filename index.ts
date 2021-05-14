import express from 'express';
import 'dotenv/config';
import serverless from 'serverless-http';
import AWS from 'aws-sdk';
import routes from './handlers/routes';

const app = express();
const IS_OFFLINE = process.env.IS_OFFLINE;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export let dynamoDb: any;

if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000',
  });
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

app.use('/api', routes);

export { app };
module.exports.handler = serverless(app);
