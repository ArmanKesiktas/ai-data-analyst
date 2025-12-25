# Quanty.studio Production Security Checklist

## Pre-Deployment Security Audit

Use this checklist before deploying Quanty.studio to production to ensure all security measures are properly configured.

---

## 🔐 Database Security

### PostgreSQL Configuration

- [ ] **PostgreSQL Version >= 12** (RLS support required)
  ```bash
  psql --version
  # Should show: PostgreSQL 12.x or higher
  ```

- [ ] **SSL/TLS Encryption Enabled**
  ```sql
  SHOW ssl;
  -- Should show: on
  ```

  Connection string should include `sslmode=require`:
  ```
  DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
  ```

- [ ] **Dedicated Application User Created** (NOT superuser)
  ```sql
  CREATE USER app_user WITH PASSWORD '<strong-random-password>';
  GRANT CONNECT ON DATABASE quanty_db TO app_user;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

  -- Verify user is NOT superuser
  SELECT usename, usesuper, usecreatedb FROM pg_user WHERE usename = 'app_user';
  -- usesuper should be 'f' (false)
  ```

- [ ] **RLS Enabled on All Tables**
  ```bash
  python backend/scripts/security_audit.py
  # Should pass all RLS checks
  ```

- [ ] **RLS Policies Verified**
  ```sql
  -- Check all policies exist
  SELECT schemaname, tablename, policyname, cmd
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
  ```

- [ ] **Database Backups Configured**
  - [ ] Automated daily backups enabled
  - [ ] Backup retention: minimum 30 days
  - [ ] Backups encrypted at rest
  - [ ] Backup restoration tested within last 30 days

- [ ] **Database Network Isolation**
  - [ ] Database NOT accessible from public internet
  - [ ] Only application servers whitelisted
  - [ ] VPC/private network configured
  - [ ] Firewall rules verified

- [ ] **Database Audit Logging Enabled**
  ```sql
  ALTER SYSTEM SET log_statement = 'mod';  -- Log modifications
  ALTER SYSTEM SET log_connections = 'on';
  ALTER SYSTEM SET log_disconnections = 'on';
  SELECT pg_reload_conf();
  ```

### Schema Validation

- [ ] **All Foreign Keys Have ON DELETE CASCADE/SET NULL**
  ```sql
  SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
  JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY';
  ```

- [ ] **Critical Indexes Exist** (performance + security)
  ```sql
  -- Verify workspace_members indexes
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'workspace_members';
  -- Should include: idx_workspace_members_user, idx_workspace_members_workspace
  ```

- [ ] **Unique Constraints Validated**
  - `users.email` - UNIQUE
  - `workspaces.slug` - UNIQUE
  - `workspace_members(workspace_id, user_id)` - UNIQUE

---

## 🔑 Authentication & Authorization

### JWT Configuration

- [ ] **Strong JWT Secret Key** (minimum 256 bits)
  ```bash
  # Generate new secret
  python -c "import secrets; print(secrets.token_urlsafe(32))"

  # Set in environment
  export JWT_SECRET_KEY="<generated-secret>"
  ```

- [ ] **JWT Algorithm = HS256 or RS256**
  ```bash
  echo $JWT_ALGORITHM
  # Should be: HS256 (or RS256 for asymmetric signing)
  ```

- [ ] **JWT Expiration Configured** (recommended: 24 hours)
  ```bash
  echo $JWT_EXPIRATION_HOURS
  # Should be: 24 (or less for high-security)
  ```

- [ ] **Password Hashing = bcrypt** (cost factor >= 12)
  ```python
  # Verify in code
  from passlib.context import CryptContext
  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
  # Cost factor: 12 or higher
  ```

### Access Control Testing

- [ ] **Workspace Isolation Tested**
  ```bash
  pytest backend/tests/test_security_boundaries.py::TestWorkspaceIsolation -v
  ```

- [ ] **Role-Based Permissions Tested**
  ```bash
  pytest backend/tests/test_security_boundaries.py::TestRoleBasedPermissions -v
  ```

