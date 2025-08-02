# Operations Playbook

## Overview

This playbook contains standard operating procedures for the day-to-day management of the portfolio image optimization system. It covers routine maintenance, monitoring, troubleshooting, and optimization tasks.

## Daily Operations

### Morning Health Check (10 minutes)

#### System Status Review
```bash
# Check overall system health
curl -s https://frankpalmisano.com/api/health | jq .

# Verify all services are running
doctl apps get $DO_PRODUCTION_APP_ID --format Name,LiveURL,Phase

# Check recent deployments
doctl apps list-deployments $DO_PRODUCTION_APP_ID | head -3
```

#### Monitoring Dashboard Review
1. **Open Grafana Dashboard**: Portfolio Overview
2. **Check Key Metrics** (last 24 hours):
   - Service availability (should be 99.9%+)
   - Response times (P95 < 2 seconds)
   - Error rates (< 1%)
   - Resource utilization (< 80%)

#### Log Review
```bash
# Check for errors in the last 24 hours
doctl apps logs $DO_PRODUCTION_APP_ID --type=run | grep -i error | tail -20

# Check for high traffic or unusual patterns
doctl apps logs $DO_PRODUCTION_APP_ID --type=run | grep -E "(429|5[0-9]{2})" | tail -10
```

#### Action Items Checklist
- [ ] All services healthy and responsive
- [ ] No critical errors in logs
- [ ] Resource usage within normal ranges
- [ ] No pending alerts in monitoring system
- [ ] Backup jobs completed successfully

### Performance Monitoring

#### Key Performance Indicators (KPIs)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Availability | 99.9% | < 99.5% | < 99% |
| Response Time (P95) | < 1s | > 2s | > 5s |
| Error Rate | < 0.1% | > 1% | > 5% |
| Image Processing Success | > 99% | < 98% | < 95% |
| Cache Hit Rate | > 90% | < 80% | < 70% |

#### Performance Check Commands
```bash
# Response time check
time curl -s https://frankpalmisano.com > /dev/null

# Image optimization test
curl -X POST -F "image=@test-images/sample.jpg" \
  https://frankpalmisano.com/api/image/optimize \
  -w "Time: %{time_total}s\n"

# Cache performance
redis-cli -u $REDIS_URL info stats | grep -E "(hits|misses)"
```

## Weekly Operations

### System Maintenance (30 minutes)

#### Deployment Review
```bash
# Review deployments from the past week
doctl apps list-deployments $DO_PRODUCTION_APP_ID | head -10

# Check for any failed deployments
doctl apps list-deployments $DO_PRODUCTION_APP_ID --format ID,Phase,CreatedAt | grep -v ACTIVE
```

#### Resource Optimization
1. **Check Resource Usage Trends**:
   - CPU utilization patterns
   - Memory usage growth
   - Storage consumption
   - Network traffic patterns

2. **Scale Optimization**:
   ```bash
   # Review current scaling
   doctl apps get $DO_PRODUCTION_APP_ID --format Name,Spec.Services
   
   # Adjust scaling if needed (edit app.yaml)
   # doctl apps update $DO_PRODUCTION_APP_ID --spec .do/app.yaml
   ```

#### Security Review
```bash
# Check for suspicious activity
doctl apps logs $DO_PRODUCTION_APP_ID | grep -E "(403|401|blocked)" | tail -20

# Review failed authentication attempts
grep -i "auth" /var/log/portfolio*.log | grep -i "fail"

# Check SSL certificate expiry
curl -vI https://frankpalmisano.com 2>&1 | grep -E "(expire|valid)"
```

#### Backup Verification
```bash
# Verify recent backups
./deploy/scripts/backup.sh --verify

# Check backup retention
find /backup -type f -name "*.tar.gz" -ls | head -10

# Test restore procedure (on staging)
./deploy/scripts/restore.sh staging latest
```

### Weekly Checklist
- [ ] Performance metrics reviewed and within targets
- [ ] Resource utilization optimized
- [ ] Security logs reviewed
- [ ] Backups verified and tested
- [ ] Documentation updated if needed
- [ ] Team notified of any issues or changes

## Monthly Operations

### Comprehensive System Review (2 hours)

#### Performance Analysis
1. **Monthly Metrics Report**:
   - Generate performance summary
   - Compare with previous month
   - Identify trends and anomalies

