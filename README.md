# PPT 자료 - 전체 아키텍처
## Spring Boot AWS 클라우드 금융서비스 백엔드 아키텍처


내용 구성:
- 프로젝트 개요
- 기술 스택
- 전체 아키텍처
- 주요 기능 흐름
- AWS 배포 구성
- 학습 로드맵


┌─────────────────────────────────────────────┐
│          보험비교 플랫폼 (InsureCom)          │
│                                             │
│  고객이 여러 보험사의 상품을 한눈에 비교하고  │
│  AI 상담을 받을 수 있는 금융 서비스 웹사이트  │
└─────────────────────────────────────────────┘

주요 기능 4가지
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  상품검색 │ │  상품비교 │ │ AI챗봇   │ │ 관리자   │
│  + 필터  │ │  (3개)   │ │ 상담     │ │ 대시보드  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

왜 보험인가?
- 실제 금융 도메인 (계약, 고객, 상품, 보장)
- DB 관계가 복잡해서 JPA 학습에 최적
- 인증/인가, 관리자 기능 모두 포함

## 기술 스택 전체 지도

                    [프론트엔드]
                  Thymeleaf + Bootstrap 5
                         │
              ┌──────────▼──────────┐
              │     [웹 서버]        │
              │   Nginx 1.27        │
              │  리버스 프록시       │
              └──────────┬──────────┘
                         │
        ┌────────────────▼────────────────┐
        │         [백엔드 핵심]            │
        │      Spring Boot 3.4.3          │
        │         Java 21                 │
        │                                 │
        │  Spring MVC    Spring Security  │
        │  Spring Data JPA   QueryDSL     │
        │  Spring WebFlux (WebClient)     │
        └───────┬──────────────┬──────────┘
                │              │
    ┌───────────▼──┐    ┌──────▼──────────┐
    │  Oracle 21c  │    │  Gemini AI API  │
    │  (Docker)    │    │  (Google)       │
    └──────────────┘    └─────────────────┘

        [인프라 / 배포]
        Docker + Docker Compose
        → 추후 AWS (EC2, RDS, ECR, ECS)


## 기술 스택 선택 이유

기술                이유
────────────────────────────────────────────
Java 21         LTS 버전. 가상 스레드 등 최신 기능
Spring Boot 3   현업 표준. 자동 설정으로 빠른 시작
Oracle DB       금융권 실제 사용 DB. SQL 심화 학습
JPA + QueryDSL  ORM 기본 + 복잡한 동적 쿼리 처리
Spring Security 인증/인가 실무 패턴 (세션 + JWT)
Docker          개발/운영 환경 일치. AWS 배포 기반
Thymeleaf       서버사이드 렌더링. 백엔드 집중 학습
Gemini AI       실제 AI API 연동 경험
```


## 전체 아키텍처 다이어그램

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  [현재: 로컬 Docker]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

사용자 브라우저
      │
      ▼
┌─────────────────────────────────┐
│  Docker Network: insurance-net  │
│                                 │
│  ┌───────────┐                  │
│  │  Nginx   │← 포트 80          │
│  │  :80     │                  │
│  └─────┬─────┘                  │
│        │ proxy_pass             │
│  ┌─────▼──────────┐             │
│  │  Spring Boot   │← 포트 8080  │
│  │  :8080         │             │
│  └─────┬──────────┘             │
│        │                        │
│  ┌─────▼──────────┐             │
│  │  Oracle XE 21c │← 포트 15210 │
│  │  :1521(내부)   │             │
│  └────────────────┘             │
└─────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  [목표: AWS 클라우드]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

인터넷 → Route 53 (도메인)
           │
           ▼
        ALB (로드밸런서 + HTTPS)
           │
    ┌──────▼──────┐
    │  ECS/EC2    │  ← Docker 컨테이너
    │  Spring Boot│
    └──────┬──────┘
           │
    ┌──────▼──────┐    ┌─────────────┐
    │  RDS Oracle │    │  S3 (파일)  │
    └─────────────┘    └─────────────┘
```


