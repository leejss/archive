---
title: "AWS 컨테이너 인프라: ALB와 ECS를 깔끔하게 쓰는 법"
publishedAt: 2026-03-12
tags: ["AWS", "ALB", "ECS", "Infrastructure", "CDK"]
aiGenerated: true
---

# AWS 컨테이너 인프라: ALB와 ECS를 깔끔하게 쓰는 법

좋은 인프라는 리소스를 많이 붙여서 만드는 게 아닙니다. 각 부품이 뭘 하는지, 어디까지 책임지는지가 명확한 게 좋은 인프라입니다. AWS CDK나 Terraform 같은 도구는 이 부품들을 쉽게 조립할 수 있게 해주지만, 한 가지 위험한 점이 있습니다. 몇 줄의 코드가 단순한 시스템을 뜻하는 게 아니라는 겁니다. 자세히 보면 복잡한 운영 규칙이 추상화 안에 숨어 있을 수 있거든요.

이 글의 목표는 각 AWS 서비스의 사용법을 외우는 것이 아닙니다. 대신 장애가 나면 어디를 봐야 하는지, 비용을 줄이려면 뭘 포기하는 건지, 배포가 실패하면 누가 감지하고 누가 고치는 건지 이런 질문들에 답할 수 있게 되는 게 목표입니다.

---

## 1. ALB와 ECS는 다른 일을 합니다

가장 흔한 헷갈림은 "ALB는 ECS 서비스의 일부"라고 생각하는 거예요. 실제로 자주 함께 배포되지만, AWS에서는 완전히 다른 리소스이고 부서지는 방식도 다릅니다.

### ALB는 트래픽 정리 담당

ALB는 외부 요청의 첫 번째 문을 지킵니다. HTTP 요청이 들어오면 어디로 보낼지 결정하고, 받는 쪽의 상태를 계속 확인해서 문제 있는 곳에는 요청을 안 보냅니다. 여기서 중요한 건 ALB가 애플리케이션을 실행하지 않는다는 점입니다. ALB는 요청을 정렬해서 전달하고, 서비스의 입구가 안정적이 되도록 지키는 게 전부예요.

### ECS Service는 컨테이너 생명 관리 담당

ECS Service의 일은 원하는 개수의 태스크(컨테이너)를 항상 띄워두는 것입니다. 태스크가 죽으면 새로 띄우고, 새 버전을 배포할 때는 차례대로 교체하며, 건강 상태를 체크해서 서비스를 안정적으로 유지합니다. 핵심은 ECS가 외부 사용자 요청을 받지 않는다는 점입니다. ECS는 실행 상태와 생명 주기만 봅니다.

### Target Group은 둘 사이의 다리

Target Group은 ALB와 ECS를 이어주는 계약 같은 역할을 합니다. ALB는 Target Group에 등록된 태스크들을 봐서 요청을 보내고, ECS는 살아 있는 태스크를 등록했다가 종료될 태스크는 제거합니다. Fargate 태스크는 각각 고유 IP를 가지므로, 실제로는 `Task IP:Port` 조합이 타겟이 됩니다. 결국 Target Group은 "지금 현재 요청을 받을 준비가 된 실행 단위가 뭔가"를 시스템이 합의하는 장소입니다.

실무에서는 보통 외부 포트와 내부 포트가 다릅니다. 사용자는 `80`이나 `443`으로 접근하지만, 앱 컨테이너는 내부에서 `3000`이나 `8080`을 열고 있을 수 있죠. 이건 단순한 숫자 차이가 아닙니다. 외부 포트는 서비스 약속이고, 내부 포트는 앱이 어떻게 만들어졌는지를 보여줍니다. 이렇게 분리해두면 앱 포트를 바꿔도 외부 사용자는 같은 주소로 접속할 수 있습니다.

CDK 코드에서는 보통 이렇게 나타납니다.

```typescript
const loadBalancer = new elbv2.ApplicationLoadBalancer(this, "Alb", {
  vpc,
  internetFacing: true,
});

const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "App", {
  cluster,
  loadBalancer,
  listenerPort: 80,
  taskImageOptions: {
    image: ecs.ContainerImage.fromRegistry("nginx:latest"),
    containerPort: 3000,
  },
});
```

