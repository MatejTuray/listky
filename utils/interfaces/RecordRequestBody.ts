import { TicketType } from '../enums';

export default interface CreateRecordRequestBody {
  ticketId: string;
  location: string;
}