- [ ] **Personal Workspace Protection Tested**
  ```bash
  pytest backend/tests/test_security_boundaries.py::TestPersonalWorkspaceProtection -v
  ```

---

## 🌐 API Security

### HTTPS & TLS

- [ ] **HTTPS Enforced** (no HTTP allowed)
  ```python
  # Add to main.py
  from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
  app.add_middleware(HTTPSRedirectMiddleware)
  ```

- [ ] **TLS Certificate Valid** (not self-signed in production)
  ```bash
  curl -vI https://api.quanty.studio 2>&1 | grep "SSL certificate verify ok"
  ```

- [ ] **TLS Version >= 1.2**
  ```bash
  nmap --script ssl-enum-ciphers -p 443 api.quanty.studio
  # Should NOT show TLSv1.0 or TLSv1.1
  ```

### CORS Configuration

- [ ] **CORS Origins Restricted** (NO wildcard "*" in production)
  ```python
  # main.py - PRODUCTION CONFIG
  app.add_middleware(
      CORSMiddleware,
      allow_origins=[
          "https://quanty.studio",
          "https://app.quanty.studio"
      ],  # NO "*" wildcard!
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
      allow_headers=["Authorization", "Content-Type"],
  )
  ```

### Security Headers

- [ ] **Security Headers Configured**
  ```python
  @app.middleware("http")
  async def add_security_headers(request: Request, call_next):
      response = await call_next(request)
      response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
      response.headers["X-Content-Type-Options"] = "nosniff"
      response.headers["X-Frame-Options"] = "DENY"
      response.headers["X-XSS-Protection"] = "1; mode=block"
      response.headers["Content-Security-Policy"] = "default-src 'self'"
      return response
  ```

- [ ] **Verify Headers in Production**
  ```bash
  curl -I https://api.quanty.studio | grep -E "(Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options)"
  ```

### Rate Limiting

- [ ] **Rate Limiting Enabled**
  ```python
  from slowapi import Limiter
  from slowapi.util import get_remote_address

  limiter = Limiter(key_func=get_remote_address)

  @app.post("/api/auth/login")
  @limiter.limit("5/minute")  # Max 5 login attempts per minute
  async def login(...):
      ...
  ```

- [ ] **Rate Limits Configured**
  - Login endpoint: 5 requests/minute
  - Registration: 3 requests/hour
  - API endpoints: 100 requests/minute (authenticated)
  - File uploads: 10 requests/hour

### Input Validation

- [ ] **Pydantic Models for All Requests**
  ```python
  # All API endpoints should use validated models
  @app.post("/api/workspaces/{workspace_id}/tables")
  async def create_table(request: CreateTableRequest):  # ✓ Validated
      ...
  ```

- [ ] **SQL Injection Prevention** (parameterized queries only)
  ```python
  # GOOD - Parameterized
  db.execute(text("SELECT * FROM users WHERE id = :user_id"), {"user_id": user_id})

  # BAD - String interpolation (DO NOT USE)
  # db.execute(f"SELECT * FROM users WHERE id = '{user_id}'")
  ```

- [ ] **XSS Prevention** (output encoding)
  - All user-generated content sanitized before display
  - JSON responses properly escaped

---

## 🚨 Monitoring & Logging

### Application Logging

- [ ] **Structured Logging Configured**
  ```python
  import logging
  import json

  logger = logging.getLogger("quanty")
  logger.setLevel(logging.INFO)

  # Log security events
  logger.info(json.dumps({
      "event": "workspace_access",
      "user_id": user_id,
      "workspace_id": workspace_id,
      "role": role,
      "timestamp": datetime.utcnow().isoformat()
  }))
  ```

- [ ] **Security Events Logged**
  - Failed login attempts
  - Workspace access violations (403 errors)
  - Role escalation attempts
  - Personal workspace deletion attempts
  - Member management changes

### Alerting

- [ ] **Failed Authentication Alerts**
  - Threshold: >10 failed logins from same IP in 5 minutes
  - Action: Alert security team + temporary IP block

- [ ] **Workspace Access Violation Alerts**
  - Threshold: >5 403 errors from same user in 1 minute
  - Action: Alert security team + investigate account

