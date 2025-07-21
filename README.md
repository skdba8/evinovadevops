# evinovadevops
#  Evinova DevOps Infrastructure (CDK + GitHub OIDC)

This project provisions AWS infrastructure using the AWS Cloud Development Kit (CDK) in TypeScript. It is designed to securely deploy resources such as an S3 bucket with KMS encryption and an IAM role configured for GitHub Actions using OIDC (OpenID Connect) for secure, short-lived authentication.

---

##  Project Structure

your-cdk-project/
── .github/workflows/deploy.yml    # GitHub Actions deployment workflow
── bin/cdk-app.ts                  # CDK app entry point
── lib/secure-bucket.ts            # Custom CDK construct (S3 + OIDC role)
── lib/cdk-stack.ts                # Stack using the construct
── test/cdk-stack.test.ts          # Jest test for infrastructure
── jest.config.js                  # Jest config file
── cdk.json                        # CDK configuration
── package.json                    # Node project metadata & scripts
── tsconfig.json                   # TypeScript config
── README.md                       # You're here!

---

##  What It Deploys

-  S3 bucket: evinovadevops-secure-bucket
-  KMS key: arn:aws:kms:us-east-1:248896117205:key/0c7e8b39-f431-4aa9-a187-ac430fb8030a
-  GitHub OIDC IAM role for repo: skdba8/evinovadevops
-  Outputs:
- IAM role ARN
- S3 bucket name

---

##  GitHub OIDC Role (No Secrets Required)

This project uses AWS IAM + GitHub OpenID Connect (OIDC) to avoid long-lived AWS credentials in CI.

IAM Role Trust Policy Example:

{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:skdba8/evinovadevops:*"
    }
  }
}

---

##  Deployment Flow via GitHub Actions

GitHub Workflow: `.github/workflows/deploy.yml`

 Step             Description                                                 
------------------------------------------------------------------------------
 npm ci           Installs Node dependencies                                  
 npm test         Runs Jest unit tests                                        
 cdk synth        Synthesizes the CloudFormation template                     
|cdk deploy       Deploys the CDK stack using temporary OIDC credentials      
|configure-aws-credentials  Uses OIDC to assume the IAM role securely        

---

##  Setup Instructions

1. Install dependencies:

   npm install

2. Run unit tests:

   npm test

3. Bootstrap CDK (first time only):

   npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>

4. Deploy stack locally:

   npx cdk deploy

Or let GitHub Actions do it automatically on push to `main`.

---

##  GitHub Actions Integration

GitHub OIDC usage block:

- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/evinovadevops-secure-bucket-oidc-role
    aws-region: us-east-1

---

##  Unit Testing with Jest

Test example in `test/your-cdk-stack.test.ts`:

import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { YourCdkStack } from '../lib/your-cdk-stack';

test('S3 bucket and role created', () => {
  const app = new cdk.App();
  const stack = new YourCdkStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::IAM::Role', {
    RoleName: 'evinovadevops-secure-bucket-oidc-role'
  });

  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'evinovadevops-secure-bucket'
  });
});

Run tests:

   npm test

---

##  Notes

- The bucket and KMS key must already exist in AWS.
- The IAM role is scoped only to this bucket and this KMS key.
- No secrets are used — authentication is handled securely via GitHub OIDC.

---



