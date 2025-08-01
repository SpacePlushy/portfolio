# Portfolio Image Optimization System - Deployment Runbook

## Overview

This runbook provides step-by-step procedures for deploying and managing the portfolio image optimization system on Digital Ocean App Platform.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │ Image Optimizer │    │ Image Workers   │
│ (portfolio-web) │────│ (image-optimizer)│────│ (image-worker)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │    (Cache)      │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Monitoring    │
                    │ (Prometheus +   │
                    │   Grafana)      │
                    └─────────────────┘
```

## Pre-Deployment Checklist

### Environment Setup
- [ ] Digital Ocean account configured
- [ ] doctl CLI installed and authenticated
- [ ] GitHub repository access configured
- [ ] Environment variables configured in DO dashboard
- [ ] Docker registry access configured

### Code Preparation
- [ ] All tests passing in CI/CD pipeline
- [ ] Security scans completed
- [ ] Performance benchmarks validated
- [ ] Docker images built and pushed to registry
- [ ] Database migrations prepared (if any)

### Infrastructure Validation
- [ ] App spec files validated
- [ ] Resource quotas confirmed
- [ ] Network configuration verified
- [ ] Monitoring endpoints accessible
- [ ] Backup systems operational

## Deployment Procedures

### 1. Standard Deployment (Zero-Downtime)

#### Prerequisites
```bash
# Ensure environment variables are set
export DO_PRODUCTION_APP_ID="your-production-app-id"
export DO_STAGING_APP_ID="your-staging-app-id"
export PRODUCTION_URL="https://frankpalmisano.com"
export STAGING_URL="https://portfolio-staging.ondigitalocean.app"
```

#### Staging Deployment
```bash
# 1. Deploy to staging first
./deploy/scripts/zero-downtime-deploy.sh staging latest

# 2. Validate staging deployment
curl -f https://portfolio-staging.ondigitalocean.app/api/health
curl -f https://portfolio-staging.ondigitalocean.app/api/image/health

# 3. Run smoke tests
npm run test:smoke
```

#### Production Deployment
```bash
# 1. Create backup of current production
./deploy/scripts/backup.sh all

# 2. Deploy to production
./deploy/scripts/zero-downtime-deploy.sh production v1.2.3

# 3. Monitor deployment progress
doctl apps list-deployments $DO_PRODUCTION_APP_ID

# 4. Validate production deployment
curl -f https://frankpalmisano.com/api/health
```

### 2. Emergency Rollback

#### Automatic Rollback
```bash
# Rollback to previous deployment automatically
./deploy/scripts/rollback.sh production auto

# Rollback to specific deployment
./deploy/scripts/rollback.sh production deployment-id-here
```

#### Manual Rollback Steps
1. **Identify target deployment**:
   ```bash
   doctl apps list-deployments $DO_PRODUCTION_APP_ID
   ```

2. **Execute rollback**:
   ```bash
   ./deploy/scripts/rollback.sh production previous
   ```

3. **Validate rollback**:
   ```bash
   curl -f https://frankpalmisano.com/api/health
   ./deploy/scripts/health-check.sh production
   ```

4. **Update monitoring**:
   - Check Grafana dashboards
   - Verify alert channels
   - Update incident status

### 3. Blue-Green Deployment Strategy

#### Overview
Digital Ocean App Platform handles blue-green deployments automatically:
1. New version deployed alongside current version
2. Health checks validated on new version
3. Traffic switched to new version once healthy
4. Old version kept for quick rollback

#### Manual Blue-Green Steps (if needed)
```bash
# 1. Deploy new version without switching traffic
doctl apps update $DO_PRODUCTION_APP_ID --spec .do/app.yaml --no-header

# 2. Wait for deployment to be ready
deployment_id=$(doctl apps list-deployments $DO_PRODUCTION_APP_ID --format ID --no-header | head -1)

# 3. Validate new deployment
./deploy/scripts/validate-deployment.sh $deployment_id

