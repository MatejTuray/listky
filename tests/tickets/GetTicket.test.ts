import { app } from '../../index';
import 'dotenv/config';
import supertest from 'supertest';

jest.setTimeout(30000);

describe('GET /ticket', () => {
  let testId: string;
  beforeAll(async () => {
    const created = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'TestGet', type: 'ONE_TIME' });
    testId = created.body.id;
  });
  it('Should retrieve a valid ticket', async () => {
    const response = await supertest(app).get(`/api/tickets/${testId}`);
    expect(response.status).toBe(200);
    expect(response.body.type).toBe('ONE_TIME');
    expect(response.body.entries).toBe(1);
    expect(response.body.owner).toBe('TestGet');
    expect(response.body.id).toBeTruthy();
    expect(response.body.createdAt).toBeTruthy();
    expect(response.body.qrCode).toBeTruthy();
    expect(response.body.records).toStrictEqual([]);
  });
  it('Should return validation error if id is not uuid', async () => {
    const response = await supertest(app).get(`/api/tickets/foobar`);
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        {
          location: 'params',
          msg: 'Invalid value',
          param: 'id',
          value: 'foobar',
        },
      ])
    );
  });
  it('Should return validation error if id is not uuid v4', async () => {
    const response = await supertest(app).get(
      `/api/tickets/8d0fa8c0-b363-11eb-bba6-29bc000feb89`
    );
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        {
          location: 'params',
          msg: 'Invalid value',
          param: 'id',
          value: '8d0fa8c0-b363-11eb-bba6-29bc000feb89',
        },
      ])
    );
  });
  it('Should return 404 if resource doesnt exist', async () => {
    const response = await supertest(app).get(
      `/api/tickets/80fea3d7-170c-4ff4-98d7-e2a656ec6efa`
    );
    expect(response.status).toBe(404);
    expect(response.body.errorMessage).toBe(
      'The requested resource was not found'
    );
  });
});
