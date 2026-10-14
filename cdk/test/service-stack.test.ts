import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServiceRolesStack } from '../lib/service-roles-stack';
import { ServiceStack } from '../lib/service-stack';

const env = { account: '123456789012', region: 'eu-west-1' };

const template = (imageTag = 'abc1234') => {
  const app = new cdk.App();
  const roles = new ServiceRolesStack(app, 'TestRolesStack', { env });
  return Template.fromStack(
    new ServiceStack(app, 'TestServiceStack', { env, imageTag, roles }),
  );
};

describe('ServiceStack', () => {
  test('runs the image tag it is given from the project repository', () => {
    template('9f8e7d6').hasResourceProperties(
      'AWS::ECS::ExpressGatewayService',
      {
        ServiceName: 'ise-quiz-drill',
        PrimaryContainer: Match.objectLike({
          Image:
            '123456789012.dkr.ecr.eu-west-1.amazonaws.com/ise-quiz-drill:9f8e7d6',
          ContainerPort: 4321,
        }),
      },
    );
  });

  test('checks the app health endpoint', () => {
    template().hasResourceProperties('AWS::ECS::ExpressGatewayService', {
      HealthCheckPath: '/api/health',
    });
  });

  test('runs one small task and scales to two at most', () => {
    template().hasResourceProperties('AWS::ECS::ExpressGatewayService', {
      Cpu: '256',
      Memory: '512',
      ScalingTarget: { MinTaskCount: 1, MaxTaskCount: 2 },
    });
  });

  // A failed deploy rolls this stack back; the roles must outlive it so ECS
  // can still clean up the service it started
  test('uses roles from the roles stack instead of creating its own', () => {
    const t = template();
    t.resourceCountIs('AWS::IAM::Role', 0);
    t.hasResourceProperties('AWS::ECS::ExpressGatewayService', {
      InfrastructureRoleArn: { 'Fn::ImportValue': Match.anyValue() },
      ExecutionRoleArn: { 'Fn::ImportValue': Match.anyValue() },
    });
  });

  describe('health alarm', () => {
    const alarm = () => {
      const alarms = template().findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms)).toHaveLength(1);
      return Object.values(alarms)[0].Properties;
    };
    const healthyHostMetrics = () =>
      (alarm().Metrics as { MetricStat?: { Metric: { MetricName: string } } }[])
        .filter((m) => m.MetricStat)
        .map((m) => m.MetricStat!.Metric.MetricName);

    // Express Mode deploys blue/green across two target groups, so the alarm
    // must count healthy tasks in both or it goes blind after each deploy
    test('counts healthy tasks across both target groups', () => {
      expect(healthyHostMetrics()).toEqual([
        'HealthyHostCount',
        'HealthyHostCount',
      ]);
    });

    test('fires after three minutes with no healthy task', () => {
      expect(alarm()).toMatchObject({
        ComparisonOperator: 'LessThanThreshold',
        Threshold: 1,
        EvaluationPeriods: 3,
        DatapointsToAlarm: 3,
      });
    });

    test('treats missing data as unhealthy', () => {
      expect(alarm().TreatMissingData).toBe('breaching');
    });
  });

  test('outputs the service URL', () => {
    template().hasOutput('ServiceUrl', {});
  });
});