2. **Cost Analysis**:
   ```bash
   # Review Digital Ocean billing
   doctl balance get
   doctl invoices list | head -5
   ```

3. **Capacity Planning**:
   - Analyze growth trends
   - Plan for upcoming traffic spikes
   - Review scaling policies

#### Security Audit
1. **Access Review**:
   - Review team access permissions
   - Check for unused accounts
   - Validate MFA compliance

2. **Vulnerability Assessment**:
   ```bash
   # Run security scans
   npm audit --audit-level high
   
   # Check for outdated dependencies
   npm outdated
   ```

3. **Configuration Review**:
   - Review security headers
   - Check SSL/TLS configuration
   - Validate firewall rules

#### Disaster Recovery Testing
1. **Backup Restoration Test**:
   ```bash
   # Full system restore test (on staging)
   ./deploy/scripts/dr-test.sh staging
   ```

2. **Failover Testing**:
   - Test rollback procedures
   - Validate monitoring alerts
   - Review recovery time

3. **Documentation Update**:
   - Update runbooks with new procedures
   - Review contact information
   - Validate escalation procedures

### Monthly Checklist
- [ ] Performance analysis completed
- [ ] Cost optimization review
- [ ] Security audit performed
- [ ] DR testing completed
- [ ] Documentation updated
- [ ] Capacity planning reviewed
- [ ] Team training needs identified

## Troubleshooting Playbooks

### High Response Times

#### Symptoms
- P95 response time > 2 seconds
- User complaints about slow loading
- Monitoring alerts triggered

#### Investigation Steps
```bash
# 1. Check current response times
curl -w "Time: %{time_total}s\n" -s https://frankpalmisano.com > /dev/null

# 2. Check resource utilization
doctl apps get $DO_PRODUCTION_APP_ID

# 3. Check database performance
redis-cli -u $REDIS_URL info stats

# 4. Check image processing queue
redis-cli -u $REDIS_URL llen image-processing-queue
```

#### Resolution Actions
1. **Immediate**: Scale up web service instances
2. **Short-term**: Optimize database queries
3. **Long-term**: Implement caching improvements

### High Error Rates

#### Symptoms
- Error rate > 1%
- 5xx errors in logs
- Failed image processing

#### Investigation Steps
```bash
# 1. Check error patterns
doctl apps logs $DO_PRODUCTION_APP_ID | grep -E "ERROR|5[0-9]{2}" | tail -20

# 2. Check service status
doctl apps get $DO_PRODUCTION_APP_ID --format Name,Phase,LiveURL

# 3. Check external dependencies
curl -I https://frankpalmisano.com
redis-cli -u $REDIS_URL ping
```

#### Resolution Actions
1. **Immediate**: Rollback if recent deployment
2. **Short-term**: Restart affected services
3. **Long-term**: Fix root cause and add monitoring

### Resource Exhaustion

#### Symptoms
- High CPU/memory usage (> 80%)
- Out of memory errors
- Slow response times

#### Investigation Steps
```bash
# 1. Check resource usage trends in Grafana
# 2. Identify resource-heavy processes
# 3. Check for memory leaks

# Check current resource allocation
doctl apps get $DO_PRODUCTION_APP_ID --format Name,Spec.Services
```

#### Resolution Actions
1. **Immediate**: Scale up instances
2. **Short-term**: Optimize resource usage
3. **Long-term**: Code optimization and better resource planning

## Maintenance Procedures

### Planned Maintenance

#### Pre-Maintenance Checklist
- [ ] Maintenance window scheduled and communicated
- [ ] Backup completed and verified
- [ ] Rollback plan prepared
- [ ] Team notified and available
- [ ] Monitoring alerts adjusted

#### Maintenance Execution
```bash
# 1. Enable maintenance mode (if available)
# 2. Perform maintenance tasks
# 3. Run validation tests
# 4. Disable maintenance mode
# 5. Monitor for issues
```

#### Post-Maintenance Checklist
- [ ] All services healthy
- [ ] Performance metrics normal
- [ ] No new errors in logs
- [ ] Stakeholders notified of completion
- [ ] Documentation updated

### Emergency Maintenance

