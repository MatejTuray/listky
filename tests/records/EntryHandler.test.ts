import { app } from '../../index';
import 'dotenv/config';
import supertest from 'supertest';

jest.setTimeout(30000);

describe('POST /entry', () => {
  let testId: string;
  beforeEach(async () => {
    const created = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'TestEntry', type: 'ONE_TIME' });
    testId = created.body.id;
  });
  it('Should not create record when ticketId is missing', async () => {
    const response = await supertest(app)
      .post('/api/entry')
      .send({ location: 'ABC' });
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { location: 'body', msg: 'Invalid value', param: 'ticketId' },
      ])
    );
  });
  it('Should not create record when location is missing', async () => {
    const response = await supertest(app)
      .post('/api/entry')
      .send({ ticketId: '8d0fa8c0-b363-11eb-bba6-29bc000feb89' });
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { location: 'body', msg: 'Invalid value', param: 'location' },
      ])
    );
  });
  it('Should not create record when ticketId is not uuid', async () => {
    const response = await supertest(app)
      .post('/api/entry')
      .send({ ticketId: 'foobar', location: 'bar' });
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        {
          location: 'body',
          msg: 'Invalid value',
          param: 'ticketId',
          value: 'foobar',
        },
      ])
    );
  });
  it('Should not create record when ticketId is not uuid v4', async () => {
    const response = await supertest(app).post('/api/entry').send({
      ticketId: '8d0fa8c0-b363-11eb-bba6-29bc000feb89',
      location: 'barfoo',
    });
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        {
          location: 'body',
          msg: 'Invalid value',
          param: 'ticketId',
          value: '8d0fa8c0-b363-11eb-bba6-29bc000feb89',
        },
      ])
    );
  });
  it('Should not create record when ticket doesnt exist', async () => {
    const response = await supertest(app).post('/api/entry').send({
      ticketId: '28b56677-aa44-4a2a-8d5c-e3a537c7461b',
      location: 'barfoo',
    });
    expect(response.status).toBe(400);
    expect(response.body.errorMessage).toBe('Invalid ticket');
    expect(response.body.errorCode).toBe('CheckTicketException');
  });
  it('Should create entry record', async () => {
    const response = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'barfoo',
    });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Record created');
    expect(response.body.ticketId).toBe(testId);
  });
  it('Should not create record when ticket didnt properly exit (different location)', async () => {
    await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'barfoo',
    });
    const response = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'barfoo1234',
    });
    expect(response.status).toBe(400);
    expect(response.body.errorMessage).toBe('Invalid operation');
    expect(response.body.errorCode).toBe('OperationException');
  });
  it('Should not create record when ticket didnt properly exit (same location)', async () => {
    await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'barfoo1234',
    });
    const response = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'barfoo1234',
    });
    expect(response.status).toBe(400);
    expect(response.body.errorMessage).toBe('Invalid operation');
    expect(response.body.errorCode).toBe('OperationException');
  });
});