## 레이어드 아키텍처 (계층 구조)

┌─────────────────────────────────────────┐
│            Presentation Layer            │
│         Controller + Thymeleaf          │
│  요청을 받고, 응답을 돌려주는 입구       │
├─────────────────────────────────────────┤
│             Business Layer               │
│                Service                  │
│  실제 업무 로직이 들어있는 핵심 계층     │
├─────────────────────────────────────────┤
│            Persistence Layer             │
│         Repository (JPA + QueryDSL)     │
│  DB와 대화하는 계층                      │
├─────────────────────────────────────────┤
│              Database Layer              │
│              Oracle 21c                 │
│  데이터가 실제로 저장되는 곳             │
└─────────────────────────────────────────┘

핵심 규칙: 위 계층은 아래만 호출
           아래 계층은 위를 모름
           → 역할 분리 = 유지보수 쉬움



## 패키지 구조

```
com.insurance
│
├── config/         설정 (보안규칙, DB설정, 외부API)
│
├── controller/     요청 처리
│   ├── 화면용      /products, /chat, /auth
│   └── API용       /api/products, /api/auth, /api/stats
│
├── service/        비즈니스 로직
│   ├── ProductService    상품 검색/등록/수정/삭제
│   ├── MemberService     회원가입/로그인
│   ├── ChatService       AI 대화 관리
│   ├── GeminiService     Gemini API 호출
│   └── StatsService      통계 데이터
│
├── repository/     DB 접근
│   ├── JPA 기본    메서드명으로 쿼리 자동 생성
│   └── QueryDSL   조건이 많은 복잡한 동적 쿼리
│
├── entity/         DB 테이블 매핑
│   Member / Product / Customer / Contract / ChatHistory
│
├── dto/            데이터 전달 객체
│   요청DTO(Request) / 응답DTO(Response) 분리
│
├── security/       인증/인가
│   JWT 생성·검증 / 필터 / UserDetails
│
└── exception/      예외 처리
    모든 에러를 한 곳에서 통일된 형식으로 응답
```


## ERD (테이블 관계도)

```
MEMBERS                    PRODUCTS
┌────────────────┐         ┌─────────────────────┐
│ MEMBER_ID (PK) │         │ PRODUCT_ID (PK)      │
│ EMAIL          │         │ PRODUCT_NAME         │
│ PASSWORD       │         │ CATEGORY             │
│ NAME           │         │ COMPANY              │
│ ROLE           │         │ MONTHLY_PREMIUM      │
│ REG_DATE       │         │ COVERAGE_AMOUNT      │
└────────────────┘         │ MIN_AGE / MAX_AGE    │
                           │ CONTRACT_PERIOD      │
                           │ RATING               │
                           │ IS_ACTIVE (Y/N)      │
                           │ DESCRIPTION (CLOB)   │
                           └──────────┬───────────┘
                                      │ 1
                       ┌──────────────┼──────────────┐
                       │ N            │ N            │ N
               ┌───────┴──────┐ ┌────┴─────┐ ┌─────┴──────────┐
               │  CONTRACTS   │ │ COVERAGE │ │ PREMIUM        │
               │ CONTRACT_ID  │ │ _ITEMS   │ │ _CONDITIONS    │
               │ CUSTOMER_ID  │ │          │ │                │
               │ PRODUCT_ID   │ └──────────┘ └────────────────┘
               │ CONTRACT_DATE│
               │ MONTHLY_PREM │
               │ STATUS       │
               └──────┬───────┘
                      │ N
               ┌──────┴───────┐
               │  CUSTOMERS   │
               │ CUSTOMER_ID  │
               │ CUSTOMER_NAME│
               │ BIRTH_DATE   │
               │ GENDER       │
               └──────────────┘

CHAT_HISTORY (독립 테이블)
┌──────────────────┐
│ CHAT_ID (PK)     │
│ SESSION_ID       │  ← 브라우저 세션별 대화 구분
│ ROLE             │  ← 'user' or 'model'
│ MESSAGE (CLOB)   │
│ REG_DATE         │
└──────────────────┘
```


