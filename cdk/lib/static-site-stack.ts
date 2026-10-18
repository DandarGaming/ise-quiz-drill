import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export interface StaticSiteStackProps extends cdk.StackProps {
  apiOrigin?: string;
}

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: StaticSiteStackProps) {
    super(scope, id, props);

    // 1. Create S3 Bucket
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 2. Define CloudFront Function: Rewrite URL For Every Sub-pages
    const rewriteFunction = new cloudfront.Function(
      this,
      'RewriteUrlFunction',
      {
        code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var uri = request.uri;
          
          if (uri.endsWith('/')) {
            request.uri += 'index.html';
          } 
          else if (!uri.includes('.')) {
            request.uri += '/index.html';
          }
          
          return request;
        }
      `),
      },
    );

    // 3. Attach CloudFront Function into Distribution
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        functionAssociations: [
          {
            function: rewriteFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      ...(props?.apiOrigin
        ? {
            additionalBehaviors: {
              'api/*': {
                origin: new origins.HttpOrigin(props.apiOrigin, {
                  protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                originRequestPolicy: new cloudfront.OriginRequestPolicy(
                  this,
                  'ApiOriginRequestPolicy',
                  {
                    headerBehavior:
                      cloudfront.OriginRequestHeaderBehavior.allowList(
                        'Content-Type',
                        'CloudFront-Viewer-Address',
                      ),
                  },
                ),
                viewerProtocolPolicy:
                  cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
              },
            },
          }
        : {}),
      defaultRootObject: 'index.html',
    });

    // 4. Update automatically from dist/client to S3 (dist/server is runtime code, not for S3)
    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('./../dist/client')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'], // Automatic CloudFront CDN cache invalidation!
    });

    new cdk.CfnOutput(this, 'SiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
