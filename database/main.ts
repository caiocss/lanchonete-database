import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { InternetGatewayAttachment } from "@cdktf/provider-aws/lib/internet-gateway-attachment";


class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define provider
    new AwsProvider(this, "aws", {
      region: process.env.AWS_DEFAULT_REGION,
    });

    const vpc = new Vpc(this, 'db-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        Name: 'database-vpc',
      },
    });

    const internetGateway = new InternetGateway(this, 'dbInternetGateway', {
      tags: {
        Name: 'database-internet-gateway',
      },
    });

    new InternetGatewayAttachment(this, 'vpcInternetGatewayAttachment', {
      vpcId: vpc.id,
      internetGatewayId: internetGateway.id,
    });

    // create subnets
    const subnet1 = new Subnet(this, 'subnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: 'database-us-east-1a',
      },
    });

    const subnet2 = new Subnet(this, 'subnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: 'database-us-east-1b',
      },
    });

    // create DB subnet group
    new DbSubnetGroup(this, 'dbSubnetGroup', {
      name: 'db-subnet-group',
      subnetIds: [subnet1.id, subnet2.id],
    });


    // const vpcId = process.env.VPC_SECURITY_GROUP_ID;


    // create security group
    const dbSecurityGroup = new SecurityGroup(this, 'dbSecurityGroup', {
      vpcId: vpc.id,
      name: 'lanchonete-database-sg',
      description: 'Security group for lanchonete database',
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0']
        },
      ],
    });

    // create database
    const dbInstance = new DbInstance(this, "lanchonete-database", {
      allocatedStorage: 10,
      engine: "postgres",
      engineVersion: "16",
      identifier: "lanchonete-db",
      instanceClass: "db.t3.micro",
      dbName: "lanchonetedatabase",
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      publiclyAccessible: true,
      skipFinalSnapshot: true,
      dbSubnetGroupName: 'db-subnet-group',
      vpcSecurityGroupIds: [dbSecurityGroup.id],
    });


    // Save Database user
    new SsmParameter(this, "dbUser", {
      name: "/database/user",
      type: "String",
      value: process.env.DB_USER,
      overwrite: true,
    });

    // Save Database password
    new SsmParameter(this, "dbPassword", {
      name: "/database/password",
      type: "SecureString",
      value: process.env.DB_PASSWORD,
      overwrite: true,
    });

    // Save Database hostname
    new SsmParameter(this, "dbHostname", {
      name: "/database/hostname",
      type: "String",
      value: dbInstance.endpoint.split(":")[0],
      overwrite: true,
    });

    // Save Database port
    new SsmParameter(this, "dbPort", {
      name: "/database/port",
      type: "String",
      value: dbInstance.port.toString(),
      overwrite: true,
    });

    // Output the database endpoint
    new TerraformOutput(this, "dbEndpoint", {
      value: dbInstance.endpoint
    })
  }
}

const app = new App();
new MyStack(app, "database");
app.synth();
