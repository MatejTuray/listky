import { app } from '../index';
import 'dotenv/config';
import supertest from 'supertest';

jest.setTimeout(120000);

describe('Service / integration tests', () => {
  let testId: string;
  let seasonPassId: string;
  let tenEntriesPassId: string;
  beforeEach(async () => {
    const created = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'TestEntry', type: 'ONE_TIME' });
    const seasonPass = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'TestSeason', type: 'SEASON_PASS' });
    const tenPass = await supertest(app)
      .post('/api/tickets')
      .send({ owner: 'TestTen', type: 'TEN_ENTRIES' });
    testId = created.body.id;
    seasonPassId = seasonPass.body.id;
    tenEntriesPassId = tenPass.body.id;
  });
  it('Should create entry record, exit record at location A, and not allow entry for location B (one time entry ticket, same day)', async () => {
    const responseEntry = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'A',
    });
    expect(responseEntry.status).toBe(201);
    expect(responseEntry.body.message).toBe('Record created');
    expect(responseEntry.body.ticketId).toBe(testId);
    const checkTicketEntries = await supertest(app).get(
      `/api/tickets/${testId}`
    );
    expect(checkTicketEntries.status).toBe(200);
    expect(checkTicketEntries.body.id).toBe(testId);
    expect(checkTicketEntries.body.entries).toBe(0);
    const responseExit = await supertest(app).post('/api/exit').send({
      ticketId: testId,
      location: 'A',
    });
    expect(responseExit.status).toBe(201);
    expect(responseExit.body.message).toBe('Record created');
    expect(responseExit.body.ticketId).toBe(testId);
    const responseEntryB = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'B',
    });
    expect(responseEntryB.status).toBe(403);
    expect(responseEntryB.body.errorMessage).toBe('Ticket has no entries left');
    expect(responseEntryB.body.errorCode).toBe('EntryException');
  });
  it('Should create entry record, exit record at location A, and allow entry for location A (one time entry ticket, same day)', async () => {
    const responseEntry = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'A',
    });
    expect(responseEntry.status).toBe(201);
    expect(responseEntry.body.message).toBe('Record created');
    expect(responseEntry.body.ticketId).toBe(testId);
    const checkTicketEntries = await supertest(app).get(
      `/api/tickets/${testId}`
    );
    expect(checkTicketEntries.status).toBe(200);
    expect(checkTicketEntries.body.id).toBe(testId);
    expect(checkTicketEntries.body.entries).toBe(0);
    const responseExit = await supertest(app).post('/api/exit').send({
      ticketId: testId,
      location: 'A',
    });
    expect(responseExit.status).toBe(201);
    expect(responseExit.body.message).toBe('Record created');
    expect(responseExit.body.ticketId).toBe(testId);
    const responseEntrySecond = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'A',
    });
    expect(responseEntrySecond.status).toBe(201);
    expect(responseEntrySecond.body.message).toBe('Record created');
    expect(responseEntrySecond.body.ticketId).toBe(testId);
  });
  it('Should create entry record, exit record at location A, and not allow entry for location A (one time entry ticket, different day)', async () => {
    const responseEntry = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'A',
    });
    expect(responseEntry.status).toBe(201);
    expect(responseEntry.body.message).toBe('Record created');
    expect(responseEntry.body.ticketId).toBe(testId);
    const checkTicketEntries = await supertest(app).get(
      `/api/tickets/${testId}`
    );
    expect(checkTicketEntries.status).toBe(200);
    expect(checkTicketEntries.body.id).toBe(testId);
    expect(checkTicketEntries.body.entries).toBe(0);
    const responseExit = await supertest(app).post('/api/exit').send({
      ticketId: testId,
      location: 'A',
    });
    // Change system time to simulate passing of the days
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2069-01-01'));
    expect(responseExit.status).toBe(201);
    expect(responseExit.body.message).toBe('Record created');
    expect(responseExit.body.ticketId).toBe(testId);
    const responseEntrySecond = await supertest(app).post('/api/entry').send({
      ticketId: testId,
      location: 'A',
    });
    expect(responseEntrySecond.status).toBe(403);
    expect(responseEntrySecond.body.errorMessage).toBe(
      'Ticket has no entries left'
    );
    expect(responseEntrySecond.body.errorCode).toBe('EntryException');
    jest.useRealTimers();
  });
  it('Should create entry record, exit record at location A, and allow entry for location B (season pass ticket, same day)', async () => {
    const responseEntry = await supertest(app).post('/api/entry').send({
      ticketId: seasonPassId,
      location: 'A',
    });
    expect(responseEntry.status).toBe(201);
    expect(responseEntry.body.message).toBe('Record created');
    expect(responseEntry.body.ticketId).toBe(seasonPassId);
    const checkTicketEntries = await supertest(app).get(
      `/api/tickets/${seasonPassId}`
    );
    expect(checkTicketEntries.status).toBe(200);
    expect(checkTicketEntries.body.id).toBe(seasonPassId);
    expect(checkTicketEntries.body.entries).toBe(-1);
    const responseExit = await supertest(app).post('/api/exit').send({
      ticketId: seasonPassId,
      location: 'A',
    });
    expect(responseExit.status).toBe(201);
    expect(responseExit.body.message).toBe('Record created');
    expect(responseExit.body.ticketId).toBe(seasonPassId);
    const responseEntryB = await supertest(app).post('/api/entry').send({
      ticketId: seasonPassId,
      location: 'B',
    });
    expect(responseEntryB.status).toBe(201);
    expect(responseEntryB.body.message).toBe('Record created');
    expect(responseEntryB.body.ticketId).toBe(seasonPassId);
    const checkTicketEntriesAfter = await supertest(app).get(
      `/api/tickets/${seasonPassId}`
    );
    expect(checkTicketEntriesAfter.status).toBe(200);
    expect(checkTicketEntriesAfter.body.id).toBe(seasonPassId);
    expect(checkTicketEntriesAfter.body.entries).toBe(-1);
  });
  it('Should create entry record, exit record at location A, and allow entry for location B and reducing available entries by 2 (ten entries ticket, same day)', async () => {
    const responseEntry = await supertest(app).post('/api/entry').send({
      ticketId: tenEntriesPassId,
      location: 'A',
    });
    expect(responseEntry.status).toBe(201);
    expect(responseEntry.body.message).toBe('Record created');
    expect(responseEntry.body.ticketId).toBe(tenEntriesPassId);
    const checkTicketEntries = await supertest(app).get(
      `/api/tickets/${tenEntriesPassId}`
    );
    expect(checkTicketEntries.status).toBe(200);
    expect(checkTicketEntries.body.id).toBe(tenEntriesPassId);
    expect(checkTicketEntries.body.entries).toBe(9);
    const responseExit = await supertest(app).post('/api/exit').send({
      ticketId: tenEntriesPassId,
      location: 'A',
    });
    expect(responseExit.status).toBe(201);
    expect(responseExit.body.message).toBe('Record created');
    expect(responseExit.body.ticketId).toBe(tenEntriesPassId);
    const responseEntryB = await supertest(app).post('/api/entry').send({
      ticketId: tenEntriesPassId,
      location: 'B',
    });
    expect(responseEntryB.status).toBe(201);
    expect(responseEntryB.body.message).toBe('Record created');
    expect(responseEntryB.body.ticketId).toBe(tenEntriesPassId);
    const checkTicketEntriesAfter = await supertest(app).get(
      `/api/tickets/${tenEntriesPassId}`
    );
    expect(checkTicketEntriesAfter.status).toBe(200);
    expect(checkTicketEntriesAfter.body.id).toBe(tenEntriesPassId);
    expect(checkTicketEntriesAfter.body.entries).toBe(8);
  });
  it('Should create entry record, exit record at location A, and allow entry for location A (season pass ticket, different day)', async () => {
    const responseEntry = await supertest(app).post('/api/entry').send({
      ticketId: seasonPassId,
      location: 'A',
    });
    expect(responseEntry.status).toBe(201);
    expect(responseEntry.body.message).toBe('Record created');
    expect(responseEntry.body.ticketId).toBe(seasonPassId);
    const checkTicketEntries = await supertest(app).get(
      `/api/tickets/${seasonPassId}`
    );
    expect(checkTicketEntries.status).toBe(200);
    expect(checkTicketEntries.body.id).toBe(seasonPassId);
    expect(checkTicketEntries.body.entries).toBe(-1);
    const responseExit = await supertest(app).post('/api/exit').send({
      ticketId: seasonPassId,
      location: 'A',
    });
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2069-01-01'));
    expect(responseExit.status).toBe(201);
    expect(responseExit.body.message).toBe('Record created');
    expect(responseExit.body.ticketId).toBe(seasonPassId);
    const responseEntryB = await supertest(app).post('/api/entry').send({
      ticketId: seasonPassId,
      location: 'A',
    });
    expect(responseEntryB.status).toBe(201);
    expect(responseEntryB.body.message).toBe('Record created');
    expect(responseEntryB.body.ticketId).toBe(seasonPassId);
    const checkTicketEntriesAfter = await supertest(app).get(
      `/api/tickets/${seasonPassId}`
    );
    expect(checkTicketEntriesAfter.status).toBe(200);
    expect(checkTicketEntriesAfter.body.id).toBe(seasonPassId);
    expect(checkTicketEntriesAfter.body.entries).toBe(-1);
    jest.useRealTimers();
  });
  it('Should create entry record, exit record at location A, and allow entry for location A and reducing available entries by 2 (ten entries ticket, different day)', async () => {
    const responseEntry = await supertest(app).post('/api/entry').send({
      ticketId: tenEntriesPassId,
      location: 'A',
    });
    expect(responseEntry.status).toBe(201);
    expect(responseEntry.body.message).toBe('Record created');
    expect(responseEntry.body.ticketId).toBe(tenEntriesPassId);
    const checkTicketEntries = await supertest(app).get(
      `/api/tickets/${tenEntriesPassId}`
    );
    expect(checkTicketEntries.status).toBe(200);
    expect(checkTicketEntries.body.id).toBe(tenEntriesPassId);
    expect(checkTicketEntries.body.entries).toBe(9);
    const responseExit = await supertest(app).post('/api/exit').send({
      ticketId: tenEntriesPassId,
      location: 'A',
    });
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2069-01-01'));
    expect(responseExit.status).toBe(201);
    expect(responseExit.body.message).toBe('Record created');
    expect(responseExit.body.ticketId).toBe(tenEntriesPassId);
    const responseEntryB = await supertest(app).post('/api/entry').send({
      ticketId: tenEntriesPassId,
      location: 'A',
    });
    expect(responseEntryB.status).toBe(201);
    expect(responseEntryB.body.message).toBe('Record created');
    expect(responseEntryB.body.ticketId).toBe(tenEntriesPassId);
    const checkTicketEntriesAfter = await supertest(app).get(
      `/api/tickets/${tenEntriesPassId}`
    );
    expect(checkTicketEntriesAfter.status).toBe(200);
    expect(checkTicketEntriesAfter.body.id).toBe(tenEntriesPassId);
    expect(checkTicketEntriesAfter.body.entries).toBe(8);
    jest.useRealTimers();
  });
});
