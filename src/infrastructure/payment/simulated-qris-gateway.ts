import type { PaymentGateway } from "@/application/ports";
import type { Order } from "@/domain/types";

/**
 * Pengganti gateway untuk demo/dev. Gateway sungguhan (Xendit/Midtrans) cukup mengimplementasikan port yang sama
 * dan mengirim webhook bertanda tangan ke /api/webhooks/payment.
 */
export class SimulatedQrisGateway implements PaymentGateway {
  async createCharge(order: Order): Promise<{ gatewayRef: string; qrisPayload: string }> {
    const gatewayRef = `SIM-${order.id.slice(0, 8)}`;
    return { gatewayRef, qrisPayload: `QRIS-${gatewayRef}` };
  }
}
