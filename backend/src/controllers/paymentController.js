import prisma from '../config/prisma.js';
import { success, error } from '../utils/response.js';

/**
 * Fetch payments associated with a specific Booking
 */
export const getPaymentsByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { unit: { include: { property: true } } },
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Auth check
    const isOwner = booking.userId === req.user.id;
    const isAdmin = booking.unit.property.adminId === req.user.id;
    const isSuperAdmin = req.user.role === 'SUPERADMIN';

    if (!isOwner && !isAdmin && !isSuperAdmin) {
      return error(res, 'You are not authorized to view payments for this booking', 403);
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, payments, 'Payment history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Simulate or trigger Payment Gateway Transaction Creation (Midtrans Sandbox Simulator)
 */
export const createPaymentGatewayTransaction = async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;

    if (!bookingId || !method) {
      return error(res, 'Booking ID and payment method are required', 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Find latest PENDING payment
    const pendingPayment = booking.payments.find((p) => p.status === 'PENDING');
    if (!pendingPayment) {
      return error(res, 'No pending payments found for this booking.', 400);
    }

    // Mock Gateway response:
    // Generate simulated payment invoice details
    const simulatedInvoiceUrl = `/invoices/invoice-${pendingPayment.id}.pdf`;

    const updatedPayment = await prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        method,
        invoiceUrl: simulatedInvoiceUrl,
      },
    });

    return success(
      res, 
      {
        payment: updatedPayment,
        redirectUrl: `https://sandbox.midtrans.com/pay/kontrakanku-${pendingPayment.id}`, // simulated gateway redirect
        message: 'Simulated payment transaction generated. Complete it using the sandbox/manual confirm endpoint.'
      },
      'Payment transaction created successfully (Sandbox Simulation)'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Manually Confirm Bank Transfer Payments
 */
export const confirmManualPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            unit: true,
          },
        },
      },
    });

    if (!payment) {
      return error(res, 'Payment transaction not found', 404);
    }

    if (payment.status === 'PAID') {
      return error(res, 'This payment transaction is already paid', 400);
    }

    // Execute payment confirmation and booking state change inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark payment as PAID
      const updatedPay = await tx.payment.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          method: payment.method || 'MANUAL_BANK_TRANSFER',
        },
      });

      // 2. Set booking status to CONFIRMED / ACTIVE
      const updatedBook = await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'ACTIVE',
        },
      });

      // 3. Mark unit status as OCCUPIED
      await tx.unit.update({
        where: { id: payment.booking.unitId },
        data: {
          status: 'OCCUPIED',
        },
      });

      return { payment: updatedPay, booking: updatedBook };
    });

    // Create notifications for the user
    await prisma.notification.create({
      data: {
        userId: result.booking.userId,
        type: 'PAYMENT',
        title: 'Pembayaran Berhasil Dikonfirmasi',
        body: `Pembayaran sewa Anda sebesar Rp ${result.payment.amount.toLocaleString('id-ID')} telah dikonfirmasi. Status Booking: ACTIVE.`,
      },
    });

    return success(res, result, 'Manual payment successfully verified and booking activated.');
  } catch (err) {
    next(err);
  }
};

/**
 * System/Webhook: Simulated Payment Webhook from Midtrans/Xendit gateway
 */
export const paymentGatewayWebhook = async (req, res, next) => {
  try {
    // Basic secret verification — production harus pakai Midtrans HMAC signature
    const webhookSecret = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.WEBHOOK_SECRET || 'kontrakanku-webhook-secret-2026';
    if (webhookSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized webhook' });
    }

    const { transaction_status, order_id, payment_type } = req.body;

    // Simulated payload parsing. Assumes order_id contains the payment ID
    if (!order_id || !transaction_status) {
      return error(res, 'Simulated gateway request payload is incomplete', 400);
    }

    // In a real Midtrans setup, order_id is custom. Let's lookup payment directly
    const payment = await prisma.payment.findUnique({
      where: { id: order_id },
      include: { booking: true },
    });

    if (!payment) {
      return error(res, 'Transaction/Payment invoice matching order_id not found', 404);
    }

    let nextPaymentStatus = 'PENDING';
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      nextPaymentStatus = 'PAID';
    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      nextPaymentStatus = 'FAILED';
    }

    if (nextPaymentStatus === 'PAID') {
      const result = await prisma.$transaction(async (tx) => {
        const pay = await tx.payment.update({
          where: { id: order_id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            method: payment_type || 'GATEWAY',
          },
        });

        const book = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'ACTIVE',
          },
        });

        await tx.unit.update({
          where: { id: payment.booking.unitId },
          data: {
            status: 'OCCUPIED',
          },
        });

        return { pay, book };
      });

      // Notification
      await prisma.notification.create({
        data: {
          userId: result.book.userId,
          type: 'PAYMENT',
          title: 'Pembayaran Online Sukses',
          body: `Pembayaran online sewa Anda telah berhasil diverifikasi. Status Booking: ACTIVE.`,
        },
      });

      return success(res, result, 'Gateway Webhook: Payment settlement successful.');
    } else if (nextPaymentStatus === 'FAILED') {
      const updatedPay = await prisma.payment.update({
        where: { id: order_id },
        data: { status: 'FAILED' },
      });
      return success(res, updatedPay, 'Gateway Webhook: Transaction marked as FAILED.');
    }

    return success(res, null, `Gateway Webhook: Ignored status '${transaction_status}'`);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Monthly revenue stats (last 12 months)
 */
export const getMonthlyStats = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: { not: null },
      },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    // Group by year-month
    const map = {};
    for (const p of payments) {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + Number(p.amount);
    }

    // Build last 12 months (fill zeros for months with no data)
    const result = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      result.push({ month: key, label, total: map[key] || 0 });
    }

    const totalRevenue = Object.values(map).reduce((s, v) => s + v, 0);
    const paidCount = payments.length;

    return success(res, { monthly: result, totalRevenue, paidCount }, 'Monthly stats fetched');
  } catch (err) {
    next(err);
  }
};

