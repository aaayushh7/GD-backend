import { Cashfree } from "cashfree-pg";

const cashfree = new Cashfree({
  env: process.env.CASHFREE_ENV === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX',
  apiVersion: '2022-09-01',
  appId: process.env.CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY 
});

export default cashfree;