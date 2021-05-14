import { app } from '../../index';
import 'dotenv/config';
import supertest from 'supertest';

jest.setTimeout(30000);

describe('POST /ticket', () => {
  it('Should create a valid ONE_TIME entry ticket', async () => {
    const response = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'Test', type: 'ONE_TIME' });
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('ONE_TIME');
    expect(response.body.entries).toBe(1);
    expect(response.body.owner).toBe('Test');
    expect(response.body.id).toBeTruthy();
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.qrCode).toBeTruthy();
    expect(response.body.records).toStrictEqual([]);
  });
  it('Should create a valid TEN_ENTRIES entry ticket', async () => {
    const response = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'Test', type: 'TEN_ENTRIES' });
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('TEN_ENTRIES');
    expect(response.body.entries).toBe(10);
    expect(response.body.owner).toBe('Test');
    expect(response.body.id).toBeTruthy();
    expect(response.body.qrCode).toBeTruthy();
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.records).toStrictEqual([]);
  });
  it('Should create a valid SEASON_PASS entry ticket', async () => {
    const response = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'Test', type: 'SEASON_PASS' });
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('SEASON_PASS');
    expect(response.body.entries).toBe(-1);
    expect(response.body.owner).toBe('Test');
    expect(response.body.id).toBeTruthy();
    expect(response.body.qrCode).toBeTruthy();
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.records).toStrictEqual([]);
  });
  it('Should not create a ticket when TYPE is missing', async () => {
    const response = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'Test' });
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { location: 'body', msg: 'Invalid value', param: 'type' },
      ])
    );
  });
  it('Should not create a ticket when TYPE is invalid', async () => {
    const response = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'Test', type: 'bar' });
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { location: 'body', msg: 'Invalid value', param: 'type', value: 'bar' },
      ])
    );
  });
  it('Should not create a ticket when OWNER is missing', async () => {
    const response = await supertest(app)
      .post('/api/tickets')
      .send({ type: 'SEASON_PASS' });
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { location: 'body', msg: 'Invalid value', param: 'owner' },
      ])
    );
  });
});
