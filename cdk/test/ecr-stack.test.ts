import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { EcrStack } from '../lib/ecr-stack';

const template = () =>
  Template.fromStack(new EcrStack(new cdk.App(), 'TestEcrStack'));

describe('EcrStack', () => {
  test('creates the image repository named after the project', () => {
    template().hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'ise-quiz-drill',
      ImageScanningConfiguration: { ScanOnPush: true },
    });
  });

  test('keeps the repository and its images when the stack is deleted', () => {
    template().hasResource('AWS::ECR::Repository', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  test('outputs the repository URI', () => {
    template().hasOutput('RepositoryUri', {});
  });
});
