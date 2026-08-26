# Security Policy

Security is a priority for BridgeX. Please report a suspected security defect privately and do not post proof-of-concept attacks, credentials, or real member data in public issues.

## Reporting a Vulnerability

If you discover a vulnerability, use the repository’s private security advisory/reporting channel when available or contact the maintainers through the verified project contact route. Include a minimal, redacted reproduction and the affected source path.

Do not disclose security issues publicly until they have been reviewed.

## Scope

Security reports may include

- Authentication vulnerabilities
- Authorization bypass
- SQL Injection
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Remote Code Execution
- Data Exposure
- API Security Issues

## Sensitive data

BridgeX stores user verification information.

The following data must always be protected:

- Passport
- National ID
- Student ID
- Email
- Phone Number
- Payment Information
- Passwords, API keys, OAuth client secrets, signing certificates, and service-role keys

## Security Principles

- Principle of Least Privilege
- Secure Authentication
- Encryption in Transit
- Encryption at Rest
- Regular Backups
- Audit Logging
- Role checks and row-level security remain authoritative even when an admin interface is hidden
