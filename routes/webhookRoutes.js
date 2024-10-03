import express from 'express';
import Order from '../models/orderModel.js';
import { Cashfree } from "cashfree-pg";

const router = express.Router();

router.post('/cashfree', async (req, res) => {
  try {
    console.log('Received webhook from Cashfree:', req.body);

    const { order_id, order_status } = req.body;

    // Verify the webhook signature
    const isValidSignature = Cashfree.VerifyWebhookSignature(
      JSON.stringify(req.body),
      req.headers['x-webhook-signature'],
      process.env.CASHFREE_SECRET_KEY
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const order = await Order.findById(order_id);

    if (!order) {
      console.error('Order not found:', order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order_status === 'PAID' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult.orderStatus = 'PAID';
      await order.save();
      console.log('Order marked as paid:', order_id);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;