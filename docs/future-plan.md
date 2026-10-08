# Nikharta Roop — Future-Proof Evolution Plan

Final review ke baad ka plan: **marketplace banna hai, aur aise banna hai ki future me bade changes na karne pade.**

## Golden Rules (jo future ka dard bachaayenge)

1. **Booleans mat use karo — enums use karo.** `isVerified: Boolean` ❌ → `verificationStatus: PENDING | VERIFIED | REJECTED | SUSPENDED` ✅. Naya state aayega to enum me add hoga, data migrate nahi karna padega.
2. **Additive migrations only.** Naya column/table add karo, purana kabhi repurpose/rename mat karo. Purana data hamesha valid rahega.
3. **Paisa hamesha `Decimal` + currency snapshot.** Rounding bugs future me pata chalte hai.
4. **Monetization ko config banao, code nahi.** Plan features ek `Plan` table se aaye — "Pro me packages on/off" change karna ho to DB row update, deployment nahi.
5. **Catalog ko DATA banao, code nahi.** Naya service/package template = ek DB row (seed), not a code change. Isliye `CatalogTemplate` table.
6. **Payments provider-agnostic rakho.** `gatewayRef` pattern pehle se hai — Razorpay ↔ Stripe swap bina schema change ke.
7. **Har cheez soft-delete + AuditLog.** Trust aur debugging dono.
8. **Slug-based refs pehle se hai — kabhi IDs expose mat karo** (chains/multi-branch bhi aasani se add honge).

## Phase A — Marketplace launch ke liye (abhi karo)

> ✅ **IMPLEMENTED** — branch `phase-a-marketplace-schema`, migration `20261008041933_phase_a_marketplace_schema`. Schema + migration + seed (13 catalog templates) ready. Service-layer APIs abhi banana baaki hai.

### 1. Salon verification + trust
```prisma
enum SalonVerificationStatus { PENDING VERIFIED REJECTED SUSPENDED }

model SalonVerification {
  id          String  @id @default(dbgenerated("(encode(gen_random_bytes(24), 'hex'::text))"))
  salonId     String  @unique
  salon       Salon   @relation(fields: [salonId], references: [id])
  status      SalonVerificationStatus @default(PENDING)
  documents   Json?           // KYC docs (pan, shop license, photos)
  submittedAt DateTime?
  reviewedAt  DateTime?
  reviewedBy  String?         // admin userId
  reason      String?         // rejection reason
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
`Salon.isActive` tabhi true jab `VERIFIED` — homepage ka "Verified salons" claim ab sach hoga.

### 2. Catalog templates (tumhara "activate" idea)
```prisma
model CatalogTemplate {
  id          String    @id @default(dbgenerated("(encode(gen_random_bytes(24), 'hex'::text))"))
  kind        String    // "SERVICE" | "PACKAGE"
  categoryId  String?   // ServiceCategory link
  name        String
  description String?
  icon        String?
  isActive    Boolean   @default(true)   // platform side on/off
  sortOrder   Int       @default(0)
}

model SalonTemplate {
  id         String  @id @default(dbgenerated("(encode(gen_random_bytes(24), 'hex'::text))"))
  salonId    String
  templateId String
  price      Decimal @db.Decimal(12, 2)
  isActive   Boolean @default(true)      // salon ne activate kiya ya nahi
  @@unique([salonId, templateId])
}
```
Naya service launch karna = ek seed row. Salon ke liye activate = ek row. **5-minute onboarding.**

### 3. Packages / Combos (bada revenue)
```prisma
model Package {
  id          String   @id @default(dbgenerated("(encode(gen_random_bytes(24), 'hex'::text))"))
  salonId     String
  salon       Salon    @relation(fields: [salonId], references: [id])
  name        String   // "Bridal Royal Package"
  slug        String
  price       Decimal  @db.Decimal(12, 2)
  duration    Int      // minutes
  isActive    Boolean  @default(true)
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([salonId, slug])
}