여기서 `listenerPort`와 `containerPort`가 다를 수 있다는 점이 핵심입니다. 코드는 짧지만 그 안에 입구 계층과 실행 계층이 확실히 분리되어 있어요.

---

## 2. 보안은 "퍼블릭인가 프라이빗인가"보다 "우회할 수 있는가"가 중요해요

흔한 규칙이 있습니다. "태스크는 무조건 Private Subnet에 두세요." 나쁜 규칙은 아니지만, 이 규칙만 외우면 절반만 이해하는 거예요. 정말 중요한 질문은 이것입니다.

> 사용자가 ALB를 거치지 않고 태스크에 직접 들어갈 수 있나요?

가장 좋은 패턴은 보안 그룹을 연쇄로 엮는 거예요. ALB는 인터넷에서 오는 `80`이나 `443`을 받고, 태스크는 `ALB 보안 그룹에서 온 애플리케이션 포트`만 허용합니다. 이게 만드는 건 단순한 규칙이 아니라 아키텍처 경계입니다.

무슨 뜻인가요? 인터넷은 ALB까지는 올 수 있지만, 태스크는 ALB를 통해서만 트래픽을 받습니다. 그래서 누군가 ALB를 건너뛰고 앱 포트로 직접 접속하는 경로는 차단됩니다. 이게 진짜 보안입니다.

실무에서 중요한 팁이 하나 있습니다. **태스크가 Public Subnet에 있고 공인 IP를 가져도, 태스크 보안 그룹이 `ALB 보안 그룹에서 온 포트`만 허용하면 외부 직접 접근은 차단할 수 있어요.** "Public Subnet = 위험"은 아닙니다.

CDK에서는 이렇게 표현합니다.

```typescript
const albSecurityGroup = new ec2.SecurityGroup(this, "AlbSecurityGroup", { vpc });
albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

const taskSecurityGroup = new ec2.SecurityGroup(this, "TaskSecurityGroup", { vpc });
taskSecurityGroup.addIngressRule(
  albSecurityGroup,
  ec2.Port.tcp(3000),
  "Allow traffic from ALB only",
);
```

이 코드는 포트를 여는 것이 아니라 "인터넷 → ALB → Task"라는 정상 경로만 열고 나머지는 닫는다는 의도를 고정합니다.

그렇다면 Public Task는 안 될까요? 아닙니다. 차이는 보안의 깊이에 있을 뿐입니다. "Public Task + 보안 그룹"은 논리적으로만 막고, "Private Task + NAT나 VPC Endpoint"는 네트워크 경로 자체를 막습니다. 즉, 공개 태스크는 가능하고 많이 씁니다만, 더 얇은 안전장치 위에 있고, 프라이빗 태스크는 더 복잡하고 비싸지만 실수할 여유가 더 있어요.

### 정말 피해야 할 것

진짜 피해야 할 패턴은 공개 태스크에 `0.0.0.0/0`(누구든)을 열어서 ALB 우회를 가능하게 하는 거입니다. 공인 IP가 있다는 사실보다 우회 경로가 생겼다는 게 진짜 문제입니다.

---

## 3. 네트워크 설계: 보안도 중요하지만 비용도 봐야 해요

팀이 초기 설계에서 공개 서브넷 태스크를 선택하는 이유는 간단합니다. ECR에서 이미지를 다운받고 CloudWatch Logs에 로그를 보내는 데 NAT Gateway나 여러 VPC Endpoint 같은 추가 구성이 필요 없거든요. 대신 프라이빗 서브넷으로 가면 보안은 좋아지지만 네트워크 설계와 비용 계산이 따라옵니다.

공개 태스크 패턴은 보통 이렇습니다.

```typescript
const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "PublicApp", {
  cluster,
  assignPublicIp: true,
  taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
  taskImageOptions: {
    image: ecs.ContainerImage.fromRegistry("public.ecr.aws/nginx/nginx:latest"),
    containerPort: 3000,
  },
});
```

