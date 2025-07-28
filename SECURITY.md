# Security Policy

## Supported Versions

This portfolio website is actively maintained. Security updates are applied to the latest version.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** open a public issue for security vulnerabilities
2. Email security reports to: **frank@palmisano.io**
3. Include detailed information about the vulnerability:
   - Description of the issue
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Assessment**: Within 1 week
- **Fix Timeline**: Varies by severity (1-30 days)
- **Disclosure**: After fix is deployed and verified

### Security Measures

This portfolio implements several security measures:

- **Bot Protection**: Server-side validation for API endpoints
- **Input Validation**: All user inputs are validated and sanitized
- **XSS Protection**: Proper output encoding and security headers
- **Environment Security**: Secrets are never exposed to client-side code
- **Dependency Security**: Regular security audits and updates

### Security Best Practices

When contributing to this project:

1. **Never commit secrets** (API keys, passwords, etc.)
2. **Validate all inputs** at API boundaries
3. **Use CLI tools** for configuration when available
4. **Follow principle of least privilege**
5. **Keep dependencies updated**
6. **Test security features** before deployment

### Environment Variables

| Type | Description | Client Exposure |
|------|-------------|----------------|
| `NODE_ENV` | Build environment | Safe |
| `VERCEL_*` | Vercel platform variables | Safe |
| Private keys/tokens | **Never expose to client** | ❌ Dangerous |

### Contact

For non-security issues, please use the GitHub issue tracker.

For security-related concerns: **frank@palmisano.io**

---

*Last updated: January 2025*