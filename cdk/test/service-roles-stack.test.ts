import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServiceRolesStack } from '../lib/service-roles-stack';

const template = () =>
  Template.fromStack(new ServiceRolesStack(new cdk.App(), 'TestRolesStack'));

const roleWith = (service: string, policy: string) => ({
  AssumeRolePolicyDocument: Match.objectLike({
    Statement: [Match.objectLike({ Principal: { Service: service } })],
  }),
  ManagedPolicyArns: [
    Match.objectLike({
      'Fn::Join': Match.arrayWith([
        Match.arrayWith([Match.stringLikeRegexp(policy)]),
      ]),
    }),
  ],
});

describe('ServiceRolesStack', () => {
  test('lets ECS manage the load balancer, scaling and alarms', () => {
    template().hasResourceProperties(
      'AWS::IAM::Role',
      roleWith(
        'ecs.amazonaws.com',
        'AmazonECSInfrastructureRoleforExpressGatewayServices',
      ),
    );
  });

  test('lets tasks pull the image and write logs', () => {
    template().hasResourceProperties(
      'AWS::IAM::Role',
      roleWith('ecs-tasks.amazonaws.com', 'AmazonECSTaskExecutionRolePolicy'),
    );
  });
});