model PackageService {
  packageId String
  serviceId String
  @@id([packageId, serviceId])
}
```

### 4. Salon ke apne offers
```prisma
// Coupon me optional salonId add karo:
model Coupon {
  // ...existing...
  salonId String?   // null = platform-wide coupon
  salon   Salon?    @relation(fields: [salonId], references: [id])
  @@index([salonId, isActive])
}
```

### 5. Payments: split + payouts (commission model ka base)
```prisma
enum PaymentTxnType { ADVANCE FINAL REFUND PAYOUT }

model PaymentTransaction {
  id             String        @id @default(dbgenerated("(encode(gen_random_bytes(24), 'hex'::text))"))
  appointmentId  String
  type           PaymentTxnType
  amount         Decimal       @db.Decimal(12, 2)
  commission     Decimal       @default(0) @db.Decimal(12, 2)  // platform cut
  method         PaymentMethod
  gatewayRef     String?
  idempotencyKey String        @unique  // retry-safe — future me critical
  createdAt      DateTime      @default(now())
  @@index([appointmentId])
}

model Payout {
  id        String   @id @default(dbgenerated("(encode(gen_random_bytes(24), 'hex'::text))"))
  salonId   String
  period    String   // "2026-10"
  amount    Decimal  @db.Decimal(12, 2)
  status    String   // PENDING PROCESSED FAILED
  processedAt DateTime?
  @@index([salonId, status])
}
```
Advance (token) + baaki paisa, refunds, commission settlement — sab future-proof. **Idempotency key abhi daalo** — payment double-charge bugs future me sabse mehenge padte hai.

### 6. Salon settings (buffer time etc. — bina schema change ke naye rules)
```prisma
model SalonSettings {
  salonId                String  @id
  bufferMinutes          Int     @default(10)   // appointments ke beech gap
  advanceBookingDays     Int     @default(30)
  cancellationWindowHours Int    @default(4)
  noShowFee              Decimal? @db.Decimal(12, 2)
  acceptsAdvancePayments Boolean @default(true)
  walkInsAllowed         Boolean @default(true)
}
```

### 7. Customer notes (staff POV)
```prisma
model CustomerNote {
  id         String   @id @default(dbgenerated("(encode(gen_random_bytes(24), 'hex'::text))"))
  customerId String
  salonId    String
  note       String
  createdBy  String   // staff userId
  createdAt  DateTime @default(now())
  @@index([customerId, salonId])
}
```

## Phase B — Growth ke liye (50+ salons ke baad)

| Kya | Kyun |
| --- | --- |
| `SalonGroup` (chain) + `Salon.groupId?` | Multi-branch — shared services, ek dashboard |
| `StaffCommission` (staffId, serviceId?, percent) | Staff ko per-service commission — retention |
| `StockMovement` ledger + `Product.costPrice` | Inventory real banane ke liye |
| `Waitlist` | Full salon pe queue |
| `Subscription` + `Plan` tables | Pro/Elite plans ka engine — plan change = DB row |
| `Invoice` + `Salon.gstin` | Billing/GST jab payments live ho |

## Code-level improvements (business ke sath chahiye)

1. **Activation/catalog module** — `CatalogTemplate` seed + activate APIs
2. **Verification workflow** — admin approval dashboard
3. **Payment split + payout ledger** — manual bhi chalega pehle, idempotency zaroor
4. **Buffer time booking rule** — `SalonSettings.bufferMinutes` se slots
5. **City landing pages** (`/salons/{city}`) — "all over India" growth ka asli engine SEO hai — abhi se structure ready rakho
6. **Tests for money math** — package price, commission, discount stacking — ye kabhi guess mat karo

## Abhi mat banao (waste hoga)

- Recurring bookings, full payroll, AI features pe zyada time, custom website builder, chat between customer-staff — baad me jab maang aaye

## Bottom line

**Abhi ka focus:** Supply (free listing + activation) → Trust (verification) → Money (split payments + commission) → SEO (city pages).
Jo bhi banao, **"add, don't change"** rule follow karo — future me kuch bhi badalna ho to sirf naya table/column add hoga, purana data kabhi tootega nahi.
