# Milestone 2: Initial Deployment & User Testing Infrastructure (End of Week 1)

**Due Date**: End of Week 1  
**Goal**: Deploy basic infrastructure for continuous user testing throughout development

## Overview

This milestone establishes the foundation for continuous deployment and user testing. By implementing early deployment infrastructure, we can gather user feedback from Week 1 onwards, enabling iterative development and early validation of features.

## Issues for Milestone 2

### Issue #21: Set Up Staging Environment Infrastructure
**Labels**: `P1`, `M2-Deployment`, `MVP`, `devops`, `ai-ready`, `blocking`  
**Depends on**: #4  
**Description**: Create staging environment for continuous deployment and user testing

**Acceptance Criteria**:
```
- [ ] Choose and provision hosting platform:
  - [ ] Option A: AWS EC2 + RDS + ElastiCache
  - [ ] Option B: DigitalOcean Droplets + Managed Database
  - [ ] Option C: Railway.app or Render.com for simplicity
  - [ ] Document choice rationale
- [ ] Create staging environment configuration:
  - [ ] Staging MongoDB instance (Atlas free tier acceptable)
  - [ ] Staging Redis instance
  - [ ] Environment variables for staging
  - [ ] Subdomain: staging.dnd-tracker.com
- [ ] Set up SSL/TLS:
  - [ ] Use Let's Encrypt for free SSL
  - [ ] Configure auto-renewal
  - [ ] Force HTTPS redirect
- [ ] Create deployment scripts:
  - [ ] deploy-staging.sh script
  - [ ] Database migration handling
  - [ ] Zero-downtime deployment strategy
  - [ ] Rollback procedures
- [ ] Set up monitoring:
  - [ ] Basic uptime monitoring (UptimeRobot free tier)
  - [ ] Error logging (Sentry free tier)
  - [ ] Basic analytics (Plausible or Umami)
- [ ] Create staging-specific features:
  - [ ] Feature flags system
  - [ ] "Staging Environment" banner
  - [ ] Test data seeding scripts
```

**Technical Implementation Notes**:
```bash
# Example deployment script structure
#!/bin/bash
# deploy-staging.sh

set -e

echo "🚀 Deploying to staging..."

# Build the application
npm run build

# Build Docker image
docker build -t dnd-tracker:staging .

# Deploy with zero downtime
docker-compose -f docker-compose.staging.yml up -d

# Run health checks
curl -f http://staging.dnd-tracker.com/health || exit 1

echo "✅ Deployment complete!"
```

---

### Issue #22: Create CI/CD Pipeline for Staging
**Labels**: `P1`, `M2-Deployment`, `MVP`, `devops`, `ai-ready`  
**Depends on**: #5, #21  
**Description**: Implement automated deployment pipeline to staging environment

**Acceptance Criteria**:
```
- [ ] Create .github/workflows/deploy-staging.yml:
  - [ ] Trigger on push to develop branch
  - [ ] Build steps:
    - [ ] Checkout code
    - [ ] Set up Node.js
    - [ ] Install dependencies
    - [ ] Run tests (when available)
    - [ ] Build all packages
  - [ ] Deploy steps:
    - [ ] Build Docker images
    - [ ] Push to registry (Docker Hub or GitHub Container Registry)
    - [ ] Deploy to staging server
    - [ ] Run database migrations
    - [ ] Health check verification
    - [ ] Notify team on Slack/Discord
- [ ] Create deployment configuration:
  - [ ] docker-compose.staging.yml
  - [ ] Staging-specific environment variables
  - [ ] Resource limits for cost control
- [ ] Implement deployment safety:
  - [ ] Blue-green deployment or rolling updates
  - [ ] Automatic rollback on health check failure
  - [ ] Deployment locks to prevent conflicts
- [ ] Set up deployment secrets in GitHub:
  - [ ] STAGING_HOST
  - [ ] STAGING_SSH_KEY
  - [ ] DOCKER_REGISTRY_TOKEN
  - [ ] STAGING_ENV_FILE (base64 encoded)
- [ ] Create deployment documentation:
  - [ ] How to trigger manual deployment
  - [ ] How to rollback
  - [ ] Troubleshooting guide
```

**Manual Review Steps**:
1. Review and approve the deployment workflow for security
2. Set up GitHub secrets securely
3. Test deployment with a simple change
4. Verify rollback procedures work

---

### Issue #23: Create User Testing Framework
**Labels**: `P1`, `M2-Deployment`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #22  
**Description**: Build framework for collecting user feedback during development

**Acceptance Criteria**:
```
- [ ] Create feedback widget component:
  - [ ] Floating feedback button
  - [ ] Feedback form with:
    - [ ] Feature being tested
    - [ ] Rating (1-5 stars)
    - [ ] Text feedback
    - [ ] Screenshot capability
    - [ ] User email (optional)
  - [ ] Only visible in staging environment
- [ ] Create feedback API endpoint:
  - [ ] POST /api/v1/feedback
  - [ ] Store in database
  - [ ] Send notifications to team
  - [ ] No authentication required for MVP
- [ ] Create feedback dashboard:
  - [ ] Simple admin page to view feedback
  - [ ] Filter by date, feature, rating
  - [ ] Export to CSV
  - [ ] Basic analytics
- [ ] Add feature flags system:
  - [ ] Environment-based flags
  - [ ] Runtime toggle for testing
  - [ ] Flag status in UI for testers
- [ ] Create testing documentation:
  - [ ] List of features ready for testing
  - [ ] Known issues
  - [ ] How to provide feedback
  - [ ] Testing scenarios
```

