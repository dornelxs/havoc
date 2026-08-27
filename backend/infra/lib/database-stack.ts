import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SecurityGroup,
  SubnetType,
  Peer,
  Port,
  type Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  Credentials,
  StorageType,
} from "aws-cdk-lib/aws-rds";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

export interface DatabaseStackProps extends StackProps {
  vpc: Vpc;
}

/**
 * RDS Postgres em `db.t4g.micro` — dentro do free tier de 12 meses (750h/mês,
 * cobre uma instância rodando o mês inteiro). Deliberadamente NÃO usa Aurora
 * Serverless v2 (seção 3 da doc técnica: ACU mínima do Aurora Serverless v2
 * custa mesmo ociosa, o que o torna caro demais nesta fase).
 */
export class DatabaseStack extends Stack {
  public readonly dbSecret: ISecret;
  public readonly dbSecretArn: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const dbSecurityGroup = new SecurityGroup(this, "DbSecurityGroup", {
      vpc: props.vpc,
      description: "Permite acesso ao RDS Postgres apenas de dentro da VPC.",
      allowAllOutbound: false,
    });

    // Só libera a porta do Postgres pra outros recursos dentro da própria
    // VPC (ex.: as Lambdas da API) — nunca exposto à internet.
    dbSecurityGroup.addIngressRule(
      Peer.ipv4(props.vpc.vpcCidrBlock),
      Port.tcp(5432),
      "Acesso ao Postgres a partir de dentro da VPC"
    );

    const instance = new DatabaseInstance(this, "HavocDatabase", {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16,
      }),
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      credentials: Credentials.fromGeneratedSecret("havoc_admin"),
      databaseName: "havoc",
      // Free tier: 20GB de storage gp2/gp3 inclusos.
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      storageType: StorageType.GP3,
      multiAz: false, // Multi-AZ dobra o custo — fora do free tier, não usar nesta fase.
      storageEncrypted: true, // Item 5 do checklist de segurança: criptografia em repouso.
      publiclyAccessible: false,
      backupRetention: Duration.days(7),
      deletionProtection: false, // true em produção, quando o projeto sair de fase de desenvolvimento.
      removalPolicy: RemovalPolicy.SNAPSHOT,
    });

    if (!instance.secret) {
      throw new Error("RDS não gerou um Secret de credenciais — verifique a configuração.");
    }

    this.dbSecret = instance.secret;
    this.dbSecretArn = instance.secret.secretArn;
  }
}
