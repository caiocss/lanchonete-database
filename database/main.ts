  import { Construct } from "constructs";
  import { App, TerraformOutput, TerraformStack } from "cdktf";
  import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
  import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";

  class MyStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
      super(scope, id);

      // define resources here

      new AwsProvider(this, "aws", {
        region: "us-west-1", // Set your desired region
      });
  
      const dbInstance = new DbInstance(this, "lanchonete-database", {
        allocatedStorage: 10, // Set storage size in GB
        engine: "postgres",
        engineVersion: "16",
        identifier: "lanchonete-db",
        instanceClass: "db.t3.micro", // Choose an appropriate instance type
        dbName: "lanchonetedatabase",
        username: "myuser",
        password: "mypassword",
        skipFinalSnapshot: true, // Set to true if you don't want a final snapshot
        vpcSecurityGroupIds: ["sg-0baf026fe6c20e3f2"], // Specify your security group(s)
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
