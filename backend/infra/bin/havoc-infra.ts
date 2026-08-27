#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";
import { AuthStack } from "../lib/auth-stack";
import { ApiStack } from "../lib/api-stack";
import { StorageStack } from "../lib/storage-stack";

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "sa-east-1", // São Paulo, mais perto do público-alvo brasileiro.
};

const network = new NetworkStack(app, "Havoc-Network", { env });

const database = new DatabaseStack(app, "Havoc-Database", {
  env,
  vpc: network.vpc,
});

const auth = new AuthStack(app, "Havoc-Auth", {
  env,
  vpc: network.vpc,
  dbSecret: database.dbSecret,
});

new ApiStack(app, "Havoc-Api", {
  env,
  vpc: network.vpc,
  dbSecret: database.dbSecret,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
});

new StorageStack(app, "Havoc-Storage", { env });