## 인증/인가 구조

```
두 가지 인증 방식이 공존

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
방식 1: 세션 기반 (웹 화면)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

브라우저 → POST /auth/login (ID/PW)
              │
              ▼
        Spring Security
        BCrypt로 비밀번호 검증
              │
              ▼
        서버 세션에 사용자 정보 저장
        브라우저에 JSESSIONID 쿠키 발급
              │
              ▼
        이후 요청마다 쿠키로 자동 인증

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
방식 2: JWT 기반 (REST API)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

클라이언트 → POST /api/auth/login
              │
              ▼
        JWT 토큰 발급 (24시간 유효)
        eyJhbGciOiJIUzI1NiJ9...
              │
              ▼
        이후 요청 헤더에 포함:
        Authorization: Bearer eyJ...
              │
              ▼
        JwtAuthenticationFilter가
        매 요청마다 토큰 검증

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
접근 권한 구분
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL 패턴          권한
/                 누구나
/products         누구나
/chat             누구나
/admin/**         ADMIN만
/api/admin/**     ADMIN + JWT
```


## 핵심 요청 흐름 - 상품 검색

```
① 브라우저: GET /products?keyword=종신&category=생명보험

② Nginx: 요청 수신 → Spring Boot로 전달

③ SecurityFilterChain: 공개 URL이므로 통과

④ ProductController.list()
   └─ ProductSearchRequest 파라미터 바인딩
      keyword="종신", category="생명보험", page=0, size=21

⑤ ProductService.searchProducts()
   └─ PageRequest.of(0, 21) 생성

⑥ ProductRepositoryImpl.searchProducts() (QueryDSL)
   └─ 동적 WHERE 조건 조립:
      WHERE is_active = 'Y'
      AND category = '생명보험'
      AND (product_name LIKE '%종신%'
           OR description LIKE '%종신%')
      ORDER BY rating DESC
      OFFSET 0 ROWS FETCH NEXT 21 ROWS ONLY

⑦ Oracle DB 실행 → List<Product> 반환

⑧ ProductDto.from(product) 변환 (Entity → DTO)

⑨ Model에 products, searchRequest, categories 담기

⑩ Thymeleaf: product/list.html 렌더링 → HTML 응답
```

## AI 챗봇 흐름

```
① 사용자: "40대 남성에게 맞는 종신보험 추천해줘"
   POST /api/chat  { message: "..." }

② ChatController → ChatService.chat()

③ ChatService
   └─ DB에서 세션 이전 대화이력 조회 (CHAT_HISTORY)
   └─ 이전 대화 + 새 메시지를 함께 Gemini에 전달
      (대화 맥락 유지)

④ GeminiService.generateContent()
   └─ WebClient로 Gemini API 비동기 호출
   POST https://generativelanguage.googleapis.com/...
   {
     "contents": [
       {"role": "user",   "parts": [{"text": "이전 대화..."}]},
       {"role": "model",  "parts": [{"text": "이전 응답..."}]},
       {"role": "user",   "parts": [{"text": "40대 남성..."}]}
     ]
   }

⑤ Gemini 응답 수신

⑥ ChatService
   └─ 사용자 메시지 DB 저장 (role: 'user')
   └─ AI 응답 DB 저장 (role: 'model')

⑦ { "answer": "40대 남성께는..." } 응답
```

## QueryDSL이 왜 필요한가?

```
━━ 일반 JPA로 검색 조건이 여러 개라면? ━━

// 문제: 조건마다 메서드를 따로 만들어야 함
findByCategory(category)
findByCategoryAndCompany(category, company)
findByCategoryAndKeyword(category, keyword)
findByCategoryAndCompanyAndKeyword(...)
→ 조건 N개면 메서드 2^N개 필요... 불가능

━━ QueryDSL 해결 방법 ━━

queryFactory
  .selectFrom(product)
  .where(
    categoryEq(category),       // null이면 조건 무시
    companyContains(company),   // null이면 조건 무시
    keywordContains(keyword),   // null이면 조건 무시
    premiumBetween(min, max)    // null이면 조건 무시
  )
  .fetch();

→ 있는 조건만 자동으로 AND 조합
→ 타입 안전 (컴파일 시점에 오류 발견)
→ 코드 재사용 가능 (메서드 분리)
```

