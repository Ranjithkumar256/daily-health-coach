# Disaster Recovery & Business Continuity Plan (DRP/BCP)
**Document ID:** DRP-BCP-DHC-01  
**Project:** Daily Health Coach  
**Scope:** Wellness Telemetry Resilience & Data Loss Prevention  
**Target Metrics:** Recovery Point Objective (RPO) = 0 sec; Recovery Time Objective (RTO) < 5 min  

---

## 1. Business Impact Analysis & Recovery Objectives

| Objective | Target Threshold | Architecture Solution |
| :--- | :---: | :--- |
| **Recovery Point Objective (RPO)** | **0 seconds** | Synchronous client storage commits. |
| **Recovery Time Objective (RTO)** | **< 5 minutes** | Auto-restart container policy; zero-click mobile reinstall auto-sync. |
| **Data Retention Guarantee** | **100% Survival** | Dual-tier mirroring (`Android/data` + `Documents/`). |

---

## 2. Disaster Recovery Playbooks

### Playbook A: Mobile Device Reinstall or Storage Wipe
- **Symptom:** App was uninstalled and reinstalled on same device.
- **Automated Recovery:**
  - On first launch, `syncFromDatabaseFileOnStartup()` locates `Android/data/com.dailyhealthcoach.app/files/database_backup.json` or `Documents/database_backup.json`.
  - All water logs, habit streaks, and weight history are automatically restored without user clicks.

### Playbook B: Malformed External JSON File Edit
- **Symptom:** User manually edited JSON file and introduced syntax errors.
- **Automated Protection:**
  - `JSON.parse` is guarded with error boundaries.
  - If parsing fails, active data remains intact and a toast error notifies the user.
