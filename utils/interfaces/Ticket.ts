import { TicketType } from '../enums';
import Record from './Record';

export default interface Ticket {
  id: string;
  createdAt: number;
  owner: string;
  type: string;
  entries?: number;
  records: Array<Record>;
  qrCode: string;
}
