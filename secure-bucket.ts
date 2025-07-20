import { Construct } from 'constructs';
import {
  Bucket,
  BucketEncryption,
  BucketProps,
} from 'aws-cdk-lib/aws-s3';
import {
  Role,
  WebIdentityPrincipal,
  ManagedPolicy,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';

export interface SecureBucketProps {
  projectId: string;
  enableVersioning?: boolean;
  enableEncryption?: boolean;
  githubRepo?: string; // Example:, 'username/reponame'
}

export class SecureBucket extends Construct {
  public readonly bucketName: string;
  public readonly oidcRoleArn?: string;

  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);

    const bucket = new Bucket(this, 'SecureS3Bucket', {
      bucketName: `${props.projectId}-my-bucket`,
      versioned: props.enableVersioning ?? false,
      encryption: props.enableEncryption
        ? BucketEncryption.S3_MANAGED
        : BucketEncryption.UNENCRYPTED,
    });

    this.bucketName = bucket.bucketName;

    if (props.githubRepo) {
      const oidcRole = new Role(this, 'GitHubOIDCRole', {
        roleName: `${props.projectId}-github-oidc-role`,
        assumedBy: new WebIdentityPrincipal('token.actions.githubusercontent.com').withConditions({
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            'token.actions.githubusercontent.com:sub': `repo:${props.githubRepo}:*`,
          },
        }),
        managedPolicies: [
          ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        ],
      });

      this.oidcRoleArn = oidcRole.roleArn;

      new CfnOutput(this, 'OIDCRoleArn', {
        value: this.oidcRoleArn,
      });
    }

    new CfnOutput(this, 'BucketName', {
      value: this.bucketName,
    });
  }
}
