// Mobigh data-bundle reseller adapter.
// Docs: https://mobigh.com/api/external/v1 (Bearer token auth)

export type FulfillInput = {
  network: "MTN" | "Telecel" | "AT";
  dataMb: number;
  recipient