import { Construct } from 'constructs';
import {
  aws_s3 as s3,
  aws_iam as iam,
  aws_kms as kms,
  CfnOutput,
  Stack,
} from 'aws-cdk-lib';

export interface SecureBucketProps {
  githubRepo: string;      // e.g., 'skdba8/evinovadevops'
  bucketName: string;      // e.g., 'evinovadevops-secure-bucket'
  kmsKeyArn: string;       // e.g., full KMS ARN
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.IBucket;
  public readonly oidcRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);

    const { githubRepo, bucketName, kmsKeyArn } = props;

    // Import existing S3 bucket by name
    this.bucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', bucketName);

    // Import existing KMS key by ARN
    const encryptionKey = kms.Key.fromKeyArn(this, 'ImportedKmsKey', kmsKeyArn);

    // Create GitHub OIDC IAM Role
    this.oidcRole = new iam.Role(this, 'GitHubOIDCRole', {
      roleName: `${bucketName}-oidc-role`,
      description: `OIDC Role for GitHub Actions deployments from ${githubRepo}`,
      assumedBy: new iam.WebIdentityPrincipal(
        `arn:aws:iam::${Stack.of(this).account}:oidc-provider/token.actions.githubusercontent.com`,
        {
          "StringLike": {
            "token.actions.githubusercontent.com:sub": `repo:${githubRepo}:*`
          }
        }
      ),
    });

    // Attach scoped permissions to the OIDC role
    this.oidcRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      resources: [
        `arn:aws:s3:::${bucketName}`,
        `arn:aws:s3:::${bucketName}/*`
      ],
    }));

    this.oidcRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      resources: [kmsKeyArn],
    }));

    // Outputs
    new CfnOutput(this, 'ImportedBucketName', {
      value: this.bucket.bucketName,
      description: 'Imported S3 bucket name',
    });

    new CfnOutput(this, 'OIDCRoleArn', {
      value: this.oidcRole.roleArn,
      description: 'GitHub OIDC IAM Role ARN',
    });
  }
}