**Technical Implementation**:
```typescript
// Example feedback widget component
interface FeedbackWidget {
  isVisible: boolean;
  onSubmit: (feedback: FeedbackData) => void;
}

interface FeedbackData {
  feature: string;
  rating: number;
  message: string;
  screenshot?: string;
  userEmail?: string;
}

// Feature flags system
interface FeatureFlags {
  [key: string]: boolean;
}

const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>({});
  
  useEffect(() => {
    // Load flags from environment or API
    setFlags(window.FEATURE_FLAGS || {});
  }, []);
  
  return flags;
};
```

---

### Issue #24: Set Up Staging Data Seeding
**Labels**: `P2`, `M2-Deployment`, `MVP`, `database`, `ai-ready`  
**Depends on**: #22  
**Description**: Create data seeding scripts for consistent testing environment

**Acceptance Criteria**:
```
- [ ] Create seed data scripts:
  - [ ] 5 test user accounts with different subscription tiers
  - [ ] 20 pre-made characters with various classes/levels
  - [ ] 10 sample parties
  - [ ] 50 creature templates from SRD
  - [ ] 5 sample encounters in different states
  - [ ] Test combat scenarios
- [ ] Create seeding commands:
  - [ ] npm run seed:staging - full reset and seed
  - [ ] npm run seed:users - just users
  - [ ] npm run seed:creatures - just creatures
  - [ ] npm run seed:cleanup - remove test data
- [ ] Add test account documentation:
  - [ ] List of test accounts and passwords
  - [ ] What each account is set up to test
  - [ ] How to reset test data
- [ ] Implement safeguards:
  - [ ] Only run on staging environment
  - [ ] Confirmation prompt
  - [ ] Backup before seeding
```

**Example Test Accounts**:
```
Test Accounts for Staging:
1. dm@test.com / password123 - DM account with full features
2. player@test.com / password123 - Player account with basic access
3. premium@test.com / password123 - Premium subscriber
4. admin@test.com / password123 - Admin account
5. guest@test.com / password123 - Free tier user
```

---

### Issue #25: Create Basic Landing Page
**Labels**: `P2`, `M2-Deployment`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #8  
**Description**: Build a simple landing page for staging environment

**Acceptance Criteria**:
```
- [ ] Create landing page with:
  - [ ] App title and description
  - [ ] "Alpha Testing" badge
  - [ ] Login/Register buttons
  - [ ] Feature list
  - [ ] Feedback instructions
- [ ] Add staging-specific elements:
  - [ ] Test account information
  - [ ] Link to feedback form
  - [ ] Known issues list
  - [ ] Development roadmap
- [ ] Make responsive:
  - [ ] Mobile-friendly layout
  - [ ] Touch-optimized buttons
  - [ ] Readable on all devices
```

**UI Components to Create**:
```typescript
// Landing page sections
const LandingPage = () => {
  return (
    <div className="landing-page">
      <Header />
      <HeroSection />
      <FeatureList />
      <TestingInfo />
      <Footer />
    </div>
  );
};

const HeroSection = () => (
  <section className="hero">
    <div className="staging-banner">
      🧪 Alpha Testing Environment
    </div>
    <h1>D&D Encounter Tracker</h1>
    <p>Streamline your combat encounters</p>
    <div className="cta-buttons">
      <Button variant="primary">Start Testing</Button>
      <Button variant="secondary">Give Feedback</Button>
    </div>
  </section>
);
```

---

## Deployment Strategy

### Environment Configuration

**Staging Environment**:
```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  app:
    image: dnd-tracker:staging
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=${STAGING_DATABASE_URL}
      - REDIS_URL=${STAGING_REDIS_URL}
      - FEATURE_FLAGS=early_access,feedback_widget
    ports:
      - "3000:3000"
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.staging.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

**Feature Flags**:
```typescript
// Feature flags for staging
const STAGING_FEATURES = {
  early_access: true,
  feedback_widget: true,
  advanced_combat: false,
  premium_features: false,
  real_time_sync: false
};
```

### Testing Strategy

**Week 1 Testing Focus**:
1. **Basic Navigation**: Can users navigate the application?
2. **Registration Flow**: Is the signup process clear?
3. **Overall UX**: First impressions and usability
4. **Performance**: Page load times and responsiveness

**Feedback Collection**:
- In-app feedback widget for immediate input
- Weekly feedback review sessions
- User behavior analytics
- Performance monitoring

## Success Criteria

By the end of Week 1, the staging environment should have:

1. **Automated Deployment**:
   - Working CI/CD pipeline
   - Automatic deployments on develop branch pushes
   - Health checks and rollback capabilities

2. **User Testing Infrastructure**:
   - Feedback collection system
   - Test data seeding
   - Basic landing page with testing info

3. **Monitoring and Analytics**:
   - Uptime monitoring
   - Error logging
   - Basic user analytics

4. **Documentation**:
   - Deployment procedures
   - Testing guidelines
   - Feedback review process

**Benefits of Early Deployment**:
- **Continuous Feedback**: User input from Week 1 onwards
- **Real-world Testing**: Actual deployment environment testing
- **Team Validation**: Early validation of architecture decisions
- **Risk Mitigation**: Deployment issues discovered early
- **User Engagement**: Early user buy-in and community building

**Next Steps**: With deployment infrastructure ready, development can proceed with authentication (Milestone 3) while continuously deploying and testing new features.