# Security, Privacy & Regulatory Compliance Assessment
**Document ID:** SEC-COMP-DHC-01  
**Project:** Daily Health Coach  
**Classification:** Enterprise Health Data Privacy & Governance  
**Compliance Standards:** India DPDP Act 2023, GDPR Health Data Regulations (Article 9), ISO/IEC 27701  

---

## 1. Health Data Protection Principles

Health telemetry (hydration, weight, biometric habits) is categorized as **Special Category Data** under GDPR Article 9 and sensitive personal data under the India DPDP Act 2023.

### 1.1 100% On-Device Isolation Guarantee
- All biometric and lifestyle metrics are processed, calculated, and stored strictly on the user's personal device by default.
- Zero health data is sold, monetized, profiled, or harvested by third-party data brokers.

### 1.2 Dedicated File Storage Privacy
- Storage operations are restricted exclusively to:
  `Internal Storage/Android/data/com.dailyhealthcoach.app/files/database_backup.json`
- Daily Health Coach **DOES NOT scan, read, access, or touch ANY other files, folders, photos, videos, contacts, or documents** on the device.

---

## 2. Permissions Audit & Transparency

| Permission | Category | Purpose & Justification | Transmission Scope |
| :--- | :---: | :--- | :--- |
| `android.permission.INTERNET` | Required | Delivers Google AdMob ads to maintain 100% free app access; enables optional Cloud Database backup. | Zero health logs transmitted over ad network. |
| `ACCESS_NETWORK_STATE` | Required | Monitors connection status to prevent failed network calls when offline. | Purely local OS state query. |
| `ACTIVITY_RECOGNITION` | Optional | Live pedometer step counting and active motion detection. | Strictly local sensor query. |
| `BODY_SENSORS` | Optional | Reads heart rate from connected smartwatches (Wear OS / Apple Watch). | Stored exclusively on local device. |

---

## 3. Regulatory Compliance Verification

- **India DPDP Act 2023 (Section 6 & 12):** Explicit consent modal prior to telemetry logging; instantaneous data wipe feature in settings.
- **GDPR Article 20 (Data Portability):** One-click export to standard `.json` format anytime via File Manager export.
- **GDPR Article 25 (Privacy by Default):** Complete offline functionality without mandatory cloud account registration.
