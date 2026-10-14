import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

// IAM roles for the ECS Express service, kept apart from ServiceStack so a
// failed deploy that rolls ServiceStack back does not delete them (ADR-007)
export class ServiceRolesStack extends cdk.Stack {
  readonly infrastructureRole: iam.Role;
  readonly executionRole: iam.Role;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lets ECS create the load balancer, target groups and scaling for us
    this.infrastructureRole = new iam.Role(this, 'InfrastructureRole', {
      assumedBy: new iam.ServicePrincipal('ecs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSInfrastructureRoleforExpressGatewayServices',
        ),
      ],
    });

    // Lets the task pull the image from ECR and write logs
    this.executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });
  }
}
