import fs from 'fs'
import path from 'path';
import { rl } from '../menu/menu';
import { balances, gather, init, sell_buy, token_holders, token_launch } from '..';

// dotenv.config()
const today: string = new Date().toISOString().split('T')[0];

// Define the path for the 'logs' folder
const logsFolderPath: string = path.join(__dirname, 'logs');

// Check if the 'logs' folder exists; if not, create it
if (!fs.existsSync(logsFolderPath)) {
  fs.mkdirSync(logsFolderPath);
}

// Define the log file name as the current date (e.g., '2024-11-26.txt')
const logFileName: string = `${today}.txt`;
const logFilePath: string = path.join(logsFolderPath, logFileName);

// Function to append logs to the log file
export function logToFile(message: string): void {
  const timestamp: string = new Date().toISOString();
  const logMessage: string = `[${timestamp}] ${message}\n`;

  console.log(message)

  // Append the message to the log file
  fs.appendFile(logFilePath, logMessage, (err: NodeJS.ErrnoException | null) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
}

export const initWaiting = () => {
  rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
    init()
  })
}

export const tokenLaunchWaiting = () => {
  rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
    token_launch()
  })
}

export const tokenHoldersWaiting = () => {
  rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
    token_holders()
  })
}

export const sellBuyWaiting = () => {
  rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
    sell_buy()
  })
}

export const gatherWaiting = () => {
  rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
    gather()
  })
}

export const balancesWaiting = () => {
  rl.question('\x1b[32mpress Enter key to continue\x1b[0m', (answer: string) => {
    balances()
  })
}