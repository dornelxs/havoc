import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import {
  UserPool,
  UserPoolClient,
  AccountRecovery,
  StringAttribute,
} from "aws-cdk-lib/aws-cognito";
import { SecurityGroup, SubnetType, type Vpc } from "aws-cdk-lib/aws-ec2";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import * as path from "node:path";

export interface AuthStackProps extends StackProps {
  vpc: Vpc;
  dbSecret: ISecret;
}

/**
 * Cognito User Pool — free tier permanente até 50.000 MAU (não é trial de 12
 * meses, ver seção 3 da doc técnica). Cobre cadastro/login público de
 * clientes.
 *
 * Contas de admin NUNCA são criadas por aqui (não há rota de self-signup
 * pra admin) — são provisionadas manualmente via AdminCreateUserCommand ou
 * pelo Console do Cognito, fora do fluxo público (seção 7 da doc técnica).
 */
export class AuthStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const postConfirmationSg = new SecurityGroup(this, "PostConfirmationSg", {
      vpc: props.vpc,
      description: "Security group da Lambda de trigger PostConfirmation do Cognito.",
      allowAllOutbound: true,
    });

    const postConfirmationFn = new NodejsFunction(this, "PostConfirmationFn", {
      entry: path.join(
        __dirname,
        "../../api/src/handlers/auth/post-confirmation.ts"
      ),
      handler: "handler",
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      // Precisa estar na mesma VPC do RDS — o banco não é publicamente
      // acessível (ver database-stack.ts) e este trigger grava em CUSTOMERS
      // a cada novo cadastro confirmado.
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      securityGroups: [postConfirmationSg],
      environment: {
        DB_SECRET_ARN: props.dbSecret.secretArn,
      },
      bundling: { minify: true, sourceMap: true },
    });
    props.dbSecret.grantRead(postConfirmationFn);

    this.userPool = new UserPool(this, "HavocUserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: false, mutable: true },
      },
      customAttributes: {
        // Espaço reservado caso surja necessidade de atributo customizado no
        // futuro — deliberadamente NÃO existe um atributo de "role" aqui.
        // Role vive só na tabela `customers` do RDS, nunca no token do
        // Cognito nem em atributo editável pelo usuário (seção 7 da doc
        // técnica).
        placeholder: new StringAttribute({ mutable: false }),
      },
      passwordPolicy: {
        minLength: 10,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: {
        postConfirmation: postConfirmationFn,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.userPoolClient = this.userPool.addClient("HavocWebClient", {
      authFlows: { userSrp: true },
      generateSecret: false, // client público (SPA/Next.js no browser) não usa client secret.
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    });
  }
}
