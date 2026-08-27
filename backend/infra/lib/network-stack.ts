import { Stack, type StackProps } from "aws-cdk-lib";
import {
  Vpc,
  SubnetType,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
} from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";

/**
 * VPC compartilhada por RDS e pelas Lambdas que acessam o banco.
 *
 * Decisão de custo: NENHUM NAT Gateway. NAT Gateway cobra por hora ativa (na
 * casa de US$30+/mês só de existir, fora tráfego) — exatamente o tipo de
 * custo "sempre ativo" que a seção 3 da doc técnica pede pra evitar nesta
 * fase. Em vez disso:
 *
 *   - RDS e as Lambdas que falam com ele ficam em subnets ISOLATED (sem
 *     rota de saída à internet nenhuma — não precisam, só falam entre si
 *     dentro da VPC).
 *   - Se alguma Lambda nesta VPC precisar chamar um serviço AWS (Secrets
 *     Manager, S3, Cognito), isso é resolvido com VPC Endpoints
 *     (Gateway endpoint pra S3 é gratuito; Interface endpoints têm custo
 *     por hora bem menor que um NAT Gateway, e só devem ser adicionados
 *     quando o handler realmente precisar).
 *   - Lambdas que não precisam do RDS (ex.: as que só chamam Cognito) NÃO
 *     devem ser colocadas nesta VPC — rodar fora da VPC é mais simples e
 *     não tem esse custo de rede de jeito nenhum.
 */
export class NetworkStack extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, "HavocVpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "isolated",
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Gateway endpoint pra S3 é gratuito e permite que Lambdas nesta VPC
    // (ex.: a de resize de imagem, se algum dia precisar rodar aqui dentro)
    // alcancem o S3 sem NAT Gateway.
    this.vpc.addGatewayEndpoint("S3Endpoint", {
      service: GatewayVpcEndpointAwsService.S3,
    });

    // Interface endpoint pro Secrets Manager: as Lambdas de API ficam em
    // subnet isolated (sem NAT, sem rota de saída à internet) e precisam
    // buscar a credencial do RDS em src/lib/secrets.ts — sem este endpoint,
    // essa chamada travaria por falta de rota. Tem custo por hora (bem menor
    // que um NAT Gateway), mas é o mínimo necessário pro fluxo funcionar.
    this.vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });
  }
}
