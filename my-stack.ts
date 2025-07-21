import { SecureBucket } from './secure-bucket';

new SecureBucket(this, 'SecureResources', {
  githubRepo: 'skdba8/evinovadevops',
  bucketName: 'evinovadevops-secure-bucket',
  kmsKeyArn: 'arn:aws:kms:us-east-1:248896117205:key/0c7e8b39-f431-4aa9-a187-ac430fb8030a',
});