프라이빗 태스크는 네트워크 경로를 직접 만들어야 합니다.

```typescript
const vpc = new ec2.Vpc(this, "Vpc", {
  natGateways: 0,
  subnetConfiguration: [
    { name: "public", subnetType: ec2.SubnetType.PUBLIC },
    { name: "private", subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  ],
});

vpc.addInterfaceEndpoint("EcrApiEndpoint", {
  service: ec2.InterfaceVpcEndpointAwsService.ECR,
});

vpc.addInterfaceEndpoint("EcrDockerEndpoint", {
  service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
});

vpc.addGatewayEndpoint("S3Endpoint", {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});
```

같은 "컨테이너 배포"인데 한쪽은 간단함을 사고, 다른 한쪽은 통제를 압니다. 코드 양의 차이는 곧 운영 방식의 차이입니다.

실무에서는 보통 세 가지 선택지가 있습니다.

**첫 번째: 공개 태스크 + 보안 그룹 체이닝**
- 가장 간단하고 빠릅니다
- 아웃바운드 트래픽 비용이 거의 없습니다
- 대신 보안 그룹 실수에 더 민감합니다
- 일부 조직에서는 정책상 안 됩니다

**두 번째: 프라이빗 태스크 + NAT Gateway**
- 외부 API 호출이 많아도 유연합니다
- 구조가 이해하기 쉽습니다
- 하지만 NAT Gateway 시간당 비용과 데이터 비용이 계속 나옵니다

**세 번째: 프라이빗 태스크 + VPC Endpoint**
- AWS 서비스 통신을 내부망으로 제한할 수 있습니다
- 엔드포인트가 많아질수록 관리 포인트가 늘어납니다
- 고정 비용이 계속 발생합니다

결국 어느 패턴이 맞는지는 보안 요구, 비용 구조, 조직 규칙, 운영 능력을 모두 고려해서 정합니다.

한 가지 중요한 디테일: Fargate 태스크가 Private Subnet에서 ECR 이미지를 다운받으려면 `ecr.api`, `ecr.dkr` 엔드포인트와 `S3 gateway endpoint`가 필요합니다. `awslogs`로 로그를 보내려면 CloudWatch Logs 엔드포인트도 필요합니다. 보안은 좋아지지만 운영이 복잡해진다는 뜻입니다.

좋은 아키텍트는 보안 요구와 비용을 같은 테이블에 올려놓습니다. 보안만 외치거나 비용만 외치는 팀은 대개 둘 다 놓칩니다.

---

## 4. 건강 체크는 감지, 복구는 스케줄링

운영 중에 자주 헷갈리는 두 가지가 있습니다. "누가 문제를 감지하나" 그리고 "누가 문제를 고치나"라는 질문입니다. 이 둘을 구분 못하면 건강 체크와 재시작 로직이 마치 한 덩어리처럼 보여요.

ALB와 ECS를 쓸 때는 Target Group 건강 체크와 ECS 배포 정책이 운영 모델을 만듭니다. 체크 경로, 체크 간격, 성공/실패 판정 기준, `minimum healthy percent`, 회로 차단기, `healthCheckGracePeriod` 같은 설정들은 모두 이 질문에 답합니다. "언제 새 태스크를 신뢰할 것인가, 언제 문제라고 할 것인가, 언제 교체할 것인가?"

CDK에서 보면 보통 이렇게 나타납니다.

```typescript
const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "App", {
  cluster,
  minHealthyPercent: 100,
  circuitBreaker: { rollback: true },
  healthCheckGracePeriod: Duration.seconds(30),
  taskImageOptions: {
    image: ecs.ContainerImage.fromRegistry("nginx:latest"),
    containerPort: 3000,
  },
});

service.targetGroup.configureHealthCheck({
  path: "/health",
  healthyHttpCodes: "200",
  interval: Duration.seconds(5),
  timeout: Duration.seconds(4),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 2,
});
```

