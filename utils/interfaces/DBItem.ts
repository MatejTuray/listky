export default interface DBItem {
  PK: string;
  SK: string;
  owner?: string;
  type?: string;
  entries?: number;
  'GSI-1'?: string;
  'GSI-2'?: string;
}