- [ ] **Database Performance Monitoring**
  - Slow query alerts (>1 second)
  - RLS policy performance tracking
  - Connection pool exhaustion alerts

### Error Handling

- [ ] **Generic Error Messages** (no information disclosure)
  ```python
  # GOOD
  raise HTTPException(status_code=404, detail="Resource not found")

  # BAD - Leaks information
  # raise HTTPException(status_code=404, detail=f"Workspace {workspace_id} not found for user {user_id}")
  ```

- [ ] **Error Stack Traces Hidden in Production**
  ```python
  # main.py
  if os.getenv("ENVIRONMENT") == "production":
      app.debug = False
  ```

---

## 🔒 Secrets Management

### Environment Variables

- [ ] **Secrets NOT in Code**
  ```bash
  # Verify no hardcoded secrets
  grep -r "SECRET_KEY\s*=\s*['\"]" backend/
  # Should return no results
  ```

- [ ] **Environment Variables Set**
  ```bash
  # Production environment
  export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
  export JWT_SECRET_KEY="<256-bit-secret>"
  export JWT_ALGORITHM="HS256"
  export JWT_EXPIRATION_HOURS="24"
  export ENVIRONMENT="production"
  ```

- [ ] **.env File NOT Committed**
  ```bash
  git ls-files | grep "\.env$"
  # Should return no results

  # Verify .gitignore
  cat .gitignore | grep "\.env"
  # Should show: .env
  ```

### Secrets Rotation

- [ ] **Secrets Rotation Policy Documented**
  - JWT secret: Rotate every 90 days
  - Database password: Rotate every 90 days
  - API keys: Rotate every 30 days

- [ ] **Secrets Management Service** (recommended)
  - [ ] AWS Secrets Manager
  - [ ] HashiCorp Vault
  - [ ] Google Secret Manager
  - [ ] Azure Key Vault

---

## 📦 Deployment Security

### Infrastructure

- [ ] **Application NOT Running as Root**
  ```bash
  ps aux | grep uvicorn
  # Should NOT show root user
  ```

- [ ] **Firewall Configured**
  - Only ports 80 (HTTP redirect), 443 (HTTPS), 22 (SSH with key auth) open
  - Database port (5432) NOT publicly accessible

- [ ] **SSH Key-Based Authentication Only**
  ```bash
  # /etc/ssh/sshd_config
  PasswordAuthentication no
  PubkeyAuthentication yes
  PermitRootLogin no
  ```

