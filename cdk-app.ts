#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { YourCdkStack } from '../lib/your-cdk-stack';

const app = new cdk.App();
new YourCdkStack(app, 'YourCdkStack');
