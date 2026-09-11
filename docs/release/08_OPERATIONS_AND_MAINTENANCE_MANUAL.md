# Operations & Maintenance Manual (Standard Operating Procedure)
**Document ID:** OPS-SOP-DHC-01  
**Project:** Daily Health Coach  
**Audience:** Site Reliability Engineering (SRE), Cloud Operations, L1/L2 Application Support  

---

## 1. System Health Monitoring & Diagnostics

### 1.1 Container Status Check
```bash
docker ps -f name=daily-health-coach-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 1.2 Health Endpoint Inspection
```bash
curl -i http://localhost:8001/health
```
Response:
```json
{
  "status": "healthy",
  "service": "daily-health-coach",
  "version": "1.2.0"
}
```

### 1.3 Cloud Backup Endpoint Verification
```bash
curl -i http://localhost:8001/api/cloud-backup
```

---

## 2. Routine Maintenance Procedures

### Daily Checklist
- [ ] Inspect container health: `docker inspect --format='{{json .State.Health}}' daily-health-coach-app`.
- [ ] Check host storage: `df -h /`.

### Weekly Checklist
- [ ] Backup SQLite database:
  ```bash
  docker exec daily-health-coach-app sqlite3 /app/health_coach.db ".backup '/app/data/health_weekly_$(date +%F).db'"
  ```

### Monthly Checklist
- [ ] Run automated scenario regression suite:
  ```bash
  node /home/ranjith/.gemini/antigravity-ide/scratch/expenditure-monitor/test_all_scenarios_comprehensive.mjs
  ```

---

## 3. Incident Escalation & Support Matrix

| Support Level | Role | Responsibilities | SLA Response Time |
| :--- | :--- | :--- | :---: |
| **Level 1 (L1)** | Help Desk Support | User queries, habit streak recovery assistance. | < 15 minutes |
| **Level 2 (L2)** | Application Operations | Container restarts, cloud backup restores. | < 30 minutes |
| **Level 3 (L3)** | Core Engineering & Architecture | Native Android crashes, sensor sync issues. | < 1 hour |
