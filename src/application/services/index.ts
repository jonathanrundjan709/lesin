import type { Clock, IdGenerator, Notifier, PasswordHasher, PaymentGateway, SessionTokens, UnitOfWork, WebhookSigner } from "../ports";
import { AuthService } from "./auth-service";
import { BillingService } from "./billing-service";
import { JobsService } from "./jobs-service";
import { LeadService } from "./lead-service";
import { LessonService } from "./lesson-service";
import { RequestService } from "./request-service";
import { ReviewService } from "./review-service";
import { TrustService } from "./trust-service";
import { TutorService } from "./tutor-service";

/** Semua adapter yang dibutuhkan aplikasi. Diisi oleh composition root (produksi) atau tes. */
export interface Ports {
  uow: UnitOfWork; clock: Clock; ids: IdGenerator; hasher: PasswordHasher; tokens: SessionTokens;
  signer: WebhookSigner; gateway: PaymentGateway; notifier: Notifier; allowPaymentSimulation: boolean;
}

export function buildServices(p: Ports) {
  const base = { uow: p.uow, clock: p.clock, ids: p.ids };
  const billing = new BillingService({ ...base, gateway: p.gateway, signer: p.signer, allowSimulation: p.allowPaymentSimulation });
  const lessons = new LessonService({ ...base, notifier: p.notifier });
  return {
    auth: new AuthService({ ...base, hasher: p.hasher, tokens: p.tokens }),
    tutors: new TutorService(base),
    requests: new RequestService(base),
    leads: new LeadService(base),
    billing, lessons,
    reviews: new ReviewService(base),
    trust: new TrustService(base),
    jobs: new JobsService({ billing, lessons }),
  };
}
export type Services = ReturnType<typeof buildServices>;
