import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { success, error } from '../utils/response.js';

const DATA_PATH = join(process.cwd(), 'data', 'payment-accounts.json');

const readAccounts = () => {
  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { accounts: [] };
  }
};

const writeAccounts = (data) => {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

export const getPaymentAccounts = (req, res) => {
  const data = readAccounts();
  return success(res, data.accounts, 'Payment accounts fetched');
};

export const savePaymentAccounts = (req, res) => {
  const { accounts } = req.body;
  if (!Array.isArray(accounts)) {
    return error(res, 'accounts must be an array', 400);
  }
  // Assign IDs to new accounts
  const stamped = accounts.map((a, i) => ({ ...a, id: a.id || String(Date.now() + i) }));
  writeAccounts({ accounts: stamped });
  return success(res, stamped, 'Payment accounts saved');
};
