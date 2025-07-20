import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecureBucket } from '../lib/secure-bucket';

test('S3 Bucket is versioned and encrypted', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack');

  new SecureBucket(stack, 'TestBucket', {
    projectId: 'testproj',
    enableVersioning: true,
    enableEncryption: true,
    githubRepo: 'myorg/myrepo',
  });

  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::S3::Bucket', {
    VersioningConfiguration: { Status: 'Enabled' },
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
        },
      ],
    },
  });

  template.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: expect.arrayContaining([
        expect.objectContaining({
          Principal: {
            Federated: 'arn:aws:iam::aws:policy/WebIdentityPrincipal',
          },
        }),
      ]),
    },
  });
});
