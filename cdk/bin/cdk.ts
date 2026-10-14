#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StaticSiteStack } from '../lib/static-site-stack';
import { EcrStack } from '../lib/ecr-stack';
import { ServiceRolesStack } from '../lib/service-roles-stack';
import { ServiceStack } from '../lib/service-stack';

const app = new cdk.App();
new StaticSiteStack(app, 'CdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: '468204079455', region: 'eu-west-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new EcrStack(app, 'EcrStack', {
  env: { account: '468204079455', region: 'eu-west-1' },
});

const roles = new ServiceRolesStack(app, 'ServiceRolesStack', {
  env: { account: '468204079455', region: 'eu-west-1' },
});

// CI passes the short commit SHA: cdk deploy ServiceStack -c imageTag=<sha>
new ServiceStack(app, 'ServiceStack', {
  env: { account: '468204079455', region: 'eu-west-1' },
  imageTag: app.node.tryGetContext('imageTag') ?? 'latest',
  roles,
});