# 4. Switch traffic (automatic in DO App Platform)
# Traffic switches automatically after health checks pass
```

## Monitoring and Alerting

### Key Metrics to Monitor

#### Application Health
- HTTP response codes (200, 4xx, 5xx rates)
- Response time percentiles (p50, p95, p99)
- Request rate (requests per second)
- Active connections

#### Image Processing
- Queue size and processing rate
- Image optimization success/failure rates
- Processing time per image
- Cache hit/miss rates

#### System Resources
- CPU utilization per service
- Memory usage and available memory
- Disk space utilization
- Network I/O

#### Business Metrics
- Image uploads per day
- Compression ratio achieved
- Cost per optimization
- User engagement metrics

### Grafana Dashboards

1. **System Overview**: `/monitoring/dashboards/portfolio-overview.json`
   - Service health status
   - Key performance indicators
   - Resource utilization

2. **Image Optimization**: `/monitoring/dashboards/image-optimization.json`
   - Processing performance
   - Quality metrics
   - Error rates

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Response Time P95 | > 2s | > 5s | Scale up |
| Error Rate | > 1% | > 5% | Investigate/Rollback |
| CPU Usage | > 70% | > 85% | Scale up |
| Memory Usage | > 75% | > 90% | Scale up |
| Queue Size | > 50 | > 100 | Scale workers |
| Disk Usage | > 80% | > 90% | Clean up/Expand |

## Troubleshooting Guide

### Common Issues

#### 1. Deployment Failures

**Symptoms**: Deployment stuck in "BUILDING" or "DEPLOYING" state

**Diagnosis**:
```bash
# Check deployment logs
doctl apps logs $DO_PRODUCTION_APP_ID --type=build

# Check app status
doctl apps get $DO_PRODUCTION_APP_ID
```

**Resolution**:
1. Check Docker image availability
2. Validate app spec syntax
3. Verify resource limits
4. Check for dependency conflicts

#### 2. High Response Times

**Symptoms**: P95 response time > 2 seconds

**Diagnosis**:
```bash
# Check service logs
doctl apps logs $DO_PRODUCTION_APP_ID --type=run

# Monitor resource usage
# Check Grafana dashboard for bottlenecks
```

**Resolution**:
1. Scale up web service instances
2. Optimize database queries
3. Check image processing queue
4. Review caching configuration

#### 3. Image Processing Failures

**Symptoms**: High error rate in image optimization

**Diagnosis**:
```bash
# Check image service logs
doctl apps logs $DO_PRODUCTION_APP_ID --component=image-optimizer

# Check worker status
doctl apps logs $DO_PRODUCTION_APP_ID --component=image-worker
```

**Resolution**:
1. Restart image workers
2. Clear Redis queue if corrupted
3. Check Sharp.js dependencies
4. Validate input file formats

#### 4. Database Connection Issues

**Symptoms**: Redis connection failures

**Diagnosis**:
```bash
# Check Redis status
doctl databases get $DO_REDIS_CLUSTER_ID

# Test connection
redis-cli -u $REDIS_URL ping
```

**Resolution**:
1. Check Redis instance health
2. Verify connection string
3. Check network connectivity
4. Review connection pool settings

### Service Recovery Procedures

#### 1. Service Restart
```bash
# Restart specific service component
doctl apps create-deployment $DO_PRODUCTION_APP_ID --force-rebuild

# Wait for deployment
watch doctl apps list-deployments $DO_PRODUCTION_APP_ID
```

#### 2. Cache Clear
```bash
# Clear Redis cache
redis-cli -u $REDIS_URL FLUSHDB

# Restart application to rebuild cache
doctl apps create-deployment $DO_PRODUCTION_APP_ID
```

#### 3. Scale Services
```bash
# Scale web service
# Edit .do/app.yaml and increase instance_count
doctl apps update $DO_PRODUCTION_APP_ID --spec .do/app.yaml
```

## Security Procedures

### Security Incident Response

#### 1. Immediate Actions
1. **Assess Severity**: Determine impact and scope
2. **Contain Threat**: Block malicious IPs if needed
3. **Preserve Evidence**: Capture logs and system state
4. **Notify Team**: Alert security and operations teams

#### 2. Investigation Steps
```bash
# Check access logs for suspicious activity
doctl apps logs $DO_PRODUCTION_APP_ID | grep -E "(403|404|5[0-9]{2})"

# Review security events
grep "SECURITY" /var/log/portfolio*.log