## DTO를 쓰는 이유

```
Entity를 직접 반환하면?

Product (Entity)
├── id, name, category...
├── List<Contract> contracts   ← 민감 정보
├── List<CoverageItem> items   ← 불필요한 데이터
└── password? ...              ← 절대 노출 금지

문제:
1. 보안: 민감 정보 노출
2. 성능: 연관 데이터 전부 조회 (N+1 문제)
3. 결합도: DB 구조 변경 → API 응답 변경

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DTO 계층 분리

ProductDto (목록용)
└── id, name, category, company,
    monthlyPremium, rating

ProductDetailDto (상세용)
└── 기본 정보 + coverageItems + premiumConditions

→ 필요한 데이터만, 안전하게, 최적화해서 전달
```

## AWS 배포 목표 아키텍처

```
[개발자]
   │ git push
   ▼
[GitHub]
   │ GitHub Actions 자동 실행
   ▼
┌─────────────────────────────────────────┐
│              AWS 클라우드                │
│                                         │
│  [ECR] Docker 이미지 저장소             │
│    │                                    │
│    ▼                                    │
│  [ECS / EC2] 애플리케이션 실행          │
│    │                 │                  │
│    ▼                 ▼                  │
│  [RDS]           [S3]                  │
│  Oracle/MySQL    파일 저장              │
│                                         │
│  [ALB] 로드밸런서 + HTTPS               │
│  [Route 53] 도메인                      │
│  [CloudWatch] 로그/알림                 │
│  [Secrets Manager] 환경변수 보안 관리   │
└─────────────────────────────────────────┘
        │
        ▼
   사용자 브라우저
```

## 학습 로드맵

```
PHASE 1 (환경 + 기초)          PHASE 2 (핵심 개발)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 도구 설치                    □ Entity + JPA 이해
  JDK21, IntelliJ, Docker        Product.java ↔ PRODUCTS 테이블
□ 프로젝트 실행                □ Repository 계층
  docker-compose up -d           JPA 기본 + QueryDSL
□ 코드 구조 파악               □ Service 계층
  패키지별 역할 이해              트랜잭션 + 비즈니스 로직
□ DB 직접 조회                 □ Controller + DTO
  DBeaver로 테이블 확인           요청/응답 흐름
□ API 테스트                   □ Security + JWT
  Postman으로 로그인              인증/인가 구현

PHASE 3 (심화)                  PHASE 4 (AWS + 발표)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 팀 기능 분담 개발            □ EC2 배포
□ AI API 연동                  □ RDS 연동
□ 예외처리 전략                □ CI/CD 파이프라인
□ 성능 최적화                  □ 최종 발표 준비
  인덱스, N+1 해결               PPT + 라이브 데모
```

---

## 마무리

```
백엔드 개발 실전 기술
┌─────────────────────────────────────────┐
│  Spring Boot 3  │  실무 표준 프레임워크  │
│  JPA + QueryDSL │  ORM + 동적 쿼리      │
│  Spring Security│  인증/인가 실무 패턴  │
│  JWT            │  Stateless API 인증   │
│  Oracle DB      │  금융권 실제 사용 DB  │
│  Docker         │  컨테이너 기반 배포   │
│  AWS            │  클라우드 인프라      │
│  AI 연동        │  외부 API 통합        │
└─────────────────────────────────────────┘

소프트 스킬
┌─────────────────────────────────────────┐
│  Git 협업     │  브랜치 전략, PR, 리뷰  │
│  문서화       │  API 명세, ERD, README  │
│  발표         │  기술을 말로 설명하기   │
└─────────────────────────────────────────┘
```
