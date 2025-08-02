# Incident Response Runbook

## Overview

This runbook provides procedures for responding to incidents in the portfolio image optimization system. It covers detection, assessment, response, and recovery procedures.

## Incident Classification

### Severity Levels

#### P1 - Critical (Service Down)
- **Description**: Complete service outage or data loss
- **Response Time**: 15 minutes
- **Examples**: Website completely inaccessible, data corruption, security breach
- **Escalation**: Immediate to all teams

#### P2 - High (Significant Impact)
- **Description**: Major functionality impaired
- **Response Time**: 1 hour
- **Examples**: Slow response times (>5s), image processing completely down, high error rates (>10%)
- **Escalation**: Operations and Platform teams

#### P3 - Medium (Minor Impact)
- **Description**: Degraded performance
- **Response Time**: 4 hours
- **Examples**: Elevated response times (2-5s), intermittent errors (1-10%)
- **Escalation**: Operations team

#### P4 - Low (Minimal Impact)
- **Description**: Minor issues not affecting users
- **Response Time**: Next business day
- **Examples**: Non-critical monitoring alerts, minor performance degradation
- **Escalation**: Assigned engineer

## Detection and Alerting

### Monitoring Systems

#### Primary Detection
- **Grafana Alerts**: System and application metrics
- **Health Check Monitoring**: Automated endpoint monitoring
- **Error Rate Alerts**: Application error thresholds
- **Performance Alerts**: Response time and throughput

#### Secondary Detection
- **User Reports**: Support tickets or direct feedback
- **Manual Discovery**: During routine checks
- **External Monitoring**: Third-party services

### Alert Channels

#### Immediate Notifications (P1/P2)
- **Slack**: `#incidents` channel
- **PagerDuty**: On-call engineer
- **Email**: Critical alerts list
- **SMS**: For P1 incidents

#### Standard Notifications (P3/P4)
- **Slack**: `#operations` channel
- **Email**: Operations team
- **Ticket System**: Automated ticket creation

## Incident Response Process

### Phase 1: Detection and Assessment (0-15 minutes)

#### Immediate Actions
1. **Acknowledge Alert**
   ```bash
   # Check incident channel
   # Acknowledge in monitoring system
   # Claim incident ownership
   ```

2. **Initial Assessment**
   ```bash
   # Check system status
   curl -f https://frankpalmisano.com/api/health
   
   # Check service status
   doctl apps get $DO_PRODUCTION_APP_ID
   
   # Review recent deployments
   doctl apps list-deployments $DO_PRODUCTION_APP_ID | head -5
   ```

3. **Determine Severity**
   - Assess user impact
   - Check affected services
   - Classify according to severity matrix

#### Assessment Checklist
- [ ] Service accessibility verified
- [ ] Error rates checked
- [ ] Recent changes reviewed
- [ ] Affected components identified
- [ ] Impact scope determined

### Phase 2: Communication and Coordination (5-30 minutes)

#### Internal Communication
1. **Create Incident Channel**
   ```
   Channel: #incident-YYYY-MM-DD-NNN
   Topic: [P1] Service outage - Image optimization down
   ```

2. **Notify Stakeholders**
   - Operations team
   - Platform engineers
   - Engineering manager (for P1/P2)
   - Business stakeholders (for P1)

3. **Establish Incident Commander**
   - Senior engineer for P1/P2
   - On-call engineer for P3/P4
   - Clear role assignment

#### External Communication (if needed)
- **Status Page**: Update service status
- **User Notification**: If significant user impact
- **Social Media**: If public-facing issues

### Phase 3: Investigation and Diagnosis (15-60 minutes)

#### System Investigation
```bash
# Check application logs
doctl apps logs $DO_PRODUCTION_APP_ID --type=run --tail=100

# Check deployment logs
doctl apps logs $DO_PRODUCTION_APP_ID --type=build --tail=50

# Check service health
for service in portfolio-web image-optimizer image-worker monitoring; do
  echo "Checking $service..."
  doctl apps logs $DO_PRODUCTION_APP_ID --component=$service --tail=20
done
```

#### Database Investigation
```bash
# Check Redis status
doctl databases get $DO_REDIS_CLUSTER_ID

# Test Redis connectivity
redis-cli -u $REDIS_URL ping

# Check Redis memory usage
redis-cli -u $REDIS_URL info memory
```

