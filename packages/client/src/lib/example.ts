// Example demonstrating import from shared package
import { SubscriptionTier, HTTP_STATUS } from '@dnd-tracker/shared';
import { createUserSchema } from '@dnd-tracker/shared/schemas';

export const exampleFunction = () => {
  console.log('Testing cross-package imports in client:');
  console.log('Subscription tiers:', Object.values(SubscriptionTier));
  console.log('HTTP status codes:', HTTP_STATUS);
  console.log('User schema:', createUserSchema);
};