# Check for failed authentication attempts
grep "auth" /var/log/portfolio*.log
```

#### 3. Remediation
1. **Block Attackers**: Update firewall rules
2. **Update Security**: Apply patches if needed
3. **Reset Credentials**: Rotate API keys and passwords
4. **Monitor**: Increase monitoring for 24-48 hours

### Security Maintenance

#### Weekly Tasks
- [ ] Review security logs
- [ ] Check for software updates
- [ ] Validate SSL certificates
- [ ] Review access permissions

#### Monthly Tasks
- [ ] Security vulnerability scan
- [ ] Access audit
- [ ] Backup verification
- [ ] Incident response drill

## Maintenance Procedures

### Regular Maintenance

#### Daily Tasks
- [ ] Check system health dashboards
- [ ] Review error logs
- [ ] Verify backup completion
- [ ] Monitor resource usage

#### Weekly Tasks
- [ ] Review performance metrics
- [ ] Clean up old deployments
- [ ] Update dependencies
- [ ] Validate monitoring alerts

#### Monthly Tasks
- [ ] Performance optimization review
- [ ] Cost analysis
- [ ] Security audit
- [ ] Disaster recovery test

### Scheduled Maintenance

#### Preparation
1. **Schedule Maintenance**: Announce to stakeholders
2. **Prepare Rollback**: Ensure quick recovery plan
3. **Backup Systems**: Create full system backup
4. **Test Procedures**: Validate in staging first

#### Execution
1. **Enable Maintenance Mode**: If available
2. **Perform Updates**: Apply changes systematically
3. **Validate Changes**: Run health checks
4. **Monitor Systems**: Watch for issues

#### Post-Maintenance
1. **Disable Maintenance Mode**
2. **Monitor Performance**: Watch for degradation
3. **Document Changes**: Update procedures
4. **Notify Completion**: Inform stakeholders

## Emergency Contacts

### On-Call Rotation
- **Primary**: Operations Engineer
- **Secondary**: Platform Engineer
- **Escalation**: Engineering Manager

### External Contacts
- **Digital Ocean Support**: support@digitalocean.com
- **DNS Provider**: [Your DNS provider]
- **CDN Support**: [If using external CDN]

### Escalation Matrix

| Severity | Response Time | Escalation Time | Contacts |
|----------|---------------|-----------------|----------|
| P1 (Critical) | 15 minutes | 30 minutes | All teams |
| P2 (High) | 1 hour | 2 hours | Ops + Platform |
| P3 (Medium) | 4 hours | 8 hours | Ops team |
| P4 (Low) | Next business day | 48 hours | Assigned engineer |

## Appendix

### Useful Commands

#### Digital Ocean CLI
```bash
# List apps
doctl apps list

# Get app details
doctl apps get $APP_ID

# View logs
doctl apps logs $APP_ID --type=run --follow

# List deployments
doctl apps list-deployments $APP_ID

# Create deployment
doctl apps create-deployment $APP_ID
```

#### Health Checks
```bash
# Basic health check
curl -f https://frankpalmisano.com/api/health

# Detailed health check
curl -s https://frankpalmisano.com/api/health | jq .

# Image service health
curl -f https://frankpalmisano.com/api/image/health
```

#### Monitoring
```bash
# Check metrics endpoint
curl -s https://frankpalmisano.com/metrics

# Test image optimization
curl -X POST -F "image=@test.jpg" https://frankpalmisano.com/api/image/optimize
```

### Configuration Files

- **Production App Spec**: `.do/app.yaml`
- **Staging App Spec**: `.do/app.staging.yaml`
- **Environment Variables**: `deploy/config/environment-production.env`
- **Security Config**: `deploy/config/security.yaml`
- **Monitoring Config**: `monitoring/prometheus.yml`

### Recovery Procedures Summary

1. **Service Down**: Check logs → Restart service → Scale if needed
2. **High Load**: Scale services → Optimize queries → Review caching
3. **Security Incident**: Contain → Investigate → Remediate → Monitor
4. **Data Loss**: Restore from backup → Validate integrity → Resume operations
5. **Complete Outage**: Activate DR → Failover to backup region → Restore services

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Review Frequency**: Monthly  
**Owner**: Platform Engineering Team