#### Network Investigation
```bash
# Check DNS resolution
nslookup frankpalmisano.com

# Check SSL certificate
curl -vI https://frankpalmisano.com 2>&1 | grep -E "(certificate|SSL)"

# Check CDN status (if applicable)
curl -I https://frankpalmisano.com | grep -i server
```

#### Common Investigation Areas

1. **Recent Deployments**
   - Check last deployment time
   - Review deployment logs
   - Compare with incident start time

2. **Resource Exhaustion**
   - CPU and memory usage
   - Disk space availability
   - Network connectivity

3. **External Dependencies**
   - Digital Ocean service status
   - Third-party API availability
   - DNS resolution issues

4. **Application Errors**
   - Error rates and patterns
   - Exception stack traces
   - Database query performance

### Phase 4: Mitigation and Resolution

#### Immediate Mitigation Options

1. **Service Restart**
   ```bash
   # Force rebuild and restart
   doctl apps create-deployment $DO_PRODUCTION_APP_ID --force-rebuild
   ```

2. **Rollback to Previous Version**
   ```bash
   # Emergency rollback
   ./deploy/scripts/rollback.sh production auto
   ```

3. **Scale Resources**
   ```bash
   # Temporarily increase instance count
   # Edit .do/app.yaml to increase instance_count
   doctl apps update $DO_PRODUCTION_APP_ID --spec .do/app.yaml
   ```

4. **Clear Cache**
   ```bash
   # Clear Redis cache if corrupted
   redis-cli -u $REDIS_URL FLUSHDB
   ```

5. **Enable Maintenance Mode**
   ```bash
   # If available, enable maintenance mode
   # Redirect traffic to status page
   ```

#### Resolution Strategies by Incident Type

##### High Error Rates
1. Check recent code changes
2. Review error logs for patterns
3. Rollback if recent deployment
4. Scale services if resource exhaustion

##### Slow Response Times
1. Check resource utilization
2. Scale up services
3. Review database performance
4. Check cache hit rates

##### Service Unavailable
1. Check service health
2. Restart affected services
3. Check external dependencies
4. Verify DNS and SSL

##### Image Processing Issues
1. Check Sharp.js dependencies
2. Restart image workers
3. Clear processing queue
4. Validate input formats

### Phase 5: Monitoring and Validation

#### Post-Resolution Monitoring
```bash
# Monitor key metrics for 30 minutes
watch -n 30 "curl -s https://frankpalmisano.com/api/health | jq ."

# Check error rates
# Monitor response times
# Verify all services healthy
```

#### Validation Checklist
- [ ] All services responding normally
- [ ] Error rates back to baseline
- [ ] Response times within SLA
- [ ] Key functionality working
- [ ] No new alerts triggered

## Communication Templates

### Initial Incident Notification
```
🚨 INCIDENT ALERT - P[SEVERITY] 🚨

Status: INVESTIGATING
Started: [TIME]
Severity: P[X] - [DESCRIPTION]
Impact: [USER IMPACT DESCRIPTION]
Services Affected: [LIST]

Incident Commander: @[NAME]
Next Update: [TIME + 30min]

Channel: #incident-YYYY-MM-DD-NNN
```

### Status Update Template
```
📊 INCIDENT UPDATE - P[SEVERITY]

Time: [CURRENT TIME]
Status: [INVESTIGATING/MITIGATING/RESOLVED]
Duration: [TIME SINCE START]

Progress:
- [ACTION TAKEN 1]
- [ACTION TAKEN 2]
- [CURRENT ACTION]

Next Update: [TIME + 30min]
```

### Resolution Notification
```
✅ INCIDENT RESOLVED - P[SEVERITY]

Resolved: [TIME]
Duration: [TOTAL TIME]
Root Cause: [BRIEF DESCRIPTION]

Summary:
- Issue: [WHAT HAPPENED]
- Impact: [USER IMPACT]
- Resolution: [HOW FIXED]

Post-mortem scheduled for: [DATE/TIME]
```

## Recovery Procedures

### Database Recovery
```bash
# Restore from backup
doctl databases backups list $DO_REDIS_CLUSTER_ID
doctl databases backups restore $DO_REDIS_CLUSTER_ID $BACKUP_ID

# Verify data integrity
redis-cli -u $REDIS_URL info keyspace
```

