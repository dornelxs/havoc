import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import {
  HttpApi,
  CorsHttpMethod,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { SecurityGroup, SubnetType, type Vpc } from "aws-cdk-lib/aws-ec2";
import { Runtime, type IFunction } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import * as path from "node:path";

export interface ApiStackProps extends StackProps {
  vpc: Vpc;
  dbSecret: ISecret;
  userPool: UserPool;
  userPoolClient: UserPoolClient;
}

const API_ROOT = path.join(__dirname, "../../api/src/handlers");

export class ApiStack extends Stack {
  public readonly httpApi: HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const lambdaSecurityGroup = new SecurityGroup(this, "ApiLambdaSg", {
      vpc: props.vpc,
      description: "Security group das Lambdas da API que acessam o RDS.",
      allowAllOutbound: true,
    });

    const makeHandler = (id: string, relativeEntry: string): IFunction => {
      const fn = new NodejsFunction(this, id, {
        entry: path.join(API_ROOT, relativeEntry),
        handler: "handler",
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(15),
        memorySize: 256,
        vpc: props.vpc,
        vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          DB_SECRET_ARN: props.dbSecret.secretArn,
        },
        bundling: { minify: true, sourceMap: true },
      });
      props.dbSecret.grantRead(fn);
      return fn;
    };

    // --- Handlers públicos (catálogo) ---
    const listProductsFn = makeHandler("ListProductsFn", "products/list.ts");
    const getProductFn = makeHandler("GetProductFn", "products/get-by-slug.ts");

    // --- Handlers autenticados (cliente) ---
    const listMyOrdersFn = makeHandler("ListMyOrdersFn", "orders/list-mine.ts");

    // --- Handlers admin ---
    const upsertProductFn = makeHandler(
      "UpsertProductFn",
      "admin/products/upsert.ts"
    );

    const jwtAuthorizer = new HttpJwtAuthorizer(
      "CognitoAuthorizer",
      `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`,
      {
        jwtAudience: [props.userPoolClient.userPoolClientId],
      }
    );

    this.httpApi = new HttpApi(this, "HavocHttpApi", {
      apiName: "havoc-api",
      corsPreflight: {
        // Ajustar allowOrigins pro domínio real do frontend antes de produção.
        allowOrigins: ["*"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Rotas públicas — sem authorizer.
    this.httpApi.addRoutes({
      path: "/products",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("ListProductsIntegration", listProductsFn),
    });
    this.httpApi.addRoutes({
      path: "/products/{slug}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetProductIntegration", getProductFn),
    });

    // Rotas autenticadas (qualquer customer logado) — authorizer exige JWT
    // válido do Cognito; a checagem fina de "é dono deste dado" continua
    // sendo feita dentro do handler (ver src/lib/auth.ts).
    this.httpApi.addRoutes({
      path: "/orders/mine",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("ListMyOrdersIntegration", listMyOrdersFn),
      authorizer: jwtAuthorizer,
    });

    // Rotas admin — mesmo authorizer JWT; o handler confere role === "admin"
    // explicitamente (API Gateway sozinho não sabe distinguir customer de
    // admin, só que o token é válido).
    this.httpApi.addRoutes({
      path: "/admin/products",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("UpsertProductIntegration", upsertProductFn),
      authorizer: jwtAuthorizer,
    });
    this.httpApi.addRoutes({
      path: "/admin/products/{id}",
      methods: [HttpMethod.PUT],
      integration: new HttpLambdaIntegration("UpdateProductIntegration", upsertProductFn),
      authorizer: jwtAuthorizer,
    });
  }
}