#### Immediate Response
1. **Assess Severity**: Determine if emergency maintenance is needed
2. **Notify Stakeholders**: Immediate notification of unplanned maintenance
3. **Execute Fix**: Apply emergency fix or rollback
4. **Monitor**: Intensive monitoring during and after

#### Documentation
- Document what was done
- Update procedures based on lessons learned
- Schedule post-mortem if significant

## Optimization Procedures

### Performance Optimization

#### Image Processing Optimization
```bash
# Monitor processing times
redis-cli -u $REDIS_URL hgetall image-processing-stats

# Optimize Sharp.js configuration
# Review and adjust quality settings
# Consider format-specific optimizations
```

#### Cache Optimization
```bash
# Analyze cache hit rates
redis-cli -u $REDIS_URL info stats | grep -E "(hits|misses|memory)"

# Optimize cache TTL settings
# Review cache key patterns
# Consider cache warming strategies
```

#### Database Optimization
```bash
# Monitor Redis performance
redis-cli -u $REDIS_URL info memory
redis-cli -u $REDIS_URL info clients

# Optimize data structures
# Review key expiration policies
# Consider Redis configuration tuning
```

### Cost Optimization

#### Resource Right-Sizing
1. **Analyze Usage Patterns**:
   - Peak vs. off-peak usage
   - Resource utilization trends
   - Traffic patterns

2. **Optimize Instance Sizes**:
   - Scale down over-provisioned services
   - Use appropriate instance types
   - Implement better auto-scaling

3. **Review Data Storage**:
   - Clean up old backups
   - Optimize image cache retention
   - Review log retention policies

#### Cost Monitoring
```bash
# Check current costs
doctl balance get

# Review resource usage
doctl apps get $DO_PRODUCTION_APP_ID

# Analyze cost trends
doctl invoices list | head -5
```

## Team Procedures

### On-Call Responsibilities

#### Primary On-Call
- Monitor alerts and respond within SLA
- Perform initial triage and response
- Escalate if unable to resolve within time limits
- Document all incidents and responses

#### Secondary On-Call
- Backup for primary on-call
- Available for escalations
- Support complex troubleshooting
- Assist with major incidents

#### Escalation
- Engineering Manager: For P1/P2 incidents
- Senior Engineers: For complex technical issues
- External Support: For platform-specific issues

### Knowledge Transfer

#### Handoff Procedures
1. **Weekly Handoff**: Review ongoing issues and planned work
2. **Monthly Handoff**: Comprehensive system status review
3. **Documentation**: Keep runbooks and procedures current
4. **Training**: Regular training on new procedures

#### Documentation Standards
- All procedures must be documented
- Include command examples
- Specify expected outcomes
- Update based on actual experience

## Appendix

### Quick Reference Commands

#### System Health
```bash
# Overall health check
curl -s https://frankpalmisano.com/api/health | jq .

# Service status
doctl apps get $DO_PRODUCTION_APP_ID

# Recent logs
doctl apps logs $DO_PRODUCTION_APP_ID --tail=20
```

#### Performance Testing
```bash
# Response time test
time curl -s https://frankpalmisano.com > /dev/null

# Load test
for i in {1..10}; do curl -s https://frankpalmisano.com > /dev/null & done; wait

# Image processing test
curl -X POST -F "image=@test.jpg" https://frankpalmisano.com/api/image/optimize
```

#### Database Operations
```bash
# Redis status
redis-cli -u $REDIS_URL ping
redis-cli -u $REDIS_URL info memory

# Cache operations
redis-cli -u $REDIS_URL flushdb  # Clear cache (use with caution)
redis-cli -u $REDIS_URL keys "*" | wc -l  # Count keys
```

### Contact Information

#### Internal Team
- **Operations Team**: ops@company.com
- **Platform Team**: platform@company.com
- **On-Call**: oncall@company.com

#### External Support
- **Digital Ocean**: support@digitalocean.com
- **Emergency Line**: 1-800-DO-SUPPORT

### Useful Links
- [Grafana Dashboard](https://monitoring.frankpalmisano.com)
- [Digital Ocean Console](https://cloud.digitalocean.com)
- [Status Page](https://status.frankpalmisano.com)
- [Documentation](https://docs.frankpalmisano.com)

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Review Frequency**: Monthly  
**Owner**: Operations Team