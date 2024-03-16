  import { Construct } from "constructs";
  import { App, TerraformOutput, TerraformStack } from "cdktf";
  import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
  import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
  import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
  import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";

  class MyStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
      super(scope, id);

      // define provider
      new AwsProvider(this, "aws", {
        region: process.env.AWS_DEFAULT_REGION,
      });

      const vpcSecurityGroupId = process.env.VPC_SECURITY_GROUP_ID;

      // create security group
      const dbSecurityGroup = new SecurityGroup(this, 'dbSecurityGroup', {
        vpcId: vpcSecurityGroupId,
        description: 'Security group for lanchonete database',
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
        skipFinalSnapshot: true,
        vpcSecurityGroupIds: [dbSecurityGroup.id ?? ""],
      });


      // Save Database user
      new SsmParameter(this, "dbUser", {
        name: "/database/user",
        type: "String",
        value: process.env.DB_USER,
        overwrite: true,
      });

      // Save Database address with port
      new SsmParameter(this, "dbAddress", {
        name: "/database/address",
        type: "String",
        value: dbInstance.endpoint,
        overwrite: true,
      });


      // Save Database password
      new SsmParameter(this, "dbPassword", {
        name: "/database/password",
        type: "SecureString",
        value: process.env.DB_PASSWORD,
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
