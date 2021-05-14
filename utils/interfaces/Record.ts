import { EntryType } from '../enums';

export default interface Record {
  id: string;
  location: string;
  recordType: EntryType[0] | EntryType[1];
  timestamp: number;
}
