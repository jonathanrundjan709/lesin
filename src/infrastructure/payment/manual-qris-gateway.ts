import type { PaymentGateway } from "@/application/ports";
import type { Order } from "@/domain/types";

/**
 * Pembayaran manual lewat QRIS statis (gambar QR milik LesIn). Tidak ada tagihan dinamis dan tidak ada webhook:
 * pembeli membayar nominal persis (ada kode unik di belakang), lalu admin mencocokkannya dengan mutasi dan mengonfirmasi.
 * `qrisPayload` berisi alamat gambar QR.
 */
export class ManualQrisGateway implements PaymentGateway {
  constructor(private qrImageUrl: string) {}

  async createCharge(order: Order): Promise<{ gatewayRef: string; qrisPayload: string }> {
    return { gatewayRef: `MANUAL-${order.id.slice(0, 8)}`, qrisPayload: this.qrImageUrl };
  }
}
