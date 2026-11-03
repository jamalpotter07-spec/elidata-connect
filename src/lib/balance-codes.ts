// USSD codes for checking a data balance. Shown only after an order is delivered
// (post-payment tracking page and the order list), never on browsing pages.
const CODES: Record<string, string> = {
  MTN: "*124#",
  Telecel: "*110#",
  AT: "*100#",
};

export function balanceCode(network: string): string {
  return CODES[network] ?? "*124#";
}
