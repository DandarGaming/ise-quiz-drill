import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: 'ise-quiz-drill',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // CI pushes an image on every merge, so old ones are cleaned up
      lifecycleRules: [{ maxImageCount: 20 }],
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
    });
  }
}