### Application Recovery
```bash
# Full application restart
doctl apps create-deployment $DO_PRODUCTION_APP_ID --force-rebuild

# Verify all components
curl -f https://frankpalmisano.com/api/health
curl -f https://frankpalmisano.com/api/image/health
```

### Data Recovery
```bash
# Restore from backup (if needed)
./deploy/scripts/restore.sh production latest

# Verify data consistency
# Run data validation checks
```

## Post-Incident Activities

### Immediate Post-Incident (Within 24 hours)
1. **Document Timeline**
   - Record all actions taken
   - Note decision points
   - Capture lessons learned

2. **Update Monitoring**
   - Add new alerts if gaps found
   - Adjust thresholds if needed
   - Improve detection coverage

3. **Communication**
   - Update stakeholders
   - Post public update if needed
   - Thank response team

### Post-Mortem Process (Within 1 week)

#### Preparation
1. **Gather Data**
   - Timeline of events
   - Metrics and logs
   - Actions taken
   - Communication records

2. **Schedule Meeting**
   - Include all responders
   - Book conference room
   - Prepare agenda

#### Post-Mortem Meeting
1. **Review Timeline**
   - What happened when
   - Decisions made
   - Effectiveness of actions

2. **Root Cause Analysis**
   - Primary cause
   - Contributing factors
   - Why detection took time

3. **Action Items**
   - Immediate fixes
   - Process improvements
   - Monitoring enhancements
   - Documentation updates

#### Follow-Up
1. **Document Results**
   - Post-mortem report
   - Action item tracking
   - Share with team

2. **Implement Changes**
   - Track action items
   - Update procedures
   - Improve systems

## Escalation Procedures

### Internal Escalation

#### Level 1: On-Call Engineer
- **Responsibility**: Initial response and basic troubleshooting
- **Escalation Time**: 30 minutes for P1, 1 hour for P2

#### Level 2: Senior Engineer
- **Responsibility**: Complex troubleshooting and decision making
- **Escalation Time**: 15 minutes for P1, 30 minutes for P2

#### Level 3: Engineering Manager
- **Responsibility**: Resource allocation and external communication
- **Escalation Time**: Immediate for P1, 1 hour for P2

### External Escalation

#### Digital Ocean Support
```bash
# Create support ticket
doctl compute support create-ticket \
  --subject "Production Issue - App Platform" \
  --message "Detailed description of issue" \
  --priority "high"
```

#### Emergency Contacts
- **Digital Ocean**: support@digitalocean.com
- **DNS Provider**: [Contact info]
- **CDN Support**: [Contact info]

## Tools and Resources

### Monitoring Tools
- **Grafana**: https://[monitoring-url]:9090
- **Digital Ocean Console**: https://cloud.digitalocean.com
- **Application Logs**: `doctl apps logs`

### Diagnostic Commands
```bash
# Quick health check
curl -f https://frankpalmisano.com/api/health

# Service status
doctl apps get $DO_PRODUCTION_APP_ID

# Recent deployments
doctl apps list-deployments $DO_PRODUCTION_APP_ID | head -5

# Application logs
doctl apps logs $DO_PRODUCTION_APP_ID --tail=50

# Database status
doctl databases get $DO_REDIS_CLUSTER_ID
```

### Reference Documentation
- [Deployment Runbook](./deployment-runbook.md)
- [System Architecture](../architecture/system-overview.md)
- [Monitoring Guide](./monitoring-guide.md)
- [Security Procedures](./security-procedures.md)

## Appendix

### Common Issues and Solutions

| Issue | Symptoms | Quick Fix | Long-term Solution |
|-------|----------|-----------|-------------------|
| High CPU | Response time > 2s | Scale up instances | Optimize code |
| Memory leak | Memory usage climbing | Restart service | Fix memory leak |
| Queue backup | Images not processing | Scale workers | Optimize processing |
| Cache issues | High response times | Clear cache | Review cache strategy |
| Database timeout | Connection errors | Restart connections | Scale database |

### Testing Commands
```bash
# Load test
curl -X POST -F "image=@test.jpg" https://frankpalmisano.com/api/image/optimize

# Availability test
for i in {1..10}; do curl -f https://frankpalmisano.com/api/health && echo " - OK"; done

# Performance test
time curl -s https://frankpalmisano.com > /dev/null
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Review Frequency**: Quarterly  
**Owner**: Operations Team