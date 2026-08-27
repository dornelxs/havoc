import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { Bucket, BlockPublicAccess, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Distribution, ViewerProtocolPolicy, AllowedMethods } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import type { Construct } from "constructs";

/**
 * Bucket de imagens de produto + CloudFront na frente.
 *
 * A transformação sob demanda (resize + conversão pra WebP, seção 9 da doc
 * técnica) é um passo seguinte deliberadamente não incluído neste scaffold
 * inicial — o padrão de referência é o AWS Serverless Image Handler
 * (Lambda@Edge ou Lambda origin-response acionada pelo CloudFront). Por ora,
 * o bucket serve os arquivos como o admin fizer upload; adicionar a Lambda
 * de transformação é o próximo passo natural quando o painel admin de
 * upload existir.
 */
export class StorageStack extends Stack {
  public readonly bucket: Bucket;
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, "ProductImagesBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      // Criptografia em repouso (SSE-S3) é o padrão do bucket quando a prop
      // `encryption` é omitida — já satisfaz o item 5 do checklist de
      // segurança sem configuração extra.
      cors: [
        {
          allowedMethods: [HttpMethods.PUT, HttpMethods.POST],
          allowedOrigins: ["*"], // Restringir ao domínio do painel admin antes de produção.
          allowedHeaders: ["*"],
          maxAge: 3000,
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.distribution = new Distribution(this, "ProductImagesDistribution", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        // cachePolicy omitida: CDK usa CACHING_OPTIMIZED por padrão.
      },
      // minimumProtocolVersion omitida: CDK usa TLS 1.2+ por padrão.
    });
  }
}
