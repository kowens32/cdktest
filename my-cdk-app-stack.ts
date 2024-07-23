import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true // Adjust this based on your setup
    });

    // RDS Instance
    const rdsInstance = rds.DatabaseInstance.fromDatabaseInstanceAttributes(this, 'RDSInstance', {
      instanceEndpointAddress: 'your-rds-endpoint',
      port: 3306, // Change if your RDS is using a different port
      instanceIdentifier: 'your-rds-instance-identifier',
      securityGroups: [] // If you have any security groups, specify them here
    });

    // Secret containing RDS credentials
    const rdsSecret = secretsmanager.Secret.fromSecretAttributes(this, 'RDSSecret', {
      secretPartialArn: 'arn:aws:secretsmanager:your-secret-arn'
    });

    // Lambda function
    const lambdaFunction = new lambda.Function(this, 'MyLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'), // Folder containing your Lambda code
      handler: 'index.handler',
      vpc: vpc,
      environment: {
        DB_HOST: rdsInstance.instanceEndpoint.hostname,
        DB_USER: rdsSecret.secretValueFromJson('username').toString(),
        DB_PASS: rdsSecret.secretValueFromJson('password').toString(),
        DB_NAME: 'your-database-name'
      }
    });

    // Grant Lambda permissions to access the RDS secret
    rdsSecret.grantRead(lambdaFunction);

    // Allow Lambda to connect to RDS
    rdsInstance.connections.allowDefaultPortFrom(lambdaFunction);

    // IAM Policy for Lambda to access RDS
    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['rds-db:connect'],
      resources: [rdsInstance.instanceArn]
    }));
  }
}