이건 그냥 옵션 나열이 아닙니다. 새 태스크를 얼마나 빨리 믿을지, 문제를 얼마나 빨리 감지할지, 문제가 생기면 얼마나 빠르게 되돌아갈지를 정하는 운영 정책입니다.

### ALB는 감지만, ECS가 고친다

ALB는 `/health` 같은 경로를 계속 호출해서 응답을 봅니다. 느리거나 실패하면 그 태스크를 "문제 있음(unhealthy)"이라고 표시합니다. 그리고 새 요청은 그 태스크로 안 보냅니다. 반면 ECS는 이 정보를 보고 있다가 원하는 개수를 유지하기 위해 새 태스크를 띄웁니다. 새 배포가 잘 안 되면 회로 차단기 설정에 따라 이전 버전으로 되돌립니다. 즉, ALB가 태스크를 죽이는 게 아니라 "여기 문제 있어"라고 신호만 보냅니다. 실제로 고치는 건 ECS의 일입니다.

### `healthCheckGracePeriod`가 왜 중요할까요?

이 설정은 태스크가 막 시작된 직후 일정 시간 동안 ECS가 건강 체크 실패를 무시하도록 합니다. 만약 이 값이 너무 짧으면 아직 부팅 중인 태스크가 ALB에 "문제 있음"으로 보이고, ECS가 너무 빨리 "아, 이 태스크 안 되네" 하고 다시 시작할 수 있어요. 반대로 너무 길면 실제로 문제 있는 새 버전이 계속 돌아갑니다. 그래서 이 값은 "30초면 될 거야" 하고 대충 정하는 게 아니라 앱이 보통 얼마나 걸려 시작되는지를 반영해야 합니다.

---

## 5. 배포 성공은 컨테이너가 뜰 때가 아니라 신뢰받을 때다

많은 배포 사고는 컨테이너가 `RUNNING` 상태면 성공이라고 착각하면서 시작됩니다. 하지만 ECS/ALB에서 중요한 건 프로세스가 시작되었는지가 아니라 그 프로세스가 서비스에 정식으로 편입될 만큼 믿을 만한가입니다.

예를 들어 `minimum healthy percent`를 높게 두면 배포 중에도 기존 건강한 용량을 유지한다는 뜻입니다. 회로 차단기를 켜두면 새 태스크가 계속 정상화 안 되면 배포를 되돌린다는 뜻이에요.

배포 흐름으로 보면 이렇습니다. ECS가 새 태스크를 띄웁니다 → Target Group에 등록합니다 → ALB가 건강을 확인합니다 → 건강이 확인되면 트래픽이 흘러갑니다 → 충분히 안정화되면 기존 태스크가 내려갑니다. 그래서 배포 성공은 "이미지가 떠 있음"이 아니라 **"새 태스크가 건강 체크를 통과해 서비스 일부로 인정됨"**입니다. 이 기준을 놓치면 배포는 성공했다고 나오는데 서비스는 먹통인 상황을 만날 수 있어요.

---

## 정리: 좋은 아키텍처는 리소스 목록이 아니라 책임의 경계예요

마지막으로 기억할 것들:

- **ALB**는 요청과 건강성 판정을 담당합니다
- **ECS Service**는 실행 상태와 복구를 담당합니다
- **Target Group**은 진입점과 실행 단위를 이어주는 다리입니다
- **보안 그룹 체이닝**은 ALB 우회를 막는 핵심 장치입니다
- **Public Task와 Private Task**는 선악이 아니라 비용, 보안, 운영의 트레이드오프입니다
- **배포 성공**은 컨테이너가 아니라 서비스에 편입됨을 뜻합니다

인프라 설계는 "뭘 쓸 건가"보다 "어디서 책임을 끊을 건가, 어떤 장애를 어느 계층에서 받아낼 건가"의 문제입니다. 이 경계를 이해한 팀은 복잡한 추상화도 제어할 수 있습니다. 경계를 모르는 팀은 서비스 이름을 다 외워도 장애 앞에서 방향을 잃습니다. 좋은 인프라는 복잡한 게 아니라 명확한 거예요.
