  import { Construct } from "constructs";
  import { App, TerraformOutput, TerraformStack } from "cdktf";
  import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
  import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";

  class MyStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
      super(scope, id);

      // define provider
      new AwsProvider(this, "aws", {
        region: "us-west-1",
      });


      // create database in rds
      const dbInstance = new DbInstance(this, "lanchonete-database", {
        allocatedStorage: 10,
        engine: "postgres",
        engineVersion: "16",
        identifier: "lanchonete-db",
        instanceClass: "db.t3.micro",
        dbName: "lanchonetedatabase",
        username: "myuser",
        password: "mypassword",
        skipFinalSnapshot: true,
        vpcSecurityGroupIds: ["sg-0baf026fe6c20e3f2"],
      });
      
  
      // Output the database endpoint
      //new TerraformOutput(this, "dbEndpoint", {
      //  value: dbInstance.endpoint
      //})
    }
  }

  const app = new App();
  new MyStack(app, "database");
  app.synth();