- [ ] **Automatic Security Updates Enabled**
  ```bash
  # Ubuntu/Debian
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

### Dependency Security

- [ ] **Dependencies Up-to-Date**
  ```bash
  pip list --outdated
  # Review and update dependencies
  ```

- [ ] **Security Vulnerabilities Scanned**
  ```bash
  pip install pip-audit
  pip-audit
  # Should show no vulnerabilities
  ```

- [ ] **Dependency Pinning**
  ```bash
  # requirements.txt should have exact versions
  cat backend/requirements.txt | grep "=="
  # All dependencies should have pinned versions
  ```

### Docker Security (if applicable)

- [ ] **Non-Root User in Container**
  ```dockerfile
  # Dockerfile
  RUN useradd -m -u 1000 app
  USER app
  ```

- [ ] **Minimal Base Image**
  ```dockerfile
  FROM python:3.11-slim  # NOT python:3.11
  ```

- [ ] **No Secrets in Docker Image**
  ```bash
  # Verify no secrets in Dockerfile or docker-compose.yml
  grep -i "password\|secret\|key" Dockerfile docker-compose.yml
  ```

---

## 🧪 Security Testing

### Pre-Deployment Tests

- [ ] **All Security Tests Passing**
  ```bash
  pytest backend/tests/test_security_boundaries.py -v
  # All tests should PASS
  ```

- [ ] **Workspace Isolation Verified**
  - User A cannot access User B's workspaces ✓
  - User A cannot see User B's tables ✓
  - Shared workspace access works correctly ✓

- [ ] **Role Permissions Verified**
  - Viewer cannot create/edit tables ✓
  - Editor can create/edit but not delete ✓
  - Owner has full control ✓

- [ ] **SQL Injection Tests Passing**
  ```bash
  pytest backend/tests/test_security_boundaries.py::TestSQLInjectionProtection -v
  ```

### Penetration Testing

- [ ] **Manual Security Testing**
  - [ ] Attempt to access other users' workspaces (should fail)
  - [ ] Attempt to escalate viewer to owner (should fail)
  - [ ] Attempt to delete personal workspace (should fail)
  - [ ] Attempt SQL injection in table names (should be blocked)
  - [ ] Attempt to bypass RLS (should fail)

- [ ] **Automated Security Scan**
  ```bash
  # Run OWASP ZAP or similar
  docker run -t owasp/zap2docker-stable zap-baseline.py -t https://api.quanty.studio
  ```

---

## 📋 Compliance & Documentation

### Documentation

- [ ] **Security Architecture Documented**
  - See: `SECURITY_ARCHITECTURE.md`

- [ ] **Incident Response Plan**
  - Security contacts defined
  - Escalation procedures documented
  - Breach notification process defined

- [ ] **Data Retention Policy**
  - Query history retention: 90 days
  - Audit logs retention: 1 year
  - User data deletion process documented

### Privacy

- [ ] **Privacy Policy Published**
  - GDPR compliance (if applicable)
  - CCPA compliance (if applicable)
  - Data processing agreements

- [ ] **Data Export Functionality**
  - Users can export their workspace data
  - GDPR "right to data portability" support

- [ ] **Data Deletion Functionality**
  - Users can delete their account
  - GDPR "right to be forgotten" support
  - Cascade deletes properly configured

---

## ✅ Final Verification

### Pre-Launch Checklist

- [ ] **Run Security Audit Script**
  ```bash
  DATABASE_URL="postgresql://..." python backend/scripts/security_audit.py
  # Should show: AUDIT PASSED
  ```

- [ ] **Review All Checklist Items**
  - All critical items (🔐 Database, 🔑 Auth, 🌐 API) = 100% complete
  - All monitoring items (🚨) = 100% complete
  - All deployment items (📦) = 100% complete

- [ ] **Security Team Sign-Off**
  - [ ] Security architect reviewed architecture
  - [ ] DevOps reviewed infrastructure
  - [ ] Lead developer reviewed code

- [ ] **Staged Deployment Tested**
  - [ ] Staging environment matches production
  - [ ] All tests pass in staging
  - [ ] Load testing completed

### Post-Deployment

- [ ] **Monitoring Active**
  - [ ] Security alerts configured
  - [ ] Error tracking enabled (Sentry/Rollbar)
  - [ ] Performance monitoring (New Relic/Datadog)

- [ ] **Backups Verified**
  - [ ] First backup completed successfully
  - [ ] Backup restoration tested

- [ ] **Security Scan Scheduled**
  - [ ] Weekly vulnerability scans scheduled
  - [ ] Monthly penetration testing scheduled
  - [ ] Quarterly security audit scheduled

---

## 🆘 Incident Response

If a security breach is suspected:

1. **Immediate Actions**
   - Notify security team immediately
   - Do NOT delete logs or evidence
   - Document all actions taken

2. **Investigation**
   - Review audit logs: `SELECT * FROM query_history WHERE created_at > NOW() - INTERVAL '24 hours'`
   - Check for unauthorized workspace access
   - Verify RLS policies still active

3. **Containment**
   - Rotate JWT secret key (invalidates all tokens)
   - Temporarily disable affected accounts
   - Review and update firewall rules

4. **Recovery**
   - Restore from backup if needed
   - Force password resets for affected users
   - Document lessons learned

---

## 📞 Security Contacts

- Security Lead: [security@quanty.studio]
- DevOps Lead: [devops@quanty.studio]
- Incident Response: [incident@quanty.studio]

**For critical security issues, contact all three immediately.**

---

## 📝 Version History

| Date       | Version | Changes                          |
|------------|---------|----------------------------------|
| 2025-12-25 | 1.0     | Initial production checklist     |

---

**Last Updated**: 2025-12-25
**Next Review**: 2026-03-25 (Quarterly)
