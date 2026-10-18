import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { StaticSiteStack } from '../lib/static-site-stack';

describe('StaticSiteStack', () => {
  test('routes API requests to the ECS service without caching or URL rewriting', () => {
    const app = new cdk.App();
    const template = Template.fromStack(
      new StaticSiteStack(app, 'TestStaticSiteStack', {
        env: { account: '123456789012', region: 'eu-west-1' },
        apiOrigin: 'service.example.com',
      }),
    );

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({
            PathPattern: 'api/*',
            TargetOriginId: Match.anyValue(),
            AllowedMethods: [
              'GET',
              'HEAD',
              'OPTIONS',
              'PUT',
              'PATCH',
              'POST',
              'DELETE',
            ],
            CachePolicyId: Match.anyValue(),
            OriginRequestPolicyId: Match.anyValue(),
            ViewerProtocolPolicy: 'https-only',
          }),
        ]),
        Origins: Match.arrayWith([
          Match.objectLike({
            DomainName: 'service.example.com',
            CustomOriginConfig: Match.objectLike({
              OriginProtocolPolicy: 'https-only',
            }),
          }),
        ]),
      },
    });
    template.hasResourceProperties('AWS::CloudFront::OriginRequestPolicy', {
      OriginRequestPolicyConfig: {
        CookiesConfig: { CookieBehavior: 'none' },
        HeadersConfig: {
          HeaderBehavior: 'whitelist',
          Headers: ['Content-Type', 'CloudFront-Viewer-Address'],
        },
        QueryStringsConfig: { QueryStringBehavior: 'none' },
      },
    });
  });
